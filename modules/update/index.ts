//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModule } from "http-express.module-manager";
import { IUpdateService } from "http-express.update";
import { ISettings } from "http-express.settings";
import { ILog } from "http-express.logging";
import { IHttpClient } from "http-express.http";
import { IUpdateSettings } from "./update";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components.register<IUpdateService>({
        name: "update",
        version: appUtils.getAppVersion(),
        singleton: true,
        descriptor:
            async (log: ILog, settings: ISettings, httpsClient: IHttpClient) =>
                settings.getAsync<IUpdateSettings>("update")
                    .then((updateSettings) => import("./update").then((module) => new module.default(log, updateSettings, httpsClient))),
        deps: ["logging", "settings", "http.https-client"]
    });

    return {
        name: "update",
        version: appUtils.getAppVersion()
    };
};
