//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModule } from "http-express.module-manager";
import { ISettings } from "http-express.settings";

import {
    ILoggerSettings,
    ILog,
    ILogger,
    ILoggingSettings
} from "http-express.logging";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<ILog>({
            name: "logging",
            version: appUtils.getAppVersion(),
            descriptor:
                (settings: ISettings): Promise<ILog> =>
                    import("./log").then(async (logging) => logging.createAsync(await settings.getAsync<ILoggingSettings>("logging"))),
            singleton: true,
            deps: ["settings"]
        })
        .register<ILogger>({
            name: "logging.logger.console",
            version: appUtils.getAppVersion(),
            descriptor: (loggerSettings: ILoggerSettings, targetConsole: Console) =>
                import("./loggers/console").then((module) => new module.default(loggerSettings, targetConsole))
        })
        .register<ILogger>({
            name: "logging.logger.app-insights",
            version: appUtils.getAppVersion(),
            descriptor: (loggerSettings: ILoggerSettings) =>
                import("./loggers/app-insights").then((module) => new module.default(loggerSettings))
        });

    return {
        name: "logging",
        version: appUtils.getAppVersion()
    };
};
