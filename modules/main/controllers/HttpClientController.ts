//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary, IDisposable } from "http-express.common";
import { IHttpClient, HttpMethod, IHttpResponse } from "http-express.http";

import * as ng from "angular";
import * as url from "url";
import { Buffer } from "buffer";
import * as $ from "jquery";
import { ICertificateInfo } from "http-express.cert";
import { electron } from "../../../utilities/electron-adapter";

interface IHttpClientScope extends ng.IScope {
    url: string;
    method: HttpMethod;
    headers: string;
    body: string;
    httpClientPromise: Promise<IHttpClient & IDisposable>;
    serverCert: ICertificateInfo;
    trustedServerCerts: IDictionary<boolean>;

    readonly protocol: string;
    readonly host: string;

    updateMethod: (method: HttpMethod) => void;
    sendRequest: () => void;
}

function disableInputs(toDisable: boolean = true): void {
    $("#btnMethod").prop("disabled", toDisable);
    $("#inputUrl").prop("disabled", toDisable);
    $("#btnSend").prop("disabled", toDisable);
    $("#textHeaders").prop("disabled", toDisable);

    const method = $("#btnMethod").text();

    $("#textBody").prop("disabled", method === "GET" || method === "DELETE");
}

async function displayResponseAsync(httpResponse: IHttpResponse): Promise<void> {
    let response: string = "";

    const httpVersion = await httpResponse.httpVersion;
    const statusCode = await httpResponse.statusCode;
    const statusMessage = await httpResponse.statusMessage;
    const httpHeaders = await httpResponse.headers;

    response += `HTTP/${httpVersion} ${statusCode} ${statusMessage} \r\n`;

    for (const headerName in httpHeaders) {
        const headerValue: string | Array<string> = httpHeaders[headerName];
        
        if (Array.isArray(headerValue)) {
            headerValue.forEach((item) => response += `${headerName}: ${item} \r\n`);
        } else {
            response += `${headerName}: ${headerValue} \r\n`;
        }
    }

    response += "\r\n";

    const data = await httpResponse.readAsync();

    if (data instanceof Buffer) {
        let encoding: string = null;
        const contentType = httpHeaders["content-type"];

        if (!encoding && contentType && contentType.includes("text/")) {
            encoding = "utf8";

            if (contentType.includes("=utf-8")) {
                encoding = "utf8";
            } else if (contentType.includes("=utf-16")) {
                encoding = "utf16le";
            } else if (contentType.includes("=ascii")) {
                encoding = "ascii";
            }
        }

        response += data.toString(encoding || "hex");
    } else {
        response += data;
    }

    $("#textResponse").val(response);
}

function sendRequestAsync($scope: IHttpClientScope): Promise<void> {
    disableInputs();

    const headers: IDictionary<string | Array<string>> = {};
    const rawHeaders = $scope.headers.split("\r\n");

    for (let rawHeaderIndex = 0; rawHeaderIndex < rawHeaders.length - 1; rawHeaderIndex++) {
        const headerPair = rawHeaders[rawHeaderIndex].split(":", 2);
        const headerName = headerPair[0].trim();
        const headerValue = headerPair[1].trim();

        headers[headerName] = headerValue;
    }

    if ($scope.method === "GET" || $scope.method === "DELETE") {
        $scope.body = "";
    }

    return $scope.httpClientPromise
        .then((httpClient) =>
            httpClient.requestAsync(
                {
                    method: $scope.method,
                    url: $scope.url,
                    headers: headers
                },
                $scope.body || null))
        .then((response) => displayResponseAsync(response))
        .then(() => disableInputs(false));
}

function validateServerCert($scope: IHttpClientScope, serverName: string, cert: ICertificateInfo): Error | void {
    $scope.trustedServerCerts = $scope.trustedServerCerts || {};

    if ($scope.trustedServerCerts[cert.thumbprint] === true) {
        return;
    } else if ($scope.trustedServerCerts[cert.thumbprint] === false) {
        return new Error("Not trusted");
    } else {
        let certDetail: string = "";

        certDetail += `Subject: ${cert.subjectName} \r\n`;
        certDetail += `Issuer: ${cert.issuerName} \r\n`;
        certDetail += `Serial: ${cert.serialNumber} \r\n`;
        certDetail += `Thumbprint: ${cert.thumbprint} \r\n`;
        certDetail += `Valid from: ${cert.validStart.toLocaleString()} \r\n`;
        certDetail += `Valid to: ${cert.validExpiry.toLocaleString()} \r\n`;

        const response =
            electron.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
                type: "warning",
                buttons: ["Trust", "Cancel"],
                defaultId: 1,
                title: "Certificate Validation",
                message: "Should the following certificate from the server be trusted?",
                detail: certDetail,
                cancelId: 1
            });

        if (response === 0) {
            $scope.trustedServerCerts[cert.thumbprint] = true;
            return;
        } else {
            $scope.trustedServerCerts[cert.thumbprint] = false;
            return new Error("Not trusted");
        }
    }
}

ng.module("http-express")
    .controller("HttpClientController",
        ["$scope",
            ($scope: IHttpClientScope) => {
                $scope.url = "http://example.com";
                $scope.headers = "";
                $scope.body = "";
                $scope.method = "GET";
                $scope.httpClientPromise =
                    moduleManager.getComponentAsync("http.http-client", validateServerCert.bind(null, $scope));

                $scope.sendRequest = sendRequestAsync.bind(null, $scope);

                $scope.updateMethod = (method: HttpMethod) => {
                    $scope.method = method;
                    $("#textBody").prop("disabled", method === "GET" || method === "DELETE");
                };

                Object.defineProperty($scope, "protocol", {
                    get: () => {
                        const httpUrl = url.parse($scope.url);

                        return `${$scope.method} ${httpUrl.path} HTTP/1.1`;
                    }
                });

                Object.defineProperty($scope, "host", {
                    get: () => {
                        const httpUrl = url.parse($scope.url);

                        return `Host: ${httpUrl.host}`;
                    }
                });

                $scope.updateMethod("GET");
            }]);
