"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const realElectron = require("electron");
require("./utils");
exports.isRemote = Object.isObject(realElectron.remote);
exports.remote = realElectron.remote;
exports.electron = (() => {
    if (exports.isRemote) {
        const remoteElectron = Object.create(null);
        const mergeProperties = (target, propertyDescriptors) => Object.keys(propertyDescriptors).forEach((propertyName) => {
            if (!Object.prototype.hasOwnProperty.call(remoteElectron, propertyName)) {
                Object.defineProperty(target, propertyName, propertyDescriptors[propertyName]);
            }
        });
        mergeProperties(remoteElectron, Object.getOwnPropertyDescriptors(realElectron.remote));
        mergeProperties(remoteElectron, Object.getOwnPropertyDescriptors(realElectron));
        return remoteElectron;
    }
    return realElectron;
})();
//# sourceMappingURL=electron-adapter.js.map