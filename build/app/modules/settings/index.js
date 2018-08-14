"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components
        .register({
        name: "settings.service",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: () => Promise.resolve().then(() => require("./settings-service")).then((module) => new module.default())
    })
        .register({
        name: "settings",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: async (settingsSvc) => settingsSvc.default,
        deps: ["settings.service"]
    });
    return {
        name: "settings",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map