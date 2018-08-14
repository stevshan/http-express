"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const utils = require("../../utilities/utils");
const settings_1 = require("./settings");
class FileSettings extends settings_1.default {
    constructor(settingsPath, readOnly, parentSettings) {
        if (utils.isNullOrUndefined(settingsPath)) {
            throw new Error("settingsPath must be supplied.");
        }
        let initialSettings;
        if (!fs.existsSync(settingsPath)) {
            if (readOnly === true) {
                throw new Error(`Settings file, ${settingsPath}, doesn't exist.`);
            }
            initialSettings = Object.create(null);
            fs.writeFileSync(settingsPath, JSON.stringify(initialSettings), { encoding: "utf8" });
        }
        else {
            initialSettings = JSON.parse(fs.readFileSync(settingsPath, { encoding: "utf8" }));
            if (utils.isNullOrUndefined(readOnly) || readOnly === false) {
                try {
                    fs.appendFileSync(settingsPath, "", { encoding: "utf8" });
                    readOnly = false;
                }
                catch (err) {
                    if (readOnly === false) {
                        throw new Error(`No permission to write settings file, {settingsPath}. error: {err}`);
                    }
                    else {
                        readOnly = true;
                    }
                }
            }
        }
        super(initialSettings, readOnly, parentSettings);
        this.settingsPath = settingsPath;
    }
    getAsync(settingPath) {
        return super.getAsync(settingPath);
    }
    async set(settingPath, value) {
        await super.setAsync(settingPath, value);
        fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 4), { encoding: "utf8" });
    }
}
exports.default = FileSettings;
//# sourceMappingURL=file-settings.js.map