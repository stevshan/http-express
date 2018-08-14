"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
const electron_1 = require("electron");
const env_1 = require("../../utilities/env");
exports.getModuleMetadata = (components) => {
    return {
        name: "main",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
exports.initializeAsync = async (moduleManager) => {
    electron_1.app.on("window-all-closed", (event) => undefined);
    if (electron_1.app.isReady()) {
        return startup();
    }
    electron_1.app.once("ready", startup);
};
async function startup() {
    const log = await moduleManager.getComponentAsync("logging");
    if (env_1.env.platform === env_1.Platform.MacOs) {
        const settings = await moduleManager.getComponentAsync("settings");
        log.writeInfoAsync("Initialize application menu for macOS.");
        electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(await settings.getAsync("defaultMenu/" + env_1.env.platform)));
    }
    const mainWindow = await moduleManager.getComponentAsync("browser-window");
    mainWindow.loadURL(appUtils.local("./main.html"));
    // Handle "window-all-closed" event.
    electron_1.app.removeAllListeners("window-all-closed");
    electron_1.app.once("window-all-closed", async () => {
        const log = await moduleManager.getComponentAsync("logging");
        log.writeInfoAsync("'window-all-closed': app.quit().");
        electron_1.app.quit();
    });
    log.writeInfoAsync("application startup finished.");
}
//# sourceMappingURL=index.js.map