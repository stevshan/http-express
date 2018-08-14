"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
// Bootstrap the module host environment.
require("./module-manager/bootstrap");
const appUtils = require("./utilities/appUtils");
process.once("loaded", () => Promise.resolve()
    // Load built-in modules.
    .then(() => moduleManager.loadModuleDirAsync(appUtils.local("modules")))
    // Load extension modules.
    .then(() => moduleManager.getComponentAsync("package-manager"))
    //.then((packageManager) => moduleManager.loadModuleDirAsync(packageManager.packagesDir, "extensions"))
    // Load ad-hoc module
    .then(() => {
    const adhocModuleArg = appUtils.getCmdArg("adhocModule");
    if (adhocModuleArg) {
        return moduleManager.loadModuleAsync(adhocModuleArg, "extensions");
    }
    return Promise.resolve();
}));
//# sourceMappingURL=bootstrap.js.map