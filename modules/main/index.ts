//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo, IModule, IModuleManager } from "http-express.module-manager";
import { MenuItemConstructorOptions } from "electron";

import { electron } from "../../utilities/electron-adapter";
import * as appUtils from "../../utilities/appUtils";
import { env, Platform } from "../../utilities/env";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    return {
        name: "main",
        version: appUtils.getAppVersion()
    };
};

(<IModule>exports).initializeAsync = async (moduleManager: IModuleManager): Promise<void> => {
    electron.app.on("window-all-closed", (event) => undefined);

    if (electron.app.isReady()) {
        return startup();
    }

    electron.app.once("ready", startup);
};

async function startup(): Promise<void> {
    const log = await moduleManager.getComponentAsync("logging");

    if (env.platform === Platform.MacOs) {
        const settings = await moduleManager.getComponentAsync("settings");

        log.writeInfoAsync("Initialize application menu for macOS.");
        electron.Menu.setApplicationMenu(
            electron.Menu.buildFromTemplate(
                await settings.getAsync<Array<MenuItemConstructorOptions>>("defaultMenu/" + env.platform)));
    }

    const mainWindow =
        await moduleManager.getComponentAsync(
            "browser-window");

    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(appUtils.local("./main.html"));

    // Handle "window-all-closed" event.
    electron.app.removeAllListeners("window-all-closed");
    electron.app.once("window-all-closed", async () => {
        const log = await moduleManager.getComponentAsync("logging");

        log.writeInfoAsync("'window-all-closed': app.quit().");
        electron.app.quit();
    });

    log.writeInfoAsync("application startup finished.");
}
