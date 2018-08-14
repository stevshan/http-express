"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const uuidv5 = require("uuid/v5");
const env_1 = require("./utilities/env");
const appUtils_1 = require("./utilities/appUtils");
async function startup() {
    const log = await moduleManager.getComponentAsync("logging");
    log.writeInfoAsync("Application starting up ...");
    if (env_1.env.platform === env_1.Platform.MacOs) {
        const settings = await moduleManager.getComponentAsync("settings");
        log.writeInfoAsync("Initialize application menu for macOS.");
        electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(await settings.getAsync("defaultMenu/" + env_1.env.platform)));
    }
    log.writeInfoAsync("Starting up connect-cluster prompt.");
    const prompt_connectCluster = await moduleManager.getComponentAsync("prompt.connect-cluster");
    const clusterUrl = await prompt_connectCluster.openAsync();
    if (clusterUrl) {
        // Start up the main window.
        global["TargetClusterUrl"] = clusterUrl;
        const mainWindow = await moduleManager.getComponentAsync("browser-window", null, true, clusterUrl);
        mainWindow.setMenuBarVisibility(false);
        log.writeEventAsync("connect-cluster", { "clusterId": uuidv5(clusterUrl, uuidv5.URL) });
        mainWindow.loadURL(appUtils_1.resolve("sfx/index.html"));
    }
    else {
        log.writeInfoAsync("No cluster url provided.");
        log.writeInfoAsync("app.quit().");
        electron_1.app.quit();
        return;
    }
    // Trigger update activity.
    (await moduleManager.getComponentAsync("update")).updateAsync();
    // Handle "window-all-closed" event.
    electron_1.app.removeAllListeners("window-all-closed");
    electron_1.app.once("window-all-closed", async () => {
        const log = await moduleManager.getComponentAsync("logging");
        log.writeInfoAsync("'window-all-closed': app.quit().");
        electron_1.app.quit();
    });
    log.writeInfoAsync("application startup finished.");
}
function default_1() {
    electron_1.app.on("window-all-closed", (event) => undefined);
    if (electron_1.app.isReady()) {
        return startup();
    }
    electron_1.app.once("ready", startup);
    return Promise.resolve();
}
exports.default = default_1;
//# sourceMappingURL=main.js.map