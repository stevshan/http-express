//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "http-express.update" {
    import { IVersionInfo } from "http-express.common";

    export interface IUpdateService {
        updateAsync(): Promise<void>;

        requestVersionInfoAsync(): Promise<IVersionInfo>;
    }
}

declare module "http-express.module-manager" {
    import { IUpdateService } from "http-express.update";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "update"): Promise<IUpdateService>;
    }
}
