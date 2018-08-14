"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const env_1 = require("../../utilities/env");
const appUtils_1 = require("../../utilities/appUtils");
const execAsync = util_1.promisify(child_process_1.exec);
var StoreNames;
(function (StoreNames) {
    StoreNames["My"] = "My";
})(StoreNames || (StoreNames = {}));
class PkiService {
    async getCertificateInfosAsync(storeName) {
        if (env_1.env.platform !== env_1.Platform.Windows) {
            return undefined;
        }
        if (!Object.values(StoreNames).includes(storeName)) {
            throw new Error(`Invalid storeName: ${storeName}`);
        }
        const outputs = await execAsync(`powershell "${appUtils_1.local("./windows/Get-Certificates.ps1")}" -StoreName "${storeName}"`, { encoding: "utf8" });
        const certJsonObjects = JSON.parse(outputs.stdout);
        for (const certJsonObject of certJsonObjects) {
            certJsonObject.validExpiry = new Date(certJsonObject.validExpiry);
            certJsonObject.validStart = new Date(certJsonObject.validStart);
        }
        return certJsonObjects;
    }
    async getCertificateAsync(certInfo) {
        if (!certInfo
            || !certInfo.thumbprint
            || !String.isString(certInfo.thumbprint)) {
            throw new Error("Invalid certInfo: missing thumbprint.");
        }
        const cmdOutputs = await execAsync(`powershell "${appUtils_1.local("./windows/Get-PfxCertificateData.ps1")}" -Thumbprint "${certInfo.thumbprint}"`, { encoding: "utf8" });
        const pfxBase64Data = cmdOutputs.stdout;
        if (pfxBase64Data === "undefined") {
            return undefined;
        }
        const pfxCert = Object.create(null);
        pfxCert.type = "pfx";
        pfxCert.pfx = Buffer.from(pfxBase64Data, "base64");
        return pfxCert;
    }
}
exports.PkiService = PkiService;
//# sourceMappingURL=pki-service.js.map