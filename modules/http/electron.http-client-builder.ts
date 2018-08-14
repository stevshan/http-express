//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ServerCertValidator } from "http-express.http";
import { ILog } from "http-express.logging";

import HttpClient from "./electron.http-client";
import HttpClientBuilderBase from "./http-client-builder-base";

export default class HttpClientBuilder extends HttpClientBuilderBase {
    private readonly serverCertValidator: ServerCertValidator;

    constructor(log: ILog, serverCertValidator: ServerCertValidator) {
        super(log);

        this.serverCertValidator = serverCertValidator;
    }

    public async buildAsync(protocol: string): Promise<IHttpClient> {
        return new HttpClient(
            this.log,
            protocol,
            this.serverCertValidator,
            await this.requestHandlerBuilder.buildAsync(),
            await this.responseHandlerBuilder.buildAsync());
    }
}
