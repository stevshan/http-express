//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "http-express.module-manager" {
    import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "browser-window",
            options?: BrowserWindowConstructorOptions): Promise<BrowserWindow>;
    }
}
