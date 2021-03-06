//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "http-express.common";
import { IHttpResponse } from "http-express.http";

import * as uuidv4 from "uuid/v4";
import * as semver from "semver";
import * as url from "url";
import { Buffer } from "buffer";
import * as $ from "jquery";
import { ICertificateInfo, ICertificate } from "http-express.cert";
import { electron } from "../../../utilities/electron-adapter";

const Vue = require("vue/dist/vue.min.js");

const textContentTypes = {
    "application": true,
    "application/xml": true,
    "application/typescript": true,
    "application/json": true,
    "application/javascript": true,
    "application/ecmascript": true,
    "image/svg+xml": true
};

function disableInputs(reset: boolean = false): void {
    $("#btnMethod").prop("disabled", !reset);
    $("#inputUrl").prop("disabled", !reset);
    $("#btnSend").prop("disabled", !reset);
    $("#textHeaders").prop("disabled", !reset);
    $("#inputUserAgent").prop("disabled", !reset);

    const method = $("#btnMethod").text();

    $("#textBody").prop("disabled", !reset || method === "GET" || method === "DELETE");
}

async function displayResponseAsync(httpResponse: IHttpResponse): Promise<void> {
    let response: string = "";

    if (!Function.isFunction(httpResponse.readAsync)) {
        response += `${httpResponse["message"]}\r\n`;
        response += `${httpResponse["stack"]}\r\n`;

        this.response = response;
        return;
    }

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
        const contentType = <string>httpHeaders["content-type"];
        const contentTypeMatches = /([^\;]+)\;/i.exec(contentType);
        let contentTypeValue: string = null;

        if (contentTypeMatches && contentTypeMatches.length > 0) {
            contentTypeValue = contentTypeMatches[1];
        }

        if (!encoding && contentType && (contentType.includes("text/") || contentTypeValue in textContentTypes)) {
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
    } else if (data) {
        response += data;
    }

    this.response = response;
}

async function sendRequestAsync(): Promise<void> {
    disableInputs();
    this.sendingRequest = true;

    try {
        const headers: IDictionary<string | Array<string>> = {};
        const rawHeaders = this.headers.split("\r\n");

        for (let rawHeaderIndex = 0; rawHeaderIndex < rawHeaders.length - 1; rawHeaderIndex++) {
            const headerPair = rawHeaders[rawHeaderIndex].split(":", 2);
            const headerName = headerPair[0].trim();
            const headerValue = headerPair[1].trim();

            if (headerName in headers) {
                const existingHeaderValue = headers[headerName];

                if (Array.isArray(existingHeaderValue)) {
                    existingHeaderValue.push(headerValue);
                } else {
                    const newHeaderValue = [];

                    newHeaderValue.push(headers[headerName]);
                    newHeaderValue.push(headerValue);

                    headers[headerName] = newHeaderValue;
                }
            } else {
                headers[headerName] = headerValue;
            }
        }

        if (!String.isEmptyOrWhitespace(this.userAgent)) {
            headers["User-Agent"] = this.userAgent;
        }

        if (this.method === "GET" || this.method === "DELETE") {
            this.body = "";
        }

        this.response = "";

        await this.httpClientPromise
            .then((httpClient) =>
                httpClient.requestAsync(
                    {
                        method: this.method,
                        url: this.url,
                        headers: headers
                    },
                    this.body || null))
            .then((response) => this.displayResponseAsync(response));
    } finally {
        disableInputs(true);
        this.sendingRequest = false;
    }
}

function validateServerCert(serverName: string, cert: ICertificateInfo): Error | void {
    let certDetail: string = "";

    certDetail += `Subject: ${cert.subjectName} \r\n`;
    certDetail += `Issuer: ${cert.issuerName} \r\n`;
    certDetail += `Serial: ${cert.serialNumber} \r\n`;
    certDetail += `Thumbprint: ${cert.thumbprint} \r\n`;
    certDetail += `Valid from: ${new Date(cert.validStart).toLocaleString()} \r\n`;
    certDetail += `Valid to: ${new Date(cert.validExpiry).toLocaleString()} \r\n`;

    const response =
        electron.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
            type: "warning",
            buttons: ["Trust", "Cancel"],
            defaultId: 1,
            title: "Certificate Validation",
            message: "Trust the certificate from the server?",
            detail: certDetail,
            cancelId: 1
        });

    if (response !== 0) {
        return new Error("Not trusted");
    }
}

function createClientCertSelectionVue(
    elementId: string,
    templateId: string,
    certInfos: Array<ICertificateInfo>,
    resolve: (result: ICertificate | ICertificateInfo | Promise<ICertificate | ICertificateInfo>) => void,
    reject: (reason?: any) => void)
    : any {
    return new Vue({
        el: `#${elementId}`,
        template: `#${templateId}`,
        data: {
            id: elementId,
            certInfos: certInfos ? certInfos.filter((certInfo) => certInfo.hasPrivateKey) : [],
            selectedCertInfo: null,
            password: "",
            certFilePath: "",
            keyFilePath: ""
        },
        computed: {
            keyFileRequired: function (): boolean {
                return this.certFilePath && !(/\.pfx$/i.test(this.certFilePath));
            },

            certSelected: function (): boolean {
                return this.selectedCertInfo || this.certFilePath;
            }
        },
        methods: {
            dispose: function () {
                $(`#${this.id}`).modal("dispose");
                this.$destroy();
                $(`#${this.id}+div.modal-backdrop`).remove();
                $(`#${this.id}`).remove();
            },
            onModalHidden: function () {
                this.dispose();
                resolve(null);
            },

            updateSelectedCert: function (certInfo: ICertificateInfo): void {
                this.selectedCertInfo = certInfo;
            },

            selectCert: function (): void {
                this.dispose();

                if (!this.selectedCertInfo) {
                    this.selectedCertInfo = {
                        type: this.keyFileRequired ? "pem" : "pfx",
                        password: this.password
                    };

                    if (this.keyFileRequired) {
                        this.selectedCertInfo.key = this.keyFilePath;
                        this.cert = this.certFilePath;
                    } else {
                        this.selectedCertInfo.pfx = this.certFilePath;
                    }
                }

                resolve(this.selectedCertInfo);
            },

            browseCertFiles: function (): void {
                const selectedFiles = electron.dialog.showOpenDialog({
                    title: "Open a client certificate ...",
                    filters: [
                        {
                            name: "certificates",
                            extensions: ["pfx", "PFX", "pem", "PEM", "crt", "CRT", "cer", "CER"]
                        },
                        {
                            name: "PFX",
                            extensions: ["pfx", "PFX"]
                        },
                        {
                            name: "PEM",
                            extensions: ["pem", "PEM"]
                        },
                        {
                            name: "CRT",
                            extensions: ["crt", "CRT"]
                        },
                        {
                            name: "CER",
                            extensions: ["cer", "CER"]
                        }
                    ],
                    message: "Please select a client certificate to use.",
                    properties: ["openFile", "createDirectory"]
                });

                if (!selectedFiles || selectedFiles.length <= 0) {
                    return;
                }

                this.certFilePath = selectedFiles[0];
            },

            browseKeyFiles: function (): void {
                const selectedFiles = electron.dialog.showOpenDialog({
                    title: "Open a key file for the client certificate ...",
                    filters: [
                        {
                            name: "key file",
                            extensions: ["key"]
                        }
                    ],
                    message: "Please select the key for the supplied client certificate.",
                    properties: ["openFile", "createDirectory"]
                });

                if (!selectedFiles || selectedFiles.length <= 0) {
                    return;
                }

                this.keyFilePath = selectedFiles[0];
            }
        },
        filters: {
            date: function (dateValue: string): string {
                return (new Date(dateValue)).toLocaleString();
            }
        }
    });
}

function selectClientCertAsync(url: string, certInfos: Array<ICertificateInfo>): Promise<ICertificate | ICertificateInfo> {
    return new Promise<ICertificate | ICertificateInfo>((resolve, reject) => {
        const elementId: string = `div-${uuidv4().replace(/\-/gi, "")}`;

        $("body").append($(`<div id="${elementId}"></div>`));

        try {
            const vm = createClientCertSelectionVue(
                elementId,
                certInfos && certInfos.length > 0 ? "Template-Modal-SelectCertificates" : "Template-Modal-OpenSingleCertificate",
                certInfos,
                resolve,
                reject);

            $(`#${vm.id}`).on("hidden.bs.modal", function (e) {
                vm.onModalHidden();
            });

            $(`#${vm.id}`).modal();
        } catch (error) {
            console.log(error);
            throw error;
        }
    });
}

const httpHeaderRegex = /^((\u0020*[^\(\)\<\>\@\,\;\:\\\"\/\[\]\?\=\{\}\u0020\u0000-\u001f\u007F]+\u0020*\:\u0020*[^\u0000-\u001f\u007F\u0009\u0020]*)*\n?)*$/;

const vm = (async () => {
    const httpClientBuilder = await moduleManager.getComponentAsync("http.node-client-builder", validateServerCert);
    const handleCertResponse = await moduleManager.getComponentAsync("http.response-handlers.handle-auth-cert", selectClientCertAsync);

    await httpClientBuilder.handleResponseAsync(handleCertResponse);

    return new Vue({
        el: "#HttpClient",
        data: {
            url: "https://example.com",
            method: "GET",
            headers: "",
            body: "",
            search: "",
            response: "",
            userAgent: `HttpExpress/${semver.major(electron.app.getVersion())}.${semver.minor(electron.app.getVersion())}`,
            httpClientPromise: httpClientBuilder.buildAsync("*"),
            sendingRequest: false
        },
        computed: {
            protocol: function (): string {
                return `${this.method} ${url.parse(this.url).path} HTTP/1.1`;
            },

            host: function (): string {
                return `Host: ${url.parse(this.url).host}`;
            },

            noBodyAllowed: function (): boolean {
                return this.method === "GET" || this.method === "DELETE";
            },

            highlightedResponse: function (): string {
                let encodedResponse = $("<div/>").text(this.response).html();

                if (!String.isEmpty(this.search)) {
                    const encodedSearch = $("<div/>").text(this.search).html();

                    encodedResponse = encodedResponse.replace(new RegExp(encodedSearch, "gi"), "<mark>$&</mark>");
                }

                this.$nextTick(function () {
                    const markEl = $("div.highlights mark");

                    if (markEl && markEl.length > 0) {
                        markEl[0].scrollIntoView();
                    }
                });

                return encodedResponse.replace(new RegExp("\n", "g"), "<br />");
            }
        },
        watch: {
            headers: function (newHeaders: string, oldHeaders: string): void {
                if (!httpHeaderRegex.test(newHeaders)) {
                    (<HTMLTextAreaElement>document.getElementById("textHeaders")).setCustomValidity("invalid");
                } else {
                    (<HTMLTextAreaElement>document.getElementById("textHeaders")).setCustomValidity("");
                }
            }
        },
        methods: {
            isInvalidToSend: function (): boolean {
                const elInvalid = $(":invalid");

                return elInvalid && elInvalid.length > 0 ? true : false;
            },

            isHeadersInvalid: function (): boolean {
                return $("#textHeaders").is(":invalid");
            },

            updateMethod: function (method: string): void {
                this.method = method;
            },

            displayResponseAsync: displayResponseAsync,
            sendRequestAsync: sendRequestAsync,
            validateServerCert: validateServerCert
        }
    });
})();

export default vm;
