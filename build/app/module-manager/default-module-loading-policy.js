"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../utilities/utils");
class DefaultModuleLoadingPolicy {
    async shouldLoadAsync(moduleManager, nameOrInfo) {
        if (!utils.isNullOrUndefined(nameOrInfo) && String.isString(nameOrInfo.hostVersion)) {
            return moduleManager.hostVersion === nameOrInfo.hostVersion;
        }
        return true;
    }
}
exports.default = DefaultModuleLoadingPolicy;
//# sourceMappingURL=default-module-loading-policy.js.map