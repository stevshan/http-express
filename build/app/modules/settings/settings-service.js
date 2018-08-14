"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const fileSystem = require("../../utilities/fileSystem");
const appUtils = require("../../utilities/appUtils");
const electron_adapter_1 = require("../../utilities/electron-adapter");
const file_settings_1 = require("./file-settings");
class SettingsService {
    constructor() {
        this.userDataDir = electron_adapter_1.electron.app.getPath("userData");
        fileSystem.ensureDirExists(this.userDataDir);
    }
    get default() {
        return this.defaultSettings ? Promise.resolve(this.defaultSettings) : this.openAsync("settings").then((settings) => this.defaultSettings = settings);
    }
    /**
     * Open a set of settings as a settings chain. If the last settings doesn't support writing,
     * a new writable settings will be created and placed under userData to wrap the settings chain
     * as the last settings object, which provides a writing capability.
     * @param names the names of settings to be open as a settings chain.
     */
    openAsync(...names) {
        if (!Array.isArray(names)) {
            throw new Error("names must be an array of string.");
        }
        let parentSettings = null;
        names.forEach(name => parentSettings = this.openSettings(parentSettings, name));
        if (parentSettings.readonly) {
            // if the last settings doesn't allow writing,
            // create a writable settings file in appData folder to wrap the readonly settings.
            parentSettings = new file_settings_1.default(path.join(this.userDataDir, names[names.length - 1] + ".json"), false, parentSettings);
        }
        return Promise.resolve(parentSettings);
    }
    openSettings(parentSettings, name) {
        if (!String.isString(name)) {
            throw new Error("Invalid settings name!");
        }
        let settingsPath = appUtils.local(name + ".json", true);
        if (!fs.existsSync(settingsPath)) {
            settingsPath = path.join(this.userDataDir, name + ".json");
        }
        return new file_settings_1.default(settingsPath, null, parentSettings);
    }
}
exports.default = SettingsService;
//# sourceMappingURL=settings-service.js.map