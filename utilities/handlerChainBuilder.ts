//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHandlerChainBuilder, IAsyncHandlerConstructor, FunctionType } from "http-express.common";

import * as utils from "./utils";

export class HandlerChainBuilder<THandler extends FunctionType> implements IHandlerChainBuilder<THandler> {
    private readonly chain: Array<IAsyncHandlerConstructor<THandler>> = [];

    public async handleAsync(constructor: IAsyncHandlerConstructor<THandler>): Promise<IHandlerChainBuilder<THandler>> {
        if (!Function.isFunction(constructor)) {
            throw new Error("constructor should be a function.");
        }

        this.chain.push(constructor);

        return this;
    }

    public async buildAsync(): Promise<THandler> {
        let constructor: IAsyncHandlerConstructor<THandler>;
        let nextHandler: THandler = undefined;

        while (constructor = this.chain.pop()) {
            nextHandler = await constructor(nextHandler);

            if (!utils.isNullOrUndefined(nextHandler) && !Function.isFunction(nextHandler)) {
                throw new Error("Contructed handler must be a function.");
            }
        }

        return nextHandler;
    }
}
