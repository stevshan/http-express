"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const crypto = require("crypto");
const tar = require("tar");
const fs = require("fs");
const tmp = require("tmp");
const util = require("util");
const electron_adapter_1 = require("../../utilities/electron-adapter");
const utils = require("../../utilities/utils");
const fileSystem = require("../../utilities/fileSystem");
const common_1 = require("./common");
function isPackageRepositoryConfig(repoConfig) {
    return !utils.isNullOrUndefined(repoConfig)
        && String.isString(repoConfig.name)
        && String.isString(repoConfig.url);
}
function getHashAsync(hashName, filePath) {
    return new Promise((resolve, reject) => {
        const hashProv = crypto.createHash(hashName);
        const fileStream = fs.createReadStream(filePath);
        fileStream.on("end", () => {
            hashProv.end();
            const hashResult = hashProv.read();
            if (String.isString(hashResult)) {
                resolve(hashResult);
            }
            else if (hashResult instanceof Buffer) {
                resolve(hashResult.toString("hex"));
            }
            else {
                reject(new Error("Unknown type of hash result."));
            }
        });
        fileStream.pipe(hashProv);
    });
}
function ModuleInfoToPackageInfo(moduleInfo) {
    const versionInfo = moduleInfo.versions[moduleInfo["dist-tags"].latest];
    const keywords = [];
    if (Array.isArray(moduleInfo.keywords)) {
        keywords.push(...moduleInfo.keywords);
    }
    if (Array.isArray(versionInfo.keywords)) {
        keywords.push(...versionInfo.keywords);
    }
    return {
        name: moduleInfo.name,
        description: moduleInfo.description,
        version: versionInfo.version,
        readme: moduleInfo.readme,
        maintainers: moduleInfo.maintainers,
        author: moduleInfo.author,
        sourceRepository: moduleInfo.repository,
        homepage: moduleInfo.homepage,
        license: versionInfo.license,
        keywords: keywords
    };
}
function NpmPackageToPackageInfo(npmPackage) {
    return {
        name: npmPackage.name,
        description: npmPackage.description,
        version: npmPackage.version,
        maintainers: npmPackage.maintainers,
        author: npmPackage.author,
        sourceRepository: npmPackage.repository,
        homepage: npmPackage.homepage,
        license: npmPackage.license,
        keywords: npmPackage.keywords
    };
}
function SearchResultPackageToPackageInfo(packageInfo) {
    return {
        name: packageInfo.name,
        description: packageInfo.description,
        version: packageInfo.version,
        maintainers: packageInfo.maintainers,
        author: packageInfo.publisher,
        homepage: packageInfo.links.homepage,
        keywords: packageInfo.keywords
    };
}
function toSearchResult(npmSearchResult) {
    return {
        continuationToken: null,
        packages: npmSearchResult.objects.map((obj) => SearchResultPackageToPackageInfo(obj.package))
    };
}
class PackageRepository {
    async installPackageAsync(packageName) {
        const moduleInfo = await this.getModuleInfoAsync(packageName);
        if (!moduleInfo) {
            return false;
        }
        const versionConfig = moduleInfo.versions[moduleInfo["dist-tags"].latest];
        const downloadedPackagePath = await this.downloadPackageAsync(versionConfig.dist.tarball);
        const shasum = await getHashAsync("sha1", downloadedPackagePath);
        if (versionConfig.dist.shasum !== shasum) {
            throw new Error(`The shasum (${shasum}) of downloaded package (packageName: ${packageName}) is different from the version config (${versionConfig.dist.shasum}).`);
        }
        const extractDir = tmp.dirSync().name;
        tar.extract({
            cwd: extractDir,
            file: downloadedPackagePath,
            sync: true
        });
        fileSystem.copyfiles(path.join(extractDir, "package"), path.join(this.packagesDir, packageName));
        return true;
    }
    async getPackageMetadataAsync(packageName) {
        return ModuleInfoToPackageInfo(await this.getModuleInfoAsync(packageName));
    }
    async searchAsync(text, resultSize, offset) {
        if (!String.isString(text) || String.isEmptyOrWhitespace(text)) {
            throw new Error("text must be provided.");
        }
        if (!Number.isSafeInteger(resultSize)) {
            throw new Error("resultSize must be a safe integer.");
        }
        resultSize = resultSize < 0 ? 20 : resultSize;
        if (!utils.isNullOrUndefined(offset) && !Number.isSafeInteger(offset)) {
            throw new Error("offset must be a safe integer.");
        }
        offset = offset && offset >= 0 ? offset : 0;
        const searchUrl = new URL("/-/v1/search", (await this.config).url);
        searchUrl.searchParams.append("text", text);
        searchUrl.searchParams.append("size", resultSize.toString());
        searchUrl.searchParams.append("from", offset.toString());
        return this.httpClient.getAsync(searchUrl.href)
            .then(async (response) => {
            if (!response.data) {
                return Promise.reject(new Error(`Failed to search (${searchUrl}): HTTP${await response.statusCode} => ${await response.statusMessage}`));
            }
            return response.data;
        }).then((npmSearchResult) => {
            const searchResult = toSearchResult(npmSearchResult);
            searchResult.continuationToken = JSON.stringify({
                size: resultSize,
                offset: offset,
                text: text
            });
            return searchResult;
        });
    }
    searchNextAsync(continuationToken) {
        if (!String.isString(continuationToken) || String.isEmptyOrWhitespace(continuationToken)) {
            throw new Error("continuationToken must be provided.");
        }
        const token = JSON.parse(continuationToken);
        return this.searchAsync(token.text, token.size, token.offset + token.size);
    }
    constructor(packagesDir, httpClient, repoConfig) {
        this.packagesDir = packagesDir;
        this.httpClient = httpClient;
        this.config = Promise.resolve(repoConfig);
    }
    async getModuleInfoAsync(packageName) {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }
        const packageConfigUrl = new URL(packageName, (await this.config).name);
        return this.httpClient.getAsync(packageConfigUrl.href)
            .then(async (response) => {
            if (!response.data) {
                if (await response.statusCode === 404) {
                    return undefined;
                }
                return Promise.reject(new Error(`Failed to request package config for package: ${packageConfigUrl}`));
            }
            return response.data;
        });
    }
    downloadPackageAsync(packageUrl) {
        return this.httpClient.getAsync(packageUrl)
            .then(async (response) => {
            const statusCode = await response.statusCode;
            if (statusCode >= 200 && statusCode < 300) {
                const tempFile = tmp.fileSync({ keep: true, postfix: path.extname(packageUrl) });
                const fsWriteAsync = util.promisify(fs.write);
                let chunk;
                while (chunk = await response.readAsync()) {
                    await fsWriteAsync(tempFile.fd, chunk);
                }
                fs.closeSync(tempFile.fd);
                return tempFile.name;
            }
            return Promise.reject(new Error(`Failed to download package (${packageUrl}): HTTP ${response.statusCode} => ${response.statusMessage}`));
        });
    }
}
class PackageManager {
    get packagesDir() {
        return this.config.then(config => config.packagesDir);
    }
    constructor(settings, httpClient) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be provided.");
        }
        if (!Object.isObject(httpClient)) {
            throw new Error("httpClient must be provided.");
        }
        this.settings = settings;
        this.repos = Object.create(null);
        this.httpClient = httpClient;
        this.config = settings.getAsync(common_1.PackageManagerSettingsName)
            .then((config) => {
            if (!Object.isObject(config.repos)) {
                config.repos = Object.create(null);
            }
            if (!Object.isObject(config.packages)) {
                config.packages = Object.create(null);
            }
            if (!String.isString(config.packagesDir)) {
                config.packagesDir = path.resolve(electron_adapter_1.electron.app.getPath("userData"), "packages");
            }
            else {
                config.packagesDir = path.resolve(electron_adapter_1.electron.app.getPath("userData"), config.packagesDir);
            }
            fileSystem.ensureDirExists(config.packagesDir);
            settings.setAsync(common_1.PackageManagerSettingsName, config);
            return config;
        });
        this.loadInstalledPackageInfosAsync(true);
    }
    async addRepoAsync(repoConfig) {
        if (!isPackageRepositoryConfig(repoConfig)) {
            throw new Error("A valid repoConfig must be provided.");
        }
        this.config.then((config) => {
            config.repos[repoConfig.name] = repoConfig;
            this.settings.setAsync(common_1.PackageManagerSettingsName, config);
        });
    }
    async removeRepoAsync(repoName) {
        this.config.then(config => {
            delete config.repos[repoName];
            this.settings.setAsync(common_1.PackageManagerSettingsName, config);
        });
    }
    async getRepoAsync(repoName) {
        if (!String.isString(repoName)) {
            throw new Error("A valid repoName must be provided.");
        }
        const config = await this.config;
        const repoConfig = config.repos[repoName];
        if (!repoConfig) {
            return undefined;
        }
        const repoUrl = await repoConfig.url;
        let repo = this.repos[repoUrl];
        if (!repo) {
            repo = new PackageRepository(config.packagesDir, this.httpClient, repoConfig);
            this.repos[repoUrl] = repo;
        }
        return repo;
    }
    async getRepoByUrlAsync(repoUrlString) {
        const config = await this.config;
        const repoUrl = new URL(repoUrlString);
        let repo = this.repos[repoUrl.href];
        if (!repo) {
            repo = new PackageRepository(config.packagesDir, this.httpClient, { url: repoUrl.href });
            this.repos[repoUrl.href] = repo;
        }
        return repo;
    }
    getRepoConfigAsync(repoName) {
        if (!String.isString(repoName) || String.isEmptyOrWhitespace(repoName)) {
            throw new Error("repoName must be provided.");
        }
        return this.config.then((config) => config.repos[repoName]);
    }
    getReposAsync() {
        return this.config.then(config => Promise.all(Object.keys(config.repos).map((repoName) => this.getRepoAsync(repoName))));
    }
    getRepoConfigsAsync() {
        return this.config.then(config => Object.values(config.repos));
    }
    getInstalledPackageInfosAsync() {
        return this.loadInstalledPackageInfosAsync(false);
    }
    async uninstallPackageAsync(packageName) {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }
        this.config.then(config => {
            fileSystem.rmdir(path.join(config.packagesDir, packageName));
            this.settings.setAsync(common_1.PackageManagerSettingsName, config);
        });
    }
    async relaunchAsync() {
        electron_adapter_1.electron.app.relaunch();
        electron_adapter_1.electron.app.quit();
    }
    async enablePackageAsync(packageName, enable) {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }
        const config = await this.config;
        let packageConfig = config.packages[packageName];
        if (!packageConfig) {
            config.packages[packageName] = {
                enabled: true
            };
            packageConfig = config.packages[packageName];
        }
        packageConfig.enabled = utils.getValue(enable, true);
        await this.settings.setAsync(common_1.PackageManagerSettingsName, config);
    }
    async loadInstalledPackageInfosAsync(removeUninstalled) {
        const packageInfos = [];
        const config = await this.config;
        const knownPackageNames = new Set(Object.keys(config.packages)
            .concat(fs.readdirSync(config.packagesDir)));
        for (const packageName of knownPackageNames) {
            const subDir = path.join(config.packagesDir, packageName);
            if (!fs.existsSync(subDir)) {
                if (!removeUninstalled) {
                    packageInfos.push({
                        name: packageName,
                        version: null,
                        maintainers: null,
                        author: null,
                        status: "Uninstalled"
                    });
                }
                else {
                    delete config.packages[packageName];
                }
                continue;
            }
            const stat = fs.statSync(subDir);
            if (!stat.isDirectory()) {
                continue;
            }
            const packageInfo = NpmPackageToPackageInfo(JSON.parse(fs.readFileSync(path.join(subDir, "package.json"), { encoding: "utf8" })));
            const packageConfig = config.packages[packageInfo.name];
            packageInfo.status = "Installed";
            if (packageConfig) {
                packageInfo.status = packageConfig.enabled ? "Enabled" : "Disabled";
            }
            packageInfos.push(packageInfo);
        }
        await this.settings.setAsync(common_1.PackageManagerSettingsName, config);
        return packageInfos;
    }
}
exports.default = PackageManager;
//# sourceMappingURL=package-manager.js.map