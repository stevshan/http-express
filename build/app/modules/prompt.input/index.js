"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "prompt.input",
        version: appUtils.getAppVersion(),
        descriptor: (promptService, parentWindowId, options) => promptService.createAsync({
            parentWindowId: parentWindowId,
            pageUrl: appUtils.resolve("input.html"),
            height: 225,
            data: options
        }),
        deps: ["prompt.prompt-service"]
    });
    return {
        name: "prompt.input",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map