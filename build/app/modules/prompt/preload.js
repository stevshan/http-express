"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_1 = require("../../module-manager/bootstrap");
const prompt_context_1 = require("./prompt-context");
const appUtils = require("../../utilities/appUtils");
(async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;
    await bootstrap_1.default;
    moduleManager.register({
        name: "prompt.prompt-context",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor: async () => new prompt_context_1.PromptContext()
    });
})();
//# sourceMappingURL=preload.js.map