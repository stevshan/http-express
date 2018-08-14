"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../../utilities/utils");
class Settings {
    constructor(initialSettings, readonly, parentSettings) {
        this.parentSettings = utils.isNullOrUndefined(parentSettings) ? undefined : parentSettings;
        this.readonly = utils.isNullOrUndefined(readonly) ? false : readonly;
        if (utils.isNullOrUndefined(initialSettings)) {
            this.settings = Object.create(null);
        }
        else {
            this.settings = initialSettings;
        }
    }
    getAsync(settingPath) {
        if (!settingPath || !String.isString(settingPath)) {
            throw new Error(`Invalid setting path: ${settingPath}`);
        }
        const pathParts = settingPath.split("/");
        let settingValue = this.settings;
        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (!Object.isObject(settingValue)) {
                settingValue = undefined;
                break;
            }
            settingValue = settingValue[pathParts[pathPartIndex]];
        }
        if (settingValue === undefined && this.parentSettings !== undefined) {
            return this.parentSettings.getAsync(settingPath);
        }
        return Promise.resolve(settingValue);
    }
    async setAsync(settingPath, value) {
        if (this.readonly) {
            throw new Error("Readonly settings cannot be modified.");
        }
        if (!settingPath || !String.isString(settingPath)) {
            throw new Error(`Invalid setting path: ${settingPath}`);
        }
        const pathParts = settingPath.split("/");
        let settingValue = this.settings;
        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (settingValue === null || (!Array.isArray(settingValue) && !Object.isObject(settingValue))) {
                throw new Error("Unable to travel the settings path because the settings type is not array or object or it is null.");
            }
            const pathPart = pathParts[pathPartIndex];
            if (pathPartIndex === pathParts.length - 1) {
                if (value === undefined) {
                    delete settingValue[pathPart];
                }
                else {
                    settingValue[pathPart] = value;
                }
            }
            else if (settingValue[pathPart] === undefined) {
                settingValue[pathPart] = Object.create(null);
            }
            settingValue = settingValue[pathPart];
        }
    }
}
exports.default = Settings;
//# sourceMappingURL=settings.js.map