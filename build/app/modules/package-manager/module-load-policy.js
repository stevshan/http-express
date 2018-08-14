"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
class ModuleLoadingPolicy {
    constructor(settings) {
        this.settings = settings;
    }
    async shouldLoadAsync(moduleManager, nameOrInfo) {
        if (!String.isString(nameOrInfo)) {
            return true;
        }
        const config = await this.settings.getAsync(common_1.PackageManagerSettingsName);
        const packageConfig = config.packages[nameOrInfo];
        if (!packageConfig) {
            config.packages[nameOrInfo] = {
                enabled: true
            };
            this.settings.setAsync(common_1.PackageManagerSettingsName, config);
            return true;
        }
        if (packageConfig.enabled === false) {
            return false;
        }
        return true;
    }
}
exports.default = ModuleLoadingPolicy;
//# sourceMappingURL=module-load-policy.js.map