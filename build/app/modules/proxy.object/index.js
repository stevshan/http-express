"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "remoting.proxy",
        version: appUtils.getAppVersion(),
        deps: ["module-manager"],
        descriptor: async (moduleManager, pattern, communicator, ownCommunicator) => {
            const utils = await Promise.resolve().then(() => require("../../utilities/utils"));
            const util = await Promise.resolve().then(() => require("util"));
            let routePattern;
            if (utils.isNullOrUndefined(pattern)) {
                routePattern = await moduleManager.getComponentAsync("remoting.pattern.string", "proxy.object");
            }
            else if (String.isString(pattern)) {
                routePattern = await moduleManager.getComponentAsync("remoting.pattern.string", pattern);
            }
            else if (util.isRegExp(pattern)) {
                routePattern = await moduleManager.getComponentAsync("remoting.pattern.regex", pattern);
            }
            else {
                throw new Error("The type of pattern is not suppored.");
            }
            return Promise.resolve().then(() => require("./proxy.object")).then((module) => module.ObjectRemotingProxy.create(routePattern, communicator, ownCommunicator));
        }
    });
    return {
        name: "proxy.object",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
//# sourceMappingURL=index.js.map