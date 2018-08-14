"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const env_1 = require("../../utilities/env");
const utils = require("../../utilities/utils");
(async () => {
    const promptContext = await moduleManager.getComponentAsync("prompt.prompt-context");
    const importCertificates = async (certPaths, callback) => {
        let allSucceeded = true;
        let doneNumber = 0;
        for (const certPath of certPaths) {
            let input = await moduleManager.getComponentAsync("prompt.input", electron_1.remote.getCurrentWindow().id, {
                password: true,
                title: "Importing certificate: " + path.basename(certPath),
                message: "Please provide the password to decrypt the certificate:"
            });
            if (utils.isNullOrUndefined(input) || input === "") {
                input = null;
            }
            electron_1.remote.app.importCertificate({
                certificate: certPath,
                password: input,
            }, (result) => {
                allSucceeded = allSucceeded && result === 0;
                if (++doneNumber === certPaths.length) {
                    callback(allSucceeded);
                }
            });
        }
    };
    const selectCertificateModule = angular.module("select-certificate", []);
    class SelectCertController {
        constructor($scope) {
            $scope.certificates = promptContext.promptOptions.data;
            $scope.getDateString = (dateInSecs) => new Date(dateInSecs * 1000).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
            $scope.isCertValid = (startDateInSecs, expiryDateInSecs) => {
                const now = Date.now();
                return now >= startDateInSecs * 1000 && now < expiryDateInSecs * 1000;
            };
            $scope.supportImportCerts = () => env_1.env.platform === env_1.Platform.Linux;
            $scope.cancel = () => promptContext.finish(null);
            $scope.selectCert = (cert) => promptContext.finish({
                selectedCertificate: cert,
                certificatesImported: false
            });
            $scope.importCerts = () => {
                electron_1.remote.dialog.showOpenDialog(electron_1.remote.getCurrentWindow(), {
                    title: "Import certificiates ...",
                    filters: [
                        {
                            name: "Certificates (*.pfx; *.p12)",
                            extensions: ["p12", "pfx"]
                        }
                    ],
                    properties: ["openFile", "multiSelections"]
                }, (filePaths) => {
                    if (Array.isArray(filePaths) && filePaths.length > 0) {
                        importCertificates(filePaths, (allSucceeded) => promptContext.finish({ certificatesImported: true }));
                    }
                });
            };
        }
    }
    selectCertificateModule.controller("selectCertController", ["$scope", SelectCertController]);
})();
//# sourceMappingURL=select-certificate.js.map