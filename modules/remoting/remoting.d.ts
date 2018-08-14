//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "http-express.remoting" {
    import { IDisposable } from "http-express.common";

    export interface IUtils {
        isCommunicator(communicator: any): communicator is ICommunicator;
        isRoutePattern(pattern: IRoutePattern): pattern is IRoutePattern;
    }

    export interface AsyncRequestHandler {
        (communicator: ICommunicator, path: string, content: any): Promise<any>;
    }

    export interface IRoutePattern {
        getRaw(): any;
        match(path: string): boolean;
        equals(pattern: IRoutePattern): boolean;
    }

    export interface ICommunicator extends IDisposable {
        readonly id: string;

        map(pattern: IRoutePattern, asyncHandler: AsyncRequestHandler): void;
        unmap(pattern: IRoutePattern): AsyncRequestHandler;

        sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse>;
    }
}

declare module "http-express.module-manager" {
    import { IUtils, IRoutePattern } from "http-express.remoting";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "remoting.utils"): Promise<IUtils>;

        getComponentAsync(componentIdentity: "remoting.pattern.string", pattern: string): Promise<IRoutePattern>;
        getComponentAsync(componentIdentity: "remoting.pattern.regex", pattern: RegExp): Promise<IRoutePattern>;
    }
}
