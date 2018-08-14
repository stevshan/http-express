"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "prompt.prompt-service",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: (moduleManager) => Promise.resolve().then(() => require("./prompt")).then((module) => new module.PromptService(moduleManager)),
        deps: ["module-manager"]
    });
    return {
        name: "prompt",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map