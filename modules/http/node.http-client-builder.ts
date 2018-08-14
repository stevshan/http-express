//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ServerCertValidator } from "http-express.http";
import { ILog } from "http-express.logging";
import { ICertificateLoader } from "http-express.cert";

import HttpClient from "./node.http-client";
import HttpClientBuilderBase from "./http-client-builder-base";

export default class HttpClientBuilder extends HttpClientBuilderBase {
    private readonly certLoader: ICertificateLoader;

    private readonly serverCertValidator: ServerCertValidator;

    constructor(
        log: ILog, 
        certLoader: ICertificateLoader, 
        serverCertValidator?: ServerCertValidator) {

        super(log);

        this.certLoader = certLoader;
        this.serverCertValidator = serverCertValidator;
    }

    public async buildAsync(protocol: string): Promise<IHttpClient> {
        return new HttpClient(
            this.log,
            this.certLoader,
            protocol,
            this.serverCertValidator,
            await this.requestHandlerBuilder.buildAsync(),
            await this.responseHandlerBuilder.buildAsync());
    }
}
