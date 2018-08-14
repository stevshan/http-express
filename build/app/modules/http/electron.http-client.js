"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const electron = require("electron");
const uuidv4 = require("uuid/v4");
const crypto = require("crypto");
const http_client_base_1 = require("./http-client-base");
const utils = require("../../utilities/utils");
const common_1 = require("./common");
const http_response_proxy_1 = require("./http-response-proxy");
function toCertificateInfo(certificate) {
    const certInfo = Object.create(null);
    const sha1 = crypto.createHash("sha1");
    certInfo.subjectName = certificate.subjectName;
    certInfo.issuerName = certificate.issuerName;
    certInfo.serialNumber = certificate.serialNumber;
    certInfo.validExpiry = new Date(certificate.validExpiry);
    certInfo.validStart = new Date(certificate.validStart);
    sha1.update(certificate.data);
    certInfo.thumbprint = sha1.digest("hex");
    return certInfo;
}
class HttpClient extends http_client_base_1.default {
    constructor(log, protocol, serverCertValidator, requestAsyncProcessor, responseAsyncHandler) {
        super(log, protocol, requestAsyncProcessor, responseAsyncHandler);
        this.serverCertValidator = serverCertValidator;
    }
    async updateDefaultRequestOptionsAsync(options) {
        await super.updateDefaultRequestOptionsAsync(options);
        this.httpSession = this.makeSession(this.httpRequestOptions);
    }
    generateHttpRequestOptionsAsync(requestOptions) {
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
            throw new Error("sslProtocol is not supported.");
        }
        if (requestOptions.clientCert) {
            throw new Error("clientCert is not supported.");
        }
        if (Function.isFunction(this.serverCertValidator)) {
            options.setCertificateVerifyProc = (requestObject, callback) => {
                if (this.serverCertValidator(requestObject.hostname, toCertificateInfo(requestObject.certificate))) {
                    callback(-2);
                }
                else {
                    callback(0);
                }
            };
        }
        return Promise.resolve(options);
    }
    makeRequest(options) {
        let protocol;
        if (this.protocol === common_1.HttpProtocols.any) {
            protocol = options.protocol;
        }
        else {
            protocol = this.protocol;
        }
        if (options.setCertificateVerifyProc) {
            options.session = this.makeSession(options);
            delete options.setCertificateVerifyProc;
        }
        else {
            options.session = this.httpSession;
        }
        const headers = options.headers;
        delete options.headers;
        try {
            if (protocol === options.protocol) {
                // Electron.ClientRequest is supposed to implement NodeJS.Writable.
                // https://electronjs.org/docs/api/client-request
                const request = electron.net.request(options);
                if (headers) {
                    for (const headerName in headers) {
                        request.setHeader(headerName, headers[headerName]);
                    }
                }
                return request;
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
    makeSession(options) {
        if (!options) {
            return undefined;
        }
        const session = electron.session.fromPartition(uuidv4());
        session.allowNTLMCredentialsForDomains("*");
        if (options["setCertificateVerifyProc"]) {
            session.setCertificateVerifyProc(options["setCertificateVerifyProc"]);
        }
        return session;
    }
}
exports.default = HttpClient;
//# sourceMappingURL=electron.http-client.js.map