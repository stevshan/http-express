"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const electron_1 = require("electron");
const tmp = require("tmp");
const path = require("path");
const url = require("url");
const fs = require("fs");
const util = require("util");
const utils = require("../../utilities/utils");
const env_1 = require("../../utilities/env");
class UpdateService {
    constructor(log, updateSettings, httpClient) {
        if (!Object.isObject(log)) {
            throw new Error("log must be supplied.");
        }
        if (!Object.isObject(updateSettings)) {
            throw new Error("updateSettings must be supplied.");
        }
        if (!Object.isObject(httpClient)) {
            throw new Error("httpClient must be supplied.");
        }
        this.log = log;
        this.settings = updateSettings;
        this.httpClient = httpClient;
    }
    async updateAsync() {
        const versionInfo = await this.requestVersionInfoAsync();
        if (semver.gte(electron_1.app.getVersion(), versionInfo.version)) {
            this.log.writeInfoAsync("No update needed: version => current: {} remote: {}", electron_1.app.getVersion(), versionInfo.version);
            return;
        }
        const packageInfo = versionInfo[env_1.env.platform];
        let packageUrl;
        if (!packageInfo) {
            this.log.writeErrorAsync("No package info found for platform: {}.", env_1.env.platform);
            return;
        }
        if (String.isString(packageInfo)) {
            packageUrl = packageInfo;
            await this.requestConfirmationAsync(versionInfo)
                .then((toUpdate) => {
                if (!toUpdate) {
                    return;
                }
                this.log.writeVerboseAsync("Applying the update package and quit the app: {}", path);
                env_1.env.start(url.parse(packageUrl).href);
                electron_1.app.quit();
            });
        }
        else {
            packageUrl = this.getPackagePath(packageInfo);
            await this.requestPackageAsync(packageUrl)
                .then((packagePath) => {
                return this.requestConfirmationAsync(versionInfo)
                    .then((toUpdate) => {
                    if (!toUpdate) {
                        if (fs.existsSync(packagePath)) {
                            fs.unlinkSync(packagePath);
                            this.log.writeVerboseAsync("Removed the local update package: {}", packagePath);
                        }
                        return;
                    }
                    this.log.writeVerboseAsync("Applying the update package and quit the app: {}", packagePath);
                    env_1.env.start(packagePath);
                    electron_1.app.quit();
                });
            });
        }
    }
    requestVersionInfoAsync() {
        const prereleases = semver.prerelease(electron_1.app.getVersion());
        let updateChannel;
        if (!utils.isNullOrUndefined(prereleases) && prereleases.length > 0) {
            updateChannel = prereleases[0];
        }
        else {
            updateChannel = this.settings.defaultChannel || "stable";
        }
        const versionInfoUrl = `${this.settings.baseUrl}/${updateChannel}/${env_1.env.platform}`;
        this.log.writeInfoAsync(`Requesting version info json: ${versionInfoUrl}`);
        return this.httpClient.getAsync(versionInfoUrl)
            .then((response) => {
            if (!response.data) {
                return Promise.reject(`Failed to retrieve the version info: HTTP${response.statusCode} ${response.statusMessage} => ${versionInfoUrl}`);
            }
            return response.data;
        });
    }
    requestConfirmationAsync(versionInfo) {
        return new Promise((resolve) => {
            const buttons = ["Yes", "No"];
            this.log.writeVerboseAsync("Requesting update confirmation from the user ...");
            electron_1.dialog.showMessageBox({
                message: `A newer version, ${versionInfo.version}, is found. Would you like to update now?`,
                detail: versionInfo.description ? versionInfo.description : undefined,
                buttons: buttons,
                defaultId: 1
            }, (response) => {
                this.log.writeInfoAsync("Update confirmation result: {} ({})", buttons[response], response);
                resolve(response === 0);
            });
        });
    }
    getPackagePath(packageInfo) {
        let packagePath = packageInfo[env_1.env.arch];
        if (!packagePath) {
            // fall back to x86 if the current one doesn't exist.
            packagePath = packageInfo[env_1.Architecture.X86];
            this.log.writeVerboseAsync("Fall back to x86 for platform {} from arch {}.", env_1.env.platform, env_1.env.arch);
        }
        if (!packagePath) {
            this.log.writeErrorAsync("Arch {1} is NOT found in {0} package info.", env_1.env.platform, env_1.env.arch);
            return null;
        }
        return packagePath;
    }
    async requestPackageAsync(packagePath) {
        const tempFile = tmp.fileSync({ keep: true, postfix: path.extname(packagePath) });
        this.log.writeInfoAsync("Created temp file for the update package: {}", tempFile.name);
        this.log.writeInfoAsync("Requesting the update package: {}", packagePath);
        return this.httpClient.getAsync(packagePath)
            .then(async (response) => {
            const statusCode = await response.statusCode;
            if (statusCode >= 200 && statusCode < 300) {
                this.log.writeVerboseAsync("Writing update package to file: {}", tempFile.name);
                const fsWriteAsync = util.promisify(fs.write);
                let buffer;
                while (buffer = await response.readAsync()) {
                    await fsWriteAsync(tempFile.fd, buffer);
                }
                fs.closeSync(tempFile.fd);
                return tempFile.name;
            }
            return Promise.reject(new Error(`Downloading update package failed. HTTP ${response.statusCode}: ${response.statusMessage}`));
        });
    }
}
exports.default = UpdateService;
//# sourceMappingURL=update.js.map