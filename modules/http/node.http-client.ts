//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    RequestAsyncProcessor,
    ResponseAsyncHandler,
    IRequestOptions,
    ServerCertValidator,
    IHttpRequest,
    IHttpResponse,
    IHttpClient
} from "http-express.http";

import { IDictionary } from "http-express.common";

import { ILog } from "http-express.logging";
import {
    ICertificateLoader,
    IPemCertificate,
    IPfxCertificate,
    ICertificateInfo
} from "http-express.cert";

import * as https from "https";
import * as http from "http";
import * as url from "url";
import * as crypto from "crypto";
import { PeerCertificate, TLSSocket } from "tls";

import { HttpProtocols, SslProtocols } from "./common";
import * as utils from "../../utilities/utils";
import HttpClientBase from "./http-client-base";
import { HttpRequestProxy } from "./http-request-proxy";
import { HttpResponseProxy } from "./http-response-proxy";

const CertErrors = {
    CERT_HAS_EXPIRED: true,
    DEPTH_ZERO_SELF_SIGNED_CERT: true,
    ERR_TLS_CERT_ALTNAME_INVALID: true,
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: true
};

function objectToString(obj: any): string {
    const propertyNames = Object.getOwnPropertyNames(obj);
    let str = "";

    for (const propertyName of propertyNames) {
        str += `${propertyName}=${obj[propertyName]}, `;
    }

    return str.substr(0, str.length - 2);
}

function toCertificateInfo(cert: PeerCertificate): ICertificateInfo {
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

export default class HttpClient extends HttpClientBase<http.RequestOptions> {
    private readonly certLoader: ICertificateLoader;

    private readonly serverCertValidator: ServerCertValidator;

    private readonly trustedServerCerts: IDictionary<boolean>;

    constructor(
        log: ILog,
        certLoader: ICertificateLoader,
        protocol: string,
        serverCertValidator: ServerCertValidator,
        requestAsyncProcessor: RequestAsyncProcessor,
        responseAsyncHandler: ResponseAsyncHandler) {

        if (Function.isFunction(serverCertValidator)) {
            const nextHandler = responseAsyncHandler;

            responseAsyncHandler =
                async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
                    const httpResponse = <http.IncomingMessage>((<HttpResponseProxy>response).httpResponse);

                    if (httpResponse.connection["authorized"] === false
                        && httpResponse.connection["authorizationError"] in CertErrors) {
                        const tlsSocket = <TLSSocket>httpResponse.connection;
                        const certInfo = toCertificateInfo(tlsSocket.getPeerCertificate());

                        if (this.trustedServerCerts[certInfo.thumbprint] === false) {
                            const err = new Error("Invalid server certificate.");

                            err["code"] = httpResponse.connection["authorizationError"];

                            return Promise.reject(err);
                        } else if (this.trustedServerCerts[certInfo.thumbprint] !== true) {
                            const validation = await this.serverCertValidator(tlsSocket["servername"], certInfo);

                            if (validation === undefined) {
                                this.trustedServerCerts[certInfo.thumbprint] = true;

                                return client.requestAsync(requestOptions, requestData);
                            } else {
                                this.trustedServerCerts[certInfo.thumbprint] = false;

                                const err = new Error("Invalid server certificate.");

                                err["code"] = httpResponse.connection["authorizationError"];

                                return Promise.reject(err);
                            }
                        }
                    }

                    if (Function.isFunction(nextHandler)) {
                        return nextHandler(client, log, requestOptions, requestData, response);
                    }

                    return response;
                };
        }

        super(log, protocol, requestAsyncProcessor, responseAsyncHandler);

        if (!Object.isObject(certLoader)) {
            throw new Error("certLoader must be supplied.");
        }

        this.trustedServerCerts = {};
        this.serverCertValidator = serverCertValidator;
        this.certLoader = certLoader;
    }

    protected async generateHttpRequestOptionsAsync(requestOptions: IRequestOptions): Promise<https.RequestOptions> {
        const options: https.RequestOptions = Object.create(this.httpRequestOptions);

        Object.assign(options, url.parse(requestOptions.url));

        options.method = requestOptions.method;

        if (Object.isObject(requestOptions.headers)) {
            options.headers = Object.assign(Object.create(null), options.headers, requestOptions.headers);
        } else if (!utils.isNullOrUndefined(requestOptions.headers)) {
            throw new Error("requestOptions.headers must be an object or null/undefined.");
        }

        if (String.isString(requestOptions.sslProtocol)) {
            if (!Object.values(SslProtocols).includes(requestOptions.sslProtocol)) {
                throw new Error(`Unknown sslProtocol: ${requestOptions.sslProtocol}`);
            }

            options.secureProtocol = requestOptions.sslProtocol;
        }

        if (requestOptions.clientCert) {
            requestOptions.clientCert = await this.certLoader.loadAsync(requestOptions.clientCert);

            if (requestOptions.clientCert.type === "pfx") {
                options.pfx = (<IPfxCertificate>requestOptions.clientCert).pfx;
                options.passphrase = (<IPfxCertificate>requestOptions.clientCert).password;

            } else if (requestOptions.clientCert.type === "pem") {
                options.key = (<IPemCertificate>requestOptions.clientCert).key;
                options.cert = (<IPemCertificate>requestOptions.clientCert).cert;
                options.passphrase = (<IPemCertificate>requestOptions.clientCert).password;

            } else {
                throw new Error("Invalid clientCert: " + utils.defaultStringifier(requestOptions.clientCert));
            }
        }

        if (Function.isFunction(this.serverCertValidator)) {
            options.rejectUnauthorized = false;
        }
        
        return options;
    }

    protected makeRequest(options: http.RequestOptions): IHttpRequest {
        let protocol: string;

        if (this.protocol === HttpProtocols.any) {
            protocol = options.protocol;
        } else {
            protocol = this.protocol;
        }

        try {
            if (protocol === "http:" || protocol === "http") {
                return new HttpRequestProxy(http.request(options));
            } else if (protocol === "https:" || protocol === "https") {
                if (!options.port) {
                    options.port = 443;
                }

                options.agent = new https.Agent(<https.AgentOptions>options);

                return new HttpRequestProxy(https.request(options));
            } else {
                throw new Error(`unsupported protocol: ${protocol}`);
            }
        } catch (exception) {
            this.log.writeExceptionAsync(exception);
            throw exception;
        }
    }

    protected sendRequestAsync(request: IHttpRequest): Promise<IHttpResponse> {
        return new Promise<IHttpResponse>((resolve, reject) => {
            const requestProxy = <HttpRequestProxy>request;

            requestProxy.httpRequest.on("response", (response) => resolve(new HttpResponseProxy(response)));
            requestProxy.httpRequest.on("error", (error) => reject(error));
            requestProxy.httpRequest.end();
        });
    }
}
