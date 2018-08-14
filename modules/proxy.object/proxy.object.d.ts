//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "http-express.proxy.object" {
    import { IDisposable } from "http-express.common";
    import { IRoutePattern, ICommunicator } from "http-express.remoting";

    export interface Resolver {
        (proxy: IObjectRemotingProxy, name: string, ...extraArgs: Array<any>): Promise<IDisposable>;
    }

    export interface IObjectRemotingProxy extends IDisposable {
        readonly id: string;
        readonly routePattern: IRoutePattern;
        readonly communicator: ICommunicator;

        requestAsync<T>(identifier: string, ...extraArgs: Array<any>): Promise<T & IDisposable>;

        setResolver(resolver: Resolver): void;
        getResolver(): Resolver;
    }
}

declare module "http-express.module-manager" {
    import { ICommunicator, IRoutePattern } from "http-express.remoting";
    import { IObjectRemotingProxy } from "http-express.proxy.object";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "remoting.proxy",
            pattern: string | RegExp,
            communicator: ICommunicator,
            ownCommunicator?: boolean): Promise<IObjectRemotingProxy>;
    }
}
