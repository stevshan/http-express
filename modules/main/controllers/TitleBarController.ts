//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { electron } from "../../../utilities/electron-adapter";

const Vue = require("vue/dist/vue.min.js");

const vm = new Vue({
    el: "#TitleBar",
    computed: {
        isWindowMaximized: () => electron.remote.getCurrentWindow().isMaximized(),
        appVersion: () => electron.app.getVersion()
    },
    methods: {
        maximizeOrRestoreWindow: () => {
            const currentWindow = electron.remote.getCurrentWindow();

            if (currentWindow.isMaximized()) {
                currentWindow.unmaximize();
            } else {
                currentWindow.maximize();
            }
        },
        minimizeWindow: () => electron.remote.getCurrentWindow().minimize(),
        closeWindow: () => electron.remote.getCurrentWindow().close()
    }
});

export default vm;
