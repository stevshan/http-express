"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const fs = require("fs");
const tmp = require("tmp");
const buffer_1 = require("buffer");
const electron_adapter_1 = require("../electron-adapter");
const env_1 = require("../env");
const utils = require("../utils");
const appUtils_1 = require("../appUtils");
async function showCertSelectPromptAsync(moduleManager, window, certificateList) {
    const certSelectionButtons = [];
    if (Array.isArray(certificateList)) {
        certificateList.forEach(certificate => certSelectionButtons.push(certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint));
    }
    if (env_1.env.platform === env_1.Platform.Linux) {
        certSelectionButtons.push("Import more certificates ...");
    }
    const prompt = await moduleManager.getComponentAsync("prompt.select-certificate", window.id, certificateList);
    const promptResults = await prompt.openAsync();
    const results = {
        selectedCert: null,
        certsImported: false
    };
    if (!utils.isNullOrUndefined(promptResults)) {
        if (promptResults.selectedCertificate) {
            results.selectedCert = promptResults.selectedCertificate;
        }
        else {
            results.certsImported = promptResults.certificatesImported;
        }
    }
    return results;
}
function handleGenerally(moduleManager, window) {
    const clientCertManager = Object.create(null);
    window.webContents.on("select-client-certificate", async (event, urlString, certificateList, selectCertificate) => {
        event.preventDefault();
        const certIdentifier = url.parse(urlString).hostname;
        if (certIdentifier in clientCertManager && clientCertManager[certIdentifier].handling) {
            clientCertManager[certIdentifier].callbacks.push(selectCertificate);
        }
        else {
            let certHandlingRecord = clientCertManager[certIdentifier];
            if (utils.isNullOrUndefined(certHandlingRecord)) {
                certHandlingRecord = {
                    handling: true,
                    callbacks: []
                };
                clientCertManager[certIdentifier] = certHandlingRecord;
            }
            else {
                certHandlingRecord.handling = true;
            }
            certHandlingRecord.callbacks.push(selectCertificate);
            const results = await showCertSelectPromptAsync(moduleManager, window, certificateList);
            if (results.selectedCert) {
                certHandlingRecord.callbacks.forEach((selectCertificateFunc) => selectCertificateFunc(results.selectedCert));
                delete clientCertManager[certIdentifier];
            }
            else if (results.certsImported) {
                certHandlingRecord.handling = false;
                window.reload();
            }
            else {
                electron_adapter_1.electron.app.exit();
            }
        }
    });
}
function handleLinux() {
    // Because it is possible that there is no cert in the chromium cert store.
    // Add a dummy cert to the store first, which can ensure that event "select-client-certificate" fires correctly.
    const dummyCertData = new buffer_1.Buffer(JSON.parse(fs.readFileSync(appUtils_1.local("./dummycert.json"), { encoding: "utf8" })).data, "base64");
    const dummayCertFile = tmp.fileSync();
    fs.writeFileSync(dummayCertFile.fd, dummyCertData);
    electron_adapter_1.electron.app.importCertificate({
        certificate: dummayCertFile.name,
        password: "123456"
    }, (result) => dummayCertFile.removeCallback());
}
function handle(moduleManager, window) {
    if (env_1.env.platform === env_1.Platform.Linux) {
        handleLinux();
    }
    handleGenerally(moduleManager, window);
}
exports.handle = handle;
//# sourceMappingURL=cert.js.map