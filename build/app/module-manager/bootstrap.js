"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
require("../utilities/utils");
const simpleContext = require("./simple-context");
const electron = require("electron");
const appUtils = require("../utilities/appUtils");
const communicator_1 = require("../modules/ipc/communicator");
const module_manager_1 = require("./module-manager");
const bootstrapPromise = (() => {
    appUtils.logUnhandledRejection();
    let constructorOptions;
    let communicator;
    if (electron.ipcMain) { // Electron main process
        communicator = undefined;
        constructorOptions = {
            hostVersion: appUtils.getAppVersion()
        };
    }
    else if (electron.ipcRenderer) { // Electron renderer
        const contextId = `ModuleManagerConstructorOptions-${electron.remote.getCurrentWindow().id}`;
        communicator = communicator_1.Communicator.fromChannel(electron.ipcRenderer);
        if (electron.remote.getCurrentWindow().webContents.id === electron.remote.getCurrentWebContents().id) {
            constructorOptions = JSON.parse(appUtils.getCmdArg(module_manager_1.ModuleManager.ConstructorOptionsCmdArgName));
            simpleContext.writeContext(contextId, constructorOptions);
        }
        else {
            constructorOptions = simpleContext.readContext(contextId);
        }
    }
    else { // Node.js process
        communicator = communicator_1.Communicator.fromChannel(process);
        constructorOptions = JSON.parse(appUtils.getCmdArg(module_manager_1.ModuleManager.ConstructorOptionsCmdArgName));
    }
    const moduleManager = new module_manager_1.ModuleManager(constructorOptions.hostVersion, communicator);
    appUtils.injectModuleManager(moduleManager);
    if (Array.isArray(constructorOptions.initialModules)) {
        return Promise.all(constructorOptions.initialModules.map((moduleLoadingInfo) => moduleManager.loadModuleAsync(moduleLoadingInfo.location, undefined, true)));
    }
    return Promise.resolve();
})();
exports.default = bootstrapPromise;
//# sourceMappingURL=bootstrap.js.map