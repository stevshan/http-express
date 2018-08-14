"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const utils = require("../../utilities/utils");
const electron_adapter_1 = require("../../utilities/electron-adapter");
const env_1 = require("../../utilities/env");
const appUtils = require("../../utilities/appUtils");
const constants_1 = require("./constants");
class Prompt {
    constructor(moduleManager, promptOptions) {
        this.moduleManager = moduleManager;
        this.promptOptions = promptOptions;
        this.promise = new Promise((resolve, reject) => {
            this.promise_reject = reject;
            this.promise_resolve = resolve;
        });
    }
    get disposed() {
        return this.promise === undefined;
    }
    async initializeAsync() {
        this.validateDisposal();
        this.promptWindow =
            await this.moduleManager.getComponentAsync("browser-window", {
                frame: utils.getValue(this.promptOptions.frame, true),
                maximizable: false,
                minimizable: utils.getValue(this.promptOptions.minimizable, false),
                closable: utils.getValue(this.promptOptions.closable, true),
                show: false,
                modal: true,
                fullscreenable: false,
                useContentSize: true,
                resizable: utils.getValue(this.promptOptions.resizable, false),
                parent: this.promptOptions.parentWindowId ? electron_adapter_1.electron.BrowserWindow.fromId(this.promptOptions.parentWindowId) : null,
                icon: utils.getValue(this.promptOptions.icon, appUtils.getIconPath()),
                webPreferences: {
                    preload: appUtils.local("./preload.js")
                }
            });
        this.promptOptions.showMenu = utils.getValue(this.promptOptions.showMenu, false);
        this.promptWindow.setMenuBarVisibility(this.promptOptions.showMenu);
        if (this.promptOptions.showMenu && Object.isObject(this.promptOptions.menuTemplate)) {
            if (env_1.env.platform !== env_1.Platform.MacOs) {
                this.promptWindow.setMenu(electron_1.Menu.buildFromTemplate(this.promptOptions.menuTemplate));
            }
            else {
                electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(this.promptOptions.menuTemplate));
            }
        }
        // Size has to be set after menu settings applied, otherwise the size will be inaccurate.
        this.promptWindow.setContentSize(utils.getValue(this.promptOptions.width, 640), utils.getValue(this.promptOptions.height, 480));
        this.promptWindow.once("ready-to-show", () => {
            this.promptWindow.show();
        });
        this.promptWindow.webContents.once("crashed", (event, killed) => {
            if (!killed && !this.promptWindow.isDestroyed()) {
                this.promptWindow.destroy();
            }
            this.cleanupIpcListeners();
            this.promise_reject("crashed");
        });
        this.promptWindow.on("close", (event) => {
            this.cleanupIpcListeners();
            this.promise_resolve(this.promptResult);
        });
        electron_1.ipcMain.once(utils.format(constants_1.ChannelNameFormat, this.promptWindow.id, constants_1.EventNames.Finished), (event, result) => this.promptResult = result);
        electron_1.ipcMain.once(utils.format(constants_1.ChannelNameFormat, this.promptWindow.id, constants_1.EventNames.RequestPromptOptions), (event) => event.returnValue = this.promptOptions);
    }
    openAsync() {
        this.validateDisposal();
        if (!this.promptWindow) {
            throw new Error("Prompt is not initialized.");
        }
        this.promptWindow.loadURL(this.promptOptions.pageUrl);
        return this.promise;
    }
    disposeAsync() {
        this.promise = undefined;
        this.promise_reject = undefined;
        this.promise_resolve = undefined;
        this.promptWindow = undefined;
        this.promptResult = undefined;
        return Promise.resolve();
    }
    cleanupIpcListeners() {
        for (const eventName in constants_1.EventNames) {
            electron_1.ipcMain.removeAllListeners(utils.format(constants_1.ChannelNameFormat, this.promptWindow.id, eventName));
        }
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error("Prompt already disposed.");
        }
    }
}
class PromptService {
    constructor(moduleManager) {
        if (!Object.isObject(moduleManager)) {
            throw new Error("valid moduleManager must be supplied.");
        }
        this.moduleManager = moduleManager;
    }
    async createAsync(promptOptions) {
        const prompt = new Prompt(this.moduleManager, promptOptions);
        await prompt.initializeAsync();
        return prompt;
    }
}
exports.PromptService = PromptService;
//# sourceMappingURL=prompt.js.map