"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const electron_adapter_1 = require("../../utilities/electron-adapter");
const utils = require("../../utilities/utils");
const constants_1 = require("./constants");
const electron_1 = require("electron");
class PromptContext {
    finish(results) {
        electron_1.ipcRenderer.send(utils.format(constants_1.ChannelNameFormat, this.promptWindow.id, constants_1.EventNames.Finished), results);
        this.promptWindow.close();
    }
    constructor() {
        this.promptWindow = electron_adapter_1.remote.getCurrentWindow();
        this.options = electron_1.ipcRenderer.sendSync(utils.format(constants_1.ChannelNameFormat, this.promptWindow.id, constants_1.EventNames.RequestPromptOptions));
    }
    get promptOptions() {
        return this.options;
    }
}
exports.PromptContext = PromptContext;
//# sourceMappingURL=prompt-context.js.map