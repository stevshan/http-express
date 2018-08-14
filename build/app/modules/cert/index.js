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
        name: "cert.pki-service",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: async () => Promise.resolve().then(() => require("./pki-service")).then((module) => new module.PkiService())
    })
        .register({
        name: "cert.cert-loader",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: async () => Promise.resolve().then(() => require("./cert-loader")).then((module) => new module.CertLoader())
    });
    return {
        name: "cert",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map