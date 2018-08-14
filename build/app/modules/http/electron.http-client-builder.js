"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron_http_client_1 = require("./electron.http-client");
const http_client_builder_base_1 = require("./http-client-builder-base");
class HttpClientBuilder extends http_client_builder_base_1.default {
    constructor(log, serverCertValidator) {
        super(log);
        this.serverCertValidator = serverCertValidator;
    }
    async buildAsync(protocol) {
        return new electron_http_client_1.default(this.log, protocol, this.serverCertValidator, await this.requestHandlerBuilder.buildAsync(), await this.responseHandlerBuilder.buildAsync());
    }
}
exports.default = HttpClientBuilder;
//# sourceMappingURL=electron.http-client-builder.js.map