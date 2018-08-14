"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const uuidv4 = require("uuid/v4");
class AadTokenAcquirer {
    constructor(httpClient, handlingHost, aadMetadata) {
        this.onRedirecting = (event, oldUrlString, newUrlString) => {
            if (newUrlString.toUpperCase().startsWith(this.aadMetadata.redirect.toUpperCase())) {
                const token = this.extractToken(newUrlString);
                this.handlingHost.removeListener("did-get-redirect-request", this.onRedirecting);
                token ? this.resolve(token) : this.reject(new Error("Toke is missing in the reply url."));
            }
        };
        this.httpClient = httpClient;
        this.handlingHost = handlingHost;
        this.aadMetadata = aadMetadata;
    }
    acquireTokenAsync() {
        return this.acquireAadOAuthConfig()
            .then((aadOAuthConfig) => {
            if (!aadOAuthConfig.response_types_supported.includes("id_token")) {
                return Promise.reject(Error(`"id_token" is not supported by the remote authority.`));
            }
            const authorizeUrl = new URL(aadOAuthConfig.authorization_endpoint);
            authorizeUrl.searchParams.append("client_id", this.aadMetadata.clientId);
            authorizeUrl.searchParams.append("response_type", "id_token");
            authorizeUrl.searchParams.append("redirect_uri", this.aadMetadata.redirect);
            authorizeUrl.searchParams.append("response_mode", "query");
            authorizeUrl.searchParams.append("nonce", uuidv4());
            this.handlingHost.on("did-get-redirect-request", this.onRedirecting);
            this.handlingHost.loadURL(authorizeUrl.href);
            return new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        });
    }
    extractToken(urlString) {
        const urlWithToken = url.parse(urlString);
        const tokenStart = urlWithToken.hash.indexOf("=");
        if (tokenStart >= 0) {
            return urlWithToken.hash.substr(tokenStart + 1);
        }
        return undefined;
    }
    acquireAadOAuthConfig() {
        const oauthConfigHref = new URL(".well-known/openid-configuration", this.aadMetadata.authority).href;
        return this.httpClient.getAsync(oauthConfigHref)
            .then((response) => {
            if (!response.data) {
                return Promise.reject(new Error(`Failed to retrieve Aad OAuth config: ${oauthConfigHref}`));
            }
            return Promise.resolve(response.data);
        });
    }
}
async function handleAadAsync(handlingHost, aadMetadata, nextHandler) {
    return async (client, log, requestOptions, requestData, response) => {
        const statusCode = await response.statusCode;
        if (statusCode === 403 || statusCode === 401) {
            const acquirer = new AadTokenAcquirer(client, handlingHost, aadMetadata);
            return acquirer.acquireTokenAsync()
                .then(async (token) => {
                const options = await client.defaultRequestOptions;
                options.headers["Authorization"] = `Bearer ${token}`;
                await client.updateDefaultRequestOptionsAsync(options);
                return client.requestAsync(requestOptions, requestData);
            }, (reason) => {
                log.writeErrorAsync("AAD Auth handler failed: {}", reason);
                return Promise.reject(reason);
            });
        }
        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }
        return Promise.resolve(response);
    };
}
exports.default = handleAadAsync;
//# sourceMappingURL=handle-auth-aad.js.map