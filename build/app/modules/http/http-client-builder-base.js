"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const handlerChainBuilder_1 = require("../../utilities/handlerChainBuilder");
class HttpClientBuilderBase {
    constructor(log) {
        this.log = log;
        this.requestHandlerBuilder = new handlerChainBuilder_1.HandlerChainBuilder();
        this.responseHandlerBuilder = new handlerChainBuilder_1.HandlerChainBuilder();
    }
    async handleRequestAsync(constructor) {
        await this.requestHandlerBuilder.handleAsync(constructor);
        return this;
    }
    async handleResponseAsync(constructor) {
        await this.responseHandlerBuilder.handleAsync(constructor);
        return this;
    }
}
exports.default = HttpClientBuilderBase;
//# sourceMappingURL=http-client-builder-base.js.map