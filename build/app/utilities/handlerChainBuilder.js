"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
class HandlerChainBuilder {
    constructor() {
        this.chain = [];
    }
    async handleAsync(constructor) {
        if (!Function.isFunction(constructor)) {
            throw new Error("constructor should be a function.");
        }
        this.chain.push(constructor);
        return this;
    }
    async buildAsync() {
        let constructor;
        let nextHandler = undefined;
        while (constructor = this.chain.pop()) {
            nextHandler = await constructor(nextHandler);
            if (!utils.isNullOrUndefined(nextHandler) && !Function.isFunction(nextHandler)) {
                throw new Error("Contructed handler must be a function.");
            }
        }
        return nextHandler;
    }
}
exports.HandlerChainBuilder = HandlerChainBuilder;
//# sourceMappingURL=handlerChainBuilder.js.map