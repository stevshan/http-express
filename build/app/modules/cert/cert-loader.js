"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const fileSytem = require("../../utilities/fileSystem");
const utils = require("../../utilities/utils");
class CertLoader {
    static isPfxClientCert(cert) {
        return cert.type === "pfx"
            && (String.isString(cert["pfx"]) || cert["pfx"] instanceof Buffer);
    }
    static isPemClientCert(cert) {
        return cert.type === "pem"
            && (String.isString(cert["key"]) || cert["key"] instanceof Buffer)
            && (String.isString(cert["cert"]) || cert["cert"] instanceof Buffer);
    }
    async loadAsync(cert) {
        if (utils.isNullOrUndefined(cert)) {
            throw new Error("cert must be provided.");
        }
        if (CertLoader.isPemClientCert(cert)) {
            if (String.isString(cert.cert)) {
                cert.cert = await fileSytem.readFileAsync(cert.cert);
            }
            if (String.isString(cert.key)) {
                cert.key = await fileSytem.readFileAsync(cert.cert);
            }
        }
        else if (CertLoader.isPfxClientCert(cert)) {
            if (String.isString(cert.pfx)) {
                cert.pfx = await fileSytem.readFileAsync(cert.pfx);
            }
        }
        else {
            throw new Error("Invalid certificate.");
        }
        return cert;
    }
    async loadPfxAsync(path, password) {
        const cert = Object.create(null);
        cert.type = "pfx";
        cert.pfx = await fileSytem.readFileAsync(path);
        if (password) {
            if (!String.isString(password)) {
                throw new Error("password must be a string.");
            }
            cert.password = password;
        }
        return cert;
    }
    async loadPemAsync(certPath, keyPath, keyPassword) {
        const cert = Object.create(null);
        cert.type = "pem";
        cert.cert = await fileSytem.readFileAsync(certPath);
        if (keyPassword) {
            if (!String.isString(keyPassword)) {
                throw new Error("keyPassword must be a string.");
            }
            cert.password = keyPassword;
        }
        if (keyPath) {
            cert.key = await fileSytem.readFileAsync(keyPath);
        }
        return cert;
    }
}
exports.CertLoader = CertLoader;
//# sourceMappingURL=cert-loader.js.map