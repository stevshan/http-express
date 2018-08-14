"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "prompt.select-certificate",
        version: appUtils.getAppVersion(),
        descriptor: (promptService, parentWindowId, certificates) => {
            if (!Object.isObject(promptService)) {
                throw new Error("promptService must be supplied.");
            }
            if (!Array.isArray(certificates)) {
                throw new Error("certificates must be supplied.");
            }
            return promptService.createAsync({
                parentWindowId: parentWindowId,
                pageUrl: appUtils.resolve("select-certificate.html"),
                height: 640,
                data: certificates
            });
        },
        deps: ["prompt.prompt-service"]
    });
    return {
        name: "prompt.select-certificate",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map