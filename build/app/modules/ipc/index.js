"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "ipc.communicator",
        version: appUtils.getAppVersion(),
        descriptor: async (channel, options) => Promise.resolve().then(() => require("./communicator")).then((module) => module.Communicator.fromChannel(channel, options))
    });
    return {
        name: "ipc",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
//# sourceMappingURL=index.js.map