//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDisposable } from "http-express.common";
import { ChannelType } from "http-express.ipc";

export interface IMessage {
    id: string;
    succeeded?: boolean;
    path?: string;
    body?: any;
}

export interface IChannelProxy extends IDisposable {
    readonly channel: ChannelType;
    
    sendMessage(msg: IMessage): boolean;
    setDataHandler(handler: ChannelProxyDataHandler): void;
}

export interface ChannelProxyDataHandler {
    (channel: ChannelType, data: any): void | Promise<void>;
}

export const UuidNamespace = "65ef6f94-e6c9-4c95-8360-6d29de87b1dd";
