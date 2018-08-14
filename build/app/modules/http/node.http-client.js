"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const https = require("https");
const http = require("http");
const url = require("url");
const crypto = require("crypto");
const common_1 = require("./common");
const utils = require("../../utilities/utils");
const http_client_base_1 = require("./http-client-base");
const http_request_proxy_1 = require("./http-request-proxy");
const http_response_proxy_1 = require("./http-response-proxy");
function objectToString(obj) {
    const propertyNames = Object.getOwnPropertyNames(obj);
    let str = "";
    for (const propertyName of propertyNames) {
        str += `${propertyName}=${obj[propertyName]}, `;
    }
    return str.substr(0, str.length - 2);
}
function toCertificateInfo(cert) {
    const sha1 = crypto.createHash("sha1");
    sha1.update(cert.raw);
    return {
        subjectName: objectToString(cert.subject),
        issuerName: objectToString(cert.issuer),
        serialNumber: cert.serialNumber,
        validStart: new Date(cert.valid_from),
        validExpiry: new Date(cert.valid_to),
        thumbprint: sha1.digest("hex")
    };
}
class HttpClient extends http_client_base_1.default {
    constructor(log, certLoader, protocol, serverCertValidator, requestAsyncProcessor, responseAsyncHandler) {
        super(log, protocol, requestAsyncProcessor, responseAsyncHandler);
        if (!Object.isObject(certLoader)) {
            throw new Error("certLoader must be supplied.");
        }
        this.serverCertValidator = serverCertValidator;
        this.certLoader = certLoader;
    }
    async generateHttpRequestOptionsAsync(requestOptions) {
        const options = Object.create(this.httpRequestOptions);
        Object.assign(options, url.parse(requestOptions.url));
        options.method = requestOptions.method;
        if (Object.isObject(requestOptions.headers)) {
            options.headers = Object.assign(Object.create(null), options.headers, requestOptions.headers);
        }
        else if (!utils.isNullOrUndefined(requestOptions.headers)) {
            throw new Error("requestOptions.headers must be an object or null/undefined.");
        }
        if (String.isString(requestOptions.sslProtocol)) {
            if (!Object.values(common_1.SslProtocols).includes(requestOptions.sslProtocol)) {
                throw new Error(`Unknown sslProtocol: ${requestOptions.sslProtocol}`);
            }
            options.secureProtocol = requestOptions.sslProtocol;
        }
        if (requestOptions.clientCert) {
            requestOptions.clientCert = await this.certLoader.loadAsync(requestOptions.clientCert);
            if (requestOptions.clientCert.type === "pfx") {
                options.pfx = requestOptions.clientCert.pfx;
                options.passphrase = requestOptions.clientCert.password;
            }
            else if (requestOptions.clientCert.type === "pem") {
                options.key = requestOptions.clientCert.key;
                options.cert = requestOptions.clientCert.cert;
                options.passphrase = requestOptions.clientCert.password;
            }
            else {
                throw new Error("Invalid clientCert: " + utils.defaultStringifier(requestOptions.clientCert));
            }
        }
        if (Function.isFunction(this.serverCertValidator)) {
            options.rejectUnauthorized = false;
            options["checkServerIdentity"] =
                (serverName, cert) => this.serverCertValidator(serverName, toCertificateInfo(cert));
        }
        return options;
    }
    makeRequest(options) {
        let protocol;
        if (this.protocol === common_1.HttpProtocols.any) {
            protocol = options.protocol;
        }
        else {
            protocol = this.protocol;
        }
        try {
            if (protocol === "http:" || protocol === "http") {
                return new http_request_proxy_1.HttpRequestProxy(http.request(options));
            }
            else if (protocol === "https:" || protocol === "https") {
                return new http_request_proxy_1.HttpRequestProxy(https.request(options));
            }
            else {
                throw new Error(`unsupported protocol: ${protocol}`);
            }
        }
        catch (exception) {
            this.log.writeExceptionAsync(exception);
            throw exception;
        }
    }
    sendRequestAsync(request) {
        return new Promise((resolve, reject) => {
            const requestProxy = request;
            requestProxy.httpRequest.on("response", (response) => resolve(new http_response_proxy_1.HttpResponseProxy(response)));
            requestProxy.httpRequest.on("error", (error) => reject(error));
            requestProxy.httpRequest.end();
        });
    }
}
exports.default = HttpClient;
//# sourceMappingURL=node.http-client.js.map