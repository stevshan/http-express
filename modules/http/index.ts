//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo, IModule } from "http-express.module-manager";
import { ILog } from "http-express.logging";
import { ICertificateLoader, IPkiCertificateService } from "http-express.cert";
import { IHttpClient, IHttpClientBuilder, ServerCertValidator, ResponseAsyncHandler } from "http-express.http";
import { SelectClientCertAsyncHandler } from "http-express.http.auth";

import * as appUtils from "../../utilities/appUtils";

import { HttpProtocols } from "./common";
import handleRedirectionResponseAsync from "./response-handlers/handle-redirection";
import handleAuthCertResponseAsync from "./response-handlers/handle-auth-cert";
import NodeHttpClientBuilder from "./node.http-client-builder";
import ElectronHttpClientBuilder from "./electron.http-client-builder";
import { IAsyncHandlerConstructor } from "http-express.common";
import NodeHttpClient from "./node.http-client";

function buildNodeHttpClientAsync(
    log: ILog,
    certLoader: ICertificateLoader,
    protocol: string,
    serverCertValidator?: ServerCertValidator)
    : Promise<IHttpClient> {
    return Promise.resolve(new NodeHttpClientBuilder(log, certLoader, serverCertValidator))
        // Response handlers
        .then(builder => builder.handleResponseAsync(handleRedirectionResponseAsync))
        .then(builder => builder.buildAsync(protocol));
}

function buildElectronHttpClientAsync(
    log: ILog,
    protocol: string,
    serverCertValidator?: ServerCertValidator)
    : Promise<IHttpClient> {
    return Promise.resolve(new ElectronHttpClientBuilder(log, serverCertValidator))
        // Response handlers
        .then(builder => builder.handleResponseAsync(handleRedirectionResponseAsync))
        .then(builder => builder.buildAsync(protocol));
}

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<IHttpClient>({
            name: "http.http-client",
            version: appUtils.getAppVersion(),
            descriptor: (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                buildNodeHttpClientAsync(log, certLoader, HttpProtocols.any, serverCertValidator),
            deps: ["logging", "cert.cert-loader"]
        })
        .register<IHttpClient>({
            name: "http.https-client",
            version: appUtils.getAppVersion(),
            descriptor: (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                buildNodeHttpClientAsync(log, certLoader, HttpProtocols.https, serverCertValidator),
            deps: ["logging", "cert.cert-loader"]
        })
        .register<IHttpClient>({
            name: "http.node-http-client",
            version: appUtils.getAppVersion(),
            descriptor: (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                Promise.resolve(new NodeHttpClient(log, certLoader, "*", serverCertValidator, null, null)),
            deps: ["logging", "cert.cert-loader"]
        })
        .register<IHttpClient>({
            name: "http.node-https-client",
            version: appUtils.getAppVersion(),
            descriptor: async (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                buildNodeHttpClientAsync(log, certLoader, HttpProtocols.https, serverCertValidator),
            deps: ["logging", "cert.cert-loader"]
        })
        .register<IHttpClient>({
            name: "http.electron-http-client",
            version: appUtils.getAppVersion(),
            descriptor: (log: ILog, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                buildElectronHttpClientAsync(log, HttpProtocols.any, serverCertValidator),
            deps: ["logging"]
        })
        .register<IHttpClient>({
            name: "http.electron-https-client",
            version: appUtils.getAppVersion(),
            descriptor: (log: ILog, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                buildElectronHttpClientAsync(log, HttpProtocols.https, serverCertValidator),
            deps: ["logging"]
        })
        .register<IHttpClientBuilder>({
            name: "http.node-client-builder",
            version: appUtils.getAppVersion(),
            descriptor: async (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator) =>
                new NodeHttpClientBuilder(log, certLoader, serverCertValidator),
            deps: ["logging", "cert.cert-loader"]
        })
        .register<IHttpClientBuilder>({
            name: "http.electron-client-builder",
            version: appUtils.getAppVersion(),
            descriptor: async (log: ILog, serverCertValidator?: ServerCertValidator) =>
                new ElectronHttpClientBuilder(log, serverCertValidator),
            deps: ["logging"]
        })

        // Response Handlers
        .register<IAsyncHandlerConstructor<ResponseAsyncHandler>>({
            name: "http.response-handlers.handle-redirection",
            version: appUtils.getAppVersion(),
            descriptor: async () => handleRedirectionResponseAsync
        })
        .register<IAsyncHandlerConstructor<ResponseAsyncHandler>>({
            name: "http.response-handlers.handle-auth-cert",
            version: appUtils.getAppVersion(),
            descriptor:
                (certLoader: ICertificateLoader, pkiCertSvc: IPkiCertificateService, selectClientCertAsyncHandler: SelectClientCertAsyncHandler) =>
                    handleAuthCertResponseAsync.bind(null, certLoader, pkiCertSvc, selectClientCertAsyncHandler),
            deps: ["cert.cert-loader", "cert.pki-service"]
        });

    return {
        name: "http",
        version: appUtils.getAppVersion()
    };
};
