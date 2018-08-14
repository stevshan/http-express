//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChannelType, ICommunicatorConstructorOptions } from "http-express.ipc";
import { IModuleInfo, IModule } from "http-express.module-manager";
import { ICommunicator } from "http-express.remoting";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components.register<any>({
        name: "ipc.communicator",
        version: appUtils.getAppVersion(),
        descriptor: async (channel: ChannelType, options?: ICommunicatorConstructorOptions): Promise<ICommunicator> =>
            import("./communicator").then((module) => module.Communicator.fromChannel(channel, options))
    });

    return {
        name: "ipc",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
