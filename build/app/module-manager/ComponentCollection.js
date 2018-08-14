"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class ComponentCollection {
    constructor() {
        this.collection = Object.create(null);
    }
    register(componentInfo) {
        if (!componentInfo || !Object.isObject(componentInfo)) {
            throw new Error("componentInfo must be provided.");
        }
        if (!String.isString(componentInfo.name) || String.isEmptyOrWhitespace(componentInfo.name)) {
            throw new Error("componentInfo.name must be provided. (non-empty/whitespaces)");
        }
        if (!Function.isFunction(componentInfo.descriptor)) {
            throw new Error("componentInfo.descriptor function must be provided.");
        }
        if (this.collection[componentInfo.name]) {
            throw new Error(`component, "${componentInfo.name}", has already registered.`);
        }
        this.collection[componentInfo.name] = componentInfo;
        return this;
    }
    getComponents() {
        return Object.values(this.collection);
    }
}
exports.default = ComponentCollection;
//# sourceMappingURL=ComponentCollection.js.map