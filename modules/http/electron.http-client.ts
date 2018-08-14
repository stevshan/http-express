//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog } from "http-express.logging";
import { IDictionary } from "http-express.common";
import { ICertificateInfo } from "http-express.cert";

import {
    RequestAsyncProcessor,
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpRequest,
    IHttpResponse,
    ServerCertValidator
} from "http-express.http";

import * as url from "url";
import * as electron from "electron";
import * as uuidv4 from "uuid/v4";
import * as crypto from "crypto";

import HttpClientBase from "./http-client-base";
import * as utils from "../../utilities/utils";
import { HttpProtocols } from "./common";
import { HttpRequestProxy } from "./http-request-proxy";
import { HttpResponseProxy } from "./http-response-proxy";

interface CertificateVerifyProc {
    (request: electron.CertificateVerifyProcRequest, callback: (verificationResult: number) => void): void;
}

interface IHttpRequestOptions {
    protocol: string;
    method: string;
    headers?: IDictionary<any>;
    session: electron.Session;
    setCertificateVerifyProc?: CertificateVerifyProc;
}

function toCertificateInfo(certificate: electron.Certificate): ICertificateInfo {
    const certInfo: ICertificateInfo = Object.create(null);
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

export default class HttpClient extends HttpClientBase<IHttpRequestOptions> {
    private readonly serverCertValidator: ServerCertValidator;

    private httpSession: electron.Session;

    constructor(
        log: ILog,
        protocol: string,
        serverCertValidator: ServerCertValidator,
        requestAsyncProcessor: RequestAsyncProcessor,
        responseAsyncHandler: ResponseAsyncHandler) {
        super(log, protocol, requestAsyncProcessor, responseAsyncHandler);

        this.serverCertValidator = serverCertValidator;
    }

    public async updateDefaultRequestOptionsAsync(options: IRequestOptions): Promise<void> {
        await super.updateDefaultRequestOptionsAsync(options);

        this.httpSession = this.makeSession(this.httpRequestOptions);
    }

    protected generateHttpRequestOptionsAsync(requestOptions: IRequestOptions): Promise<IHttpRequestOptions> {
        const options: IHttpRequestOptions = Object.create(this.httpRequestOptions);

        Object.assign(options, url.parse(requestOptions.url));

        options.method = requestOptions.method;

        if (Object.isObject(requestOptions.headers)) {
            options.headers = Object.assign(Object.create(null), options.headers, requestOptions.headers);
        } else if (!utils.isNullOrUndefined(requestOptions.headers)) {
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
                } else {
                    callback(0);
                }
            };
        }

        return Promise.resolve(options);
    }

    protected makeRequest(options: IHttpRequestOptions): IHttpRequest {
        let protocol: string;

        if (this.protocol === HttpProtocols.any) {
            protocol = options.protocol;
        } else {
            protocol = this.protocol;
        }

        if (options.setCertificateVerifyProc) {
            options.session = this.makeSession(options);
            delete options.setCertificateVerifyProc;
        } else {
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

                return <any>request;
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

    private makeSession(options: IDictionary<any>): electron.Session {
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
