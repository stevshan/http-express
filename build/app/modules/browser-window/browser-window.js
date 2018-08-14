"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const url = require("url");
const uuidv5 = require("uuid/v5");
const env_1 = require("../../utilities/env");
const appUtils = require("../../utilities/appUtils");
const module_manager_1 = require("../../module-manager/module-manager");
const UuidNamespace = "614e2e95-a80d-4ee5-9fd5-fb970b4b01a3";
function handleSslCert(window) {
    const trustedCertManager = Object.create(null);
    window.webContents.on("certificate-error", (event, urlString, error, certificate, trustCertificate) => {
        event.preventDefault();
        const certIdentifier = url.parse(urlString).hostname + certificate.subjectName;
        if (certIdentifier in trustedCertManager) {
            trustCertificate(trustedCertManager[certIdentifier]);
        }
        else {
            trustedCertManager[certIdentifier] = false;
            electron_1.dialog.showMessageBox(window, {
                type: "warning",
                buttons: ["Yes", "Exit"],
                title: "Untrusted certificate",
                message: "Do you want to trust this certificate?",
                detail: "Subject: " + certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint,
                cancelId: 1,
                defaultId: 0,
                noLink: true,
            }, (response, checkboxChecked) => {
                if (response !== 0) {
                    electron_1.app.quit();
                    return;
                }
                trustedCertManager[certIdentifier] = true;
                trustCertificate(true);
            });
        }
    });
}
function handleNewWindow(window) {
    window.webContents.on("new-window", (event, urlString, frameName, disposition, options, additionalFeatures) => {
        event.preventDefault();
        env_1.env.start(urlString);
    });
}
function handleZoom(window) {
    let zoomLevel = 0;
    window.webContents.setZoomLevel(zoomLevel);
    window.webContents.on("before-input-event", (event, input) => {
        if (input.control) {
            if (input.type === "keyUp" && input.code === "Digit0") {
                window.webContents.setZoomLevel(0);
            }
            else if (input.type === "keyDown") {
                switch (input.code) {
                    case "Equal":
                        window.webContents.setZoomLevel(++zoomLevel);
                        break;
                    case "Minus":
                        window.webContents.setZoomLevel(--zoomLevel);
                        break;
                    default:
                        break;
                }
            }
        }
    });
}
function addModuleManagerConstructorOptions(windowOptions, moduleManager) {
    if (!windowOptions.webPreferences) {
        windowOptions.webPreferences = Object.create(null);
    }
    windowOptions.webPreferences["additionalArguments"] = [
        appUtils.toCmdArg(module_manager_1.ModuleManager.ConstructorOptionsCmdArgName, JSON.stringify(moduleManager.generateConstructorOptions()))
    ];
}
async function createBrowserWindowAsync(moduleManager, options) {
    const windowOptions = {
        height: 768,
        width: 1024,
        show: false,
        icon: appUtils.getIconPath(),
        webPreferences: {
            preload: appUtils.local("./preload.js"),
            nodeIntegration: true
        }
    };
    if (Object.isObject(options)) {
        const webPreferences = windowOptions.webPreferences;
        Object.assign(webPreferences, options.webPreferences);
        Object.assign(windowOptions, options);
        windowOptions.webPreferences = webPreferences;
    }
    addModuleManagerConstructorOptions(windowOptions, moduleManager);
    const window = new electron_1.BrowserWindow(windowOptions);
    const hostName = uuidv5(window.id.toString(), UuidNamespace);
    await moduleManager.newHostAsync(hostName, await moduleManager.getComponentAsync("ipc.communicator", window.webContents));
    window.on("page-title-updated", (event, title) => event.preventDefault());
    window.setTitle(`${window.getTitle()} - ${electron_1.app.getVersion()}`);
    handleSslCert(window);
    handleNewWindow(window);
    if (env_1.env.platform !== env_1.Platform.MacOs) {
        handleZoom(window);
    }
    window.once("closed", async () => await moduleManager.destroyHostAsync(hostName));
    window.once("ready-to-show", () => window.show());
    return window;
}
exports.default = createBrowserWindowAsync;
//# sourceMappingURL=browser-window.js.map