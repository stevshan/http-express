//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { electron } from "../../../utilities/electron-adapter";
import * as semver from "semver";

const Vue = require("vue/dist/vue.min.js");

const vm = new Vue({
    el: "#TitleBar",
    data: {
        latestVersion: electron.app.getVersion(),
        versionChecking: false,
        latestVersionLink: ""
    },
    computed: {
        isWindowMaximized: () => electron.remote.getCurrentWindow().isMaximized(),
        appVersion: () => electron.app.getVersion(),
        hasNewVersion: function (): boolean {
            return semver.gt(this.latestVersion, this.appVersion);
        }
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

(async (): Promise<void> => {
    vm.versionChecking = true;

    try {
        const settings = await moduleManager.getComponentAsync("settings");
        const httpClient = await moduleManager.getComponentAsync("http.node-http-client", null);
        const link = await settings.getAsync<string>("latestVersionLink");

        vm.latestVersionLink = link;

        const semverRegex = /\/v?([0-9]+\.[0-9]+\.[0-9]+(\-[a-zA-Z\.]+(\+[a-zA-Z0-9\.\-]+)?)?)\s*$/;
        const response = await httpClient.getAsync(link);
        const headers = await response.headers;
        const statusCode = await response.statusCode;

        if (statusCode !== 302) {
            return;
        }

        const result = semverRegex.exec(<string>headers["location"]);

        if (!result) {
            return;
        }

        vm.latestVersion = result[1];

        await httpClient.disposeAsync();
        await settings.disposeAsync();
    } finally {
        vm.versionChecking = false;
    }
})();

export default vm;
