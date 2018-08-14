//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "http-express.settings" {
    export interface ISettings {
        getAsync<T>(settingPath: string): Promise<T>;

        setAsync<T>(settingPath: string, value: T): Promise<void>;
    }

    export interface ISettingsService {
        readonly default: Promise<ISettings>;

        openAsync(...names: Array<string>): Promise<ISettings>;
    }
}

declare module "http-express.module-manager" {
    import { ISettingsService, ISettings } from "http-express.settings";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "settings.service"): Promise<ISettingsService>;
        getComponentAsync(componentIdentity: "settings"): Promise<ISettings>;
    }
}
