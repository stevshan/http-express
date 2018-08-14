"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "update",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: async (log, settings, httpsClient) => settings.getAsync("update")
            .then((updateSettings) => Promise.resolve().then(() => require("./update")).then((module) => new module.default(log, updateSettings, httpsClient))),
        deps: ["logging", "settings", "http.https-client"]
    });
    return {
        name: "update",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map