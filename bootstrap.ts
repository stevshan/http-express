//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

// // Bootstrap the module host environment.
// import "./module-manager/bootstrap";

// import * as appUtils from "./utilities/appUtils";

// process.once("loaded", () => Promise.resolve()
//     // Load built-in modules.
//     .then(() => moduleManager.loadModuleDirAsync(appUtils.local("modules")))

//     // Load extension modules.
//     .then(() => moduleManager.getComponentAsync("package-manager"))
//     //.then((packageManager) => moduleManager.loadModuleDirAsync(packageManager.packagesDir, "extensions"))

//     // Load ad-hoc module
//     .then(() => {
//         const adhocModuleArg = appUtils.getCmdArg("adhocModule");

//         if (adhocModuleArg) {
//             return moduleManager.loadModuleAsync(adhocModuleArg, "extensions");
//         }

//         return Promise.resolve();
//     })
// );

const tls = require("tls");
const https = require("https");
const encryption = require("crypto");

function sha256(s) {
    return encryption.createHash("sha256").update(s).digest("base64");
}
const options = {
    hostname: "self-signed.badssl.com",
    port: 443,
    path: "/",
    method: "GET",
    rejectUnauthorized: false,
    checkServerIdentity: function (host, cert) {
        console.log("Hit!!");
        throw "HiT!!!!";
        // Make sure the certificate is issued to the host we are connected to
        const err = tls.checkServerIdentity(host, cert);
        if (err) {
            return err;
        }

        // Pin the public key, similar to HPKP pin-sha25 pinning
        const pubkey256 = "pL1+qb9HTMRZJmuC/bB/ZI9d302BYrrqiVuRyW+DGrU=";
        if (sha256(cert.pubkey) !== pubkey256) {
            const msg = "Certificate verification error: " +
                `The public key of "${cert.subject.CN}" ` +
                "does not match our pinned fingerprint";
            return new Error(msg);
        }

        // Pin the exact certificate, rather then the pub key
        const cert256 = "25:FE:39:32:D9:63:8C:8A:FC:A1:9A:29:87:" +
            "D8:3E:4C:1D:98:DB:71:E4:1A:48:03:98:EA:22:6A:BD:8B:93:16";
        if (cert.fingerprint256 !== cert256) {
            const msg = "Certificate verification error: " +
                `The certificate of "${cert.subject.CN}" ` +
                "does not match our pinned fingerprint";
            return new Error(msg);
        }
    },
};

const req = https.request(options, (res) => {
    console.log("All OK. Server matched our pinned cert or public key");
    console.log("statusCode:", res.statusCode);
    // Print the HPKP values
    console.log("headers:", res.headers["public-key-pins"]);

    res.on("data", (d) => { });
});

req.on("error", (e) => {
    console.error(e.message);
});
req.end();
