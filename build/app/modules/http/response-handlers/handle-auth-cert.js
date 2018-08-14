"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
function isCertificateInfo(cert) {
    return cert && String.isString(cert.thumbprint);
}
function isCertificate(cert) {
    return cert && String.isString(cert.type);
}
function handleCertAsync(certLoader, pkiCertSvc, selectClientCertAsyncHandler, nextHandler) {
    const HttpMsg_ClientCertRequired = "Client certificate required";
    return async (client, log, requestOptions, requestData, response) => {
        const statusCode = await response.statusCode;
        if (statusCode === 403
            && 0 === HttpMsg_ClientCertRequired.localeCompare(await response.statusMessage, undefined, { sensitivity: "accent" })) {
            log.writeInfoAsync("Client certificate is required.");
            const validCertInfos = (await pkiCertSvc.getCertificateInfosAsync("My")).filter((certInfo) => certInfo.hasPrivateKey);
            let selectedCert = await selectClientCertAsyncHandler(requestOptions.url, validCertInfos);
            if (isCertificateInfo(selectedCert)) {
                log.writeInfoAsync(`Client certificate (thumbprint:${selectedCert.thumbprint}) is selected.`);
                selectedCert = await pkiCertSvc.getCertificateAsync(selectedCert);
            }
            else if (isCertificate(selectedCert)) {
                log.writeInfoAsync(`Custom client certificate (type: ${selectedCert.type}) is selected.`);
                selectedCert = await certLoader.loadAsync(selectedCert);
            }
            else {
                throw new Error(`Invalid client certificate: ${JSON.stringify(selectedCert, null, 4)}`);
            }
            const clientRequestOptions = await client.defaultRequestOptions;
            clientRequestOptions.clientCert = selectedCert;
            await client.updateDefaultRequestOptionsAsync(clientRequestOptions);
            log.writeInfoAsync("Re-sending the HTTPS request ...");
            return client.requestAsync(requestOptions, requestData);
        }
        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }
        return response;
    };
}
exports.default = handleCertAsync;
//# sourceMappingURL=handle-auth-cert.js.map