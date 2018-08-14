"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
class DiDescriptorDictionary {
    constructor() {
        this.descriptorDictionary = Object.create(null);
    }
    get(name) {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }
        return this.descriptorDictionary[name];
    }
    set(name, descriptor) {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }
        if (utils.isNullOrUndefined(descriptor)) {
            delete this.descriptorDictionary[name];
        }
        else {
            this.descriptorDictionary[name] = descriptor;
        }
    }
}
exports.DiDescriptorDictionary = DiDescriptorDictionary;
class DiContainer {
    constructor(dictionary) {
        if (utils.isNullOrUndefined(dictionary)) {
            this.descriptorDictionary = new DiDescriptorDictionary();
        }
        else {
            this.descriptorDictionary = dictionary;
        }
    }
    getDep(name, ...extraArgs) {
        const descriptor = this.get(name);
        if (utils.isNullOrUndefined(descriptor)) {
            return undefined;
        }
        else {
            return descriptor(this, ...extraArgs);
        }
    }
    get(name) {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }
        return this.descriptorDictionary.get(name);
    }
    set(name, descriptor) {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }
        if (utils.isNullOrUndefined(descriptor)) {
            this.descriptorDictionary.set(name, undefined);
        }
        else {
            this.descriptorDictionary.set(name, descriptor);
        }
        return this;
    }
}
exports.DiContainer = DiContainer;
//# sourceMappingURL=di.js.map