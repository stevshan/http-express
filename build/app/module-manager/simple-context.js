"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const ChannelName = "simple-context";
var ContextAction;
(function (ContextAction) {
    ContextAction["Read"] = "read-context";
    ContextAction["Write"] = "write-context";
})(ContextAction = exports.ContextAction || (exports.ContextAction = {}));
if (electron.ipcMain) {
    const context = Object.create(null);
    electron.ipcMain.on(ChannelName, (event, action, contextId, contextValue) => {
        if (ContextAction.Read === action) {
            event.returnValue = context[contextId];
        }
        else if (ContextAction.Write === action) {
            context[contextId] = contextValue;
            event.returnValue = true;
        }
    });
    exports.readContext = (contextId) => {
        return context[contextId];
    };
    exports.writeContext = (contextId, contextValue) => {
        context[contextId] = contextValue;
    };
}
else if (electron.ipcRenderer) {
    exports.readContext = (contextId) => {
        return electron.ipcRenderer.sendSync(ChannelName, ContextAction.Read, contextId);
    };
    exports.writeContext = (contextId, contextValue) => {
        electron.ipcRenderer.sendSync(ChannelName, ContextAction.Write, contextId, contextValue);
    };
}
else {
    // Not Supported: Only supported in Electron execution context.
}
//# sourceMappingURL=simple-context.js.map