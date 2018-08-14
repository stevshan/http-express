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
        name: "remoting.utils",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: () => Promise.resolve().then(() => require("./utils")).then((module) => new module.Utils())
    })
        .register({
        name: "remoting.pattern.string",
        version: appUtils.getAppVersion(),
        singleton: false,
        descriptor: (pattern) => Promise.resolve().then(() => require("./pattern/string")).then((module) => new module.default(pattern))
    })
        .register({
        name: "remoting.pattern.regex",
        version: appUtils.getAppVersion(),
        singleton: false,
        descriptor: (pattern) => Promise.resolve().then(() => require("./pattern/regex")).then((module) => new module.default(pattern))
    });
    return {
        name: "remoting",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
//# sourceMappingURL=index.js.map