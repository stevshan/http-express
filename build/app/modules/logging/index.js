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
        name: "logging",
        version: appUtils.getAppVersion(),
        descriptor: (settings) => Promise.resolve().then(() => require("./log")).then(async (logging) => logging.createAsync(await settings.getAsync("logging"))),
        singleton: true,
        deps: ["settings"]
    })
        .register({
        name: "logging.logger.console",
        version: appUtils.getAppVersion(),
        descriptor: (loggerSettings, targetConsole) => Promise.resolve().then(() => require("./loggers/console")).then((module) => new module.default(loggerSettings, targetConsole))
    })
        .register({
        name: "logging.logger.app-insights",
        version: appUtils.getAppVersion(),
        descriptor: (loggerSettings) => Promise.resolve().then(() => require("./loggers/app-insights")).then((module) => new module.default(loggerSettings))
    });
    return {
        name: "logging",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map