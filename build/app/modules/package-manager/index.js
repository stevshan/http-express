"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components
        .register({
        name: "package-manager",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: (settings, httpsClient) => Promise.resolve().then(() => require("./package-manager")).then((module) => new module.default(settings, httpsClient)),
        deps: ["settings", "http.https-client"]
    });
    return {
        name: "package-manager",
        version: appUtils.getAppVersion()
    };
};
exports.initializeAsync = (moduleManager) => moduleManager.getComponentAsync("settings")
    .then((settings) => Promise.resolve().then(() => require("./module-load-policy")).then((module) => new module.default(settings)))
    .then((policy) => moduleManager.setModuleLoadingPolicy(policy));
//# sourceMappingURL=index.js.map