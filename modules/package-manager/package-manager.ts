//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "http-express.common";
import { ISettings } from "http-express.settings";
import {
    IPackageManager,
    IPackageRepository,
    IPackageRepositoryConfig,
    IPackageInfo,
    ISearchResult
} from "http-express.package-manager";
import { IHttpClient } from "http-express.http";

import * as path from "path";
import * as crypto from "crypto";
import * as tar from "tar";
import * as fs from "fs";
import * as tmp from "tmp";
import * as util from "util";

import { electron } from "../../utilities/electron-adapter";
import * as utils from "../../utilities/utils";
import * as fileSystem from "../../utilities/fileSystem";
import { IPackageManagerConfig, PackageManagerSettingsName } from "./common";

namespace NpmRegistry {
    export interface IContinuationToken {
        text: string;
        offset: number;
        size: number;
    }

    export interface ILinks {
        npm: string;
        homepage: string;
        repository: string;
        bugs: string;
    }

    export interface ISearchResultPackage {
        name: string;
        version: string;
        description: string;
        keywords: Array<string>;
        date: Date;
        links: ILinks;
        publisher: IContact | string;
        maintainers: Array<IContact | string>;
    }

    export interface ISearchResultStoreDetail {
        quality: number;
        popularity: number;
        maintenance: number;
    }

    export interface ISearchResultScore {
        final: number;
        detail: ISearchResultStoreDetail;
    }

    export interface ISearchResultItem {
        package: ISearchResultPackage;
        score: ISearchResultScore;
        searchScore: number;
    }

    export interface ISearchResult {
        objects: Array<ISearchResultItem>;
        total: number;
        time: Date;
    }

    export interface IDistTags {
        latest: string;
        next: string;
    }

    export interface IDistribution {
        shasum: string;
        tarball: string;
    }

    export interface INpmPackage {
        name: string;
        description: string;
        version: string;
        homepage?: string;
        repository?: ISourceRepository;
        author: IContact | string;
        license?: string;
        dist?: IDistribution;
        maintainers?: Array<IContact | string>;
        keywords?: Array<string>;
    }

    export interface IContact {
        name: string;
        email: string;
        url: string;
    }

    export interface ISourceRepository {
        type: string;
        url: string;
    }

    export interface IIssueSite {
        url: string;
    }

    export interface IModuleInfo {
        name: string;
        description: string;
        "dist-tags": IDistTags;
        versions: IDictionary<INpmPackage>;
        readme: string;
        maintainers: Array<IContact | string>;
        author: IContact | string;
        repository: ISourceRepository;
        readmeFilename: string;
        homepage: string;
        bugs: IIssueSite;
        license: string;
        keywords: Array<string>;
    }
}

function isPackageRepositoryConfig(repoConfig: IPackageRepositoryConfig): boolean {
    return !utils.isNullOrUndefined(repoConfig)
        && String.isString(repoConfig.name)
        && String.isString(repoConfig.url);
}

function getHashAsync(hashName: string, filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const hashProv = crypto.createHash(hashName);
        const fileStream = fs.createReadStream(filePath);

        fileStream.on("end", () => {
            hashProv.end();

            const hashResult = hashProv.read();

            if (String.isString(hashResult)) {
                resolve(hashResult);
            } else if (hashResult instanceof Buffer) {
                resolve(hashResult.toString("hex"));
            } else {
                reject(new Error("Unknown type of hash result."));
            }
        });

        fileStream.pipe(hashProv);
    });
}

function ModuleInfoToPackageInfo(moduleInfo: NpmRegistry.IModuleInfo): IPackageInfo {
    const versionInfo = moduleInfo.versions[moduleInfo["dist-tags"].latest];
    const keywords: Array<string> = [];

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

function NpmPackageToPackageInfo(npmPackage: NpmRegistry.INpmPackage): IPackageInfo {
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

function SearchResultPackageToPackageInfo(packageInfo: NpmRegistry.ISearchResultPackage): IPackageInfo {
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

function toSearchResult(npmSearchResult: NpmRegistry.ISearchResult): ISearchResult {
    return {
        continuationToken: null,
        packages: npmSearchResult.objects.map((obj) => SearchResultPackageToPackageInfo(obj.package))
    };
}

class PackageRepository implements IPackageRepository {
    public readonly config: Promise<IPackageRepositoryConfig>;

    private readonly packagesDir: string;

    private readonly httpClient: IHttpClient;

    public async installPackageAsync(packageName: string): Promise<boolean> {
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

    public async getPackageMetadataAsync(packageName: string): Promise<IPackageInfo> {
        return ModuleInfoToPackageInfo(await this.getModuleInfoAsync(packageName));
    }

    public async searchAsync(text: string, resultSize: number, offset?: number): Promise<ISearchResult> {
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
            }).then((npmSearchResult: NpmRegistry.ISearchResult) => {
                const searchResult = toSearchResult(npmSearchResult);

                searchResult.continuationToken = JSON.stringify(<NpmRegistry.IContinuationToken>{
                    size: resultSize,
                    offset: offset,
                    text: text
                });

                return searchResult;
            });
    }

    public searchNextAsync(continuationToken: string): Promise<ISearchResult> {
        if (!String.isString(continuationToken) || String.isEmptyOrWhitespace(continuationToken)) {
            throw new Error("continuationToken must be provided.");
        }

        const token: NpmRegistry.IContinuationToken = JSON.parse(continuationToken);

        return this.searchAsync(token.text, token.size, token.offset + token.size);
    }

    constructor(packagesDir: string, httpClient: IHttpClient, repoConfig: IPackageRepositoryConfig) {
        this.packagesDir = packagesDir;
        this.httpClient = httpClient;
        this.config = Promise.resolve(repoConfig);
    }

    private async getModuleInfoAsync(packageName: string): Promise<NpmRegistry.IModuleInfo> {
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

    private downloadPackageAsync(packageUrl: string): Promise<string> {
        return this.httpClient.getAsync(packageUrl)
            .then(async (response) => {
                const statusCode = await response.statusCode;

                if (statusCode >= 200 && statusCode < 300) {
                    const tempFile: { name: string; fd: number } =
                        tmp.fileSync({ keep: true, postfix: path.extname(packageUrl) });

                    const fsWriteAsync = util.promisify(fs.write);
                    let chunk: Buffer;

                    while (chunk = await <Promise<Buffer>>response.readAsync()) {
                        await fsWriteAsync(tempFile.fd, chunk);
                    }

                    fs.closeSync(tempFile.fd);

                    return tempFile.name;
                }

                return Promise.reject(
                    new Error(`Failed to download package (${packageUrl}): HTTP ${response.statusCode} => ${response.statusMessage}`));
            });
    }
}

export default class PackageManager implements IPackageManager {
    private readonly settings: ISettings;

    private httpClient: IHttpClient;

    private config: Promise<IPackageManagerConfig>;

    private repos: IDictionary<IPackageRepository>;

    public get packagesDir(): Promise<string> {
        return this.config.then(config => config.packagesDir);
    }

    constructor(settings: ISettings, httpClient: IHttpClient) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be provided.");
        }

        if (!Object.isObject(httpClient)) {
            throw new Error("httpClient must be provided.");
        }

        this.settings = settings;
        this.repos = Object.create(null);
        this.httpClient = httpClient;
        this.config = settings.getAsync<IPackageManagerConfig>(PackageManagerSettingsName)
            .then((config) => {
                if (!Object.isObject(config.repos)) {
                    config.repos = Object.create(null);
                }

                if (!Object.isObject(config.packages)) {
                    config.packages = Object.create(null);
                }

                if (!String.isString(config.packagesDir)) {
                    config.packagesDir = path.resolve(electron.app.getPath("userData"), "packages");
                } else {
                    config.packagesDir = path.resolve(electron.app.getPath("userData"), config.packagesDir);
                }

                fileSystem.ensureDirExists(config.packagesDir);

                settings.setAsync(PackageManagerSettingsName, config);

                return config;
            });

        this.loadInstalledPackageInfosAsync(true);
    }

    public async addRepoAsync(repoConfig: IPackageRepositoryConfig): Promise<void> {
        if (!isPackageRepositoryConfig(repoConfig)) {
            throw new Error("A valid repoConfig must be provided.");
        }

        this.config.then((config) => {
            config.repos[repoConfig.name] = repoConfig;
            this.settings.setAsync(PackageManagerSettingsName, config);
        });
    }

    public async removeRepoAsync(repoName: string): Promise<void> {
        this.config.then(config => {
            delete config.repos[repoName];
            this.settings.setAsync(PackageManagerSettingsName, config);
        });
    }

    public async getRepoAsync(repoName: string): Promise<IPackageRepository> {
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

    public async getRepoByUrlAsync(repoUrlString: string): Promise<IPackageRepository> {
        const config = await this.config;
        const repoUrl = new URL(repoUrlString);

        let repo = this.repos[repoUrl.href];

        if (!repo) {
            repo = new PackageRepository(config.packagesDir, this.httpClient, { url: repoUrl.href });
            this.repos[repoUrl.href] = repo;
        }

        return repo;
    }

    public getRepoConfigAsync(repoName: string): Promise<IPackageRepositoryConfig> {
        if (!String.isString(repoName) || String.isEmptyOrWhitespace(repoName)) {
            throw new Error("repoName must be provided.");
        }

        return this.config.then((config) => config.repos[repoName]);
    }

    public getReposAsync(): Promise<Array<IPackageRepository>> {
        return this.config.then(config => Promise.all(Object.keys(config.repos).map((repoName) => this.getRepoAsync(repoName))));
    }

    public getRepoConfigsAsync(): Promise<Array<IPackageRepositoryConfig>> {
        return this.config.then(config => Object.values(config.repos));
    }

    public getInstalledPackageInfosAsync(): Promise<Array<IPackageInfo>> {
        return this.loadInstalledPackageInfosAsync(false);
    }

    public async uninstallPackageAsync(packageName: string): Promise<void> {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }

        this.config.then(config => {
            fileSystem.rmdir(path.join(config.packagesDir, packageName));
            this.settings.setAsync(PackageManagerSettingsName, config);
        });
    }

    public async relaunchAsync(): Promise<void> {
        electron.app.relaunch();
        electron.app.quit();
    }

    public async enablePackageAsync(packageName: string, enable?: boolean): Promise<void> {
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
        await this.settings.setAsync(PackageManagerSettingsName, config);
    }

    private async loadInstalledPackageInfosAsync(removeUninstalled: boolean): Promise<Array<IPackageInfo>> {
        const packageInfos: Array<IPackageInfo> = [];
        const config = await this.config;
        const knownPackageNames =
            new Set(
                Object.keys(config.packages)
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
                } else {
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

        await this.settings.setAsync(PackageManagerSettingsName, config);

        return packageInfos;
    }
}
