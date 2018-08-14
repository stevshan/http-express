"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
var SslProtocols;
(function (SslProtocols) {
    SslProtocols["tls"] = "TLS";
    SslProtocols["tls12"] = "TLS1.2";
    SslProtocols["tls11"] = "TLS1.1";
    SslProtocols["tls10"] = "TLS1.0";
    SslProtocols["ssl30"] = "SSL3.0";
})(SslProtocols = exports.SslProtocols || (exports.SslProtocols = {}));
var HttpProtocols;
(function (HttpProtocols) {
    HttpProtocols["any"] = "*";
    HttpProtocols["http"] = "http:";
    HttpProtocols["https"] = "https:";
})(HttpProtocols = exports.HttpProtocols || (exports.HttpProtocols = {}));
var HttpMethods;
(function (HttpMethods) {
    HttpMethods["get"] = "GET";
    HttpMethods["post"] = "POST";
    HttpMethods["put"] = "PUT";
    HttpMethods["patch"] = "PATCH";
    HttpMethods["delete"] = "DELETE";
})(HttpMethods = exports.HttpMethods || (exports.HttpMethods = {}));
var HttpContentTypes;
(function (HttpContentTypes) {
    HttpContentTypes["json"] = "application/json";
    HttpContentTypes["binary"] = "application/octet-stream";
})(HttpContentTypes = exports.HttpContentTypes || (exports.HttpContentTypes = {}));
//# sourceMappingURL=common.js.map