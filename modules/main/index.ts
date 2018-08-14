//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo, IModule, IModuleManager } from "http-express.module-manager";

import * as appUtils from "../../utilities/appUtils";
import { app, Menu, MenuItemConstructorOptions } from "electron";
import { env, Platform } from "../../utilities/env";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    return {
        name: "main",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};

(<IModule>exports).initializeAsync = async (moduleManager: IModuleManager): Promise<void> => {
    app.on("window-all-closed", (event) => undefined);

    if (app.isReady()) {
        return startup();
    }

    app.once("ready", startup);
};

async function startup(): Promise<void> {
    const log = await moduleManager.getComponentAsync("logging");

    if (env.platform === Platform.MacOs) {
        const settings = await moduleManager.getComponentAsync("settings");

        log.writeInfoAsync("Initialize application menu for macOS.");
        Menu.setApplicationMenu(
            Menu.buildFromTemplate(
                await settings.getAsync<Array<MenuItemConstructorOptions>>("defaultMenu/" + env.platform)));
    }

    const mainWindow = await moduleManager.getComponentAsync("browser-window");

    mainWindow.loadURL(appUtils.local("./main.html"));

    // Handle "window-all-closed" event.
    app.removeAllListeners("window-all-closed");
    app.once("window-all-closed", async () => {
        const log = await moduleManager.getComponentAsync("logging");

        log.writeInfoAsync("'window-all-closed': app.quit().");
        app.quit();
    });

    log.writeInfoAsync("application startup finished.");
}
