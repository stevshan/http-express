//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IRoutePattern } from "http-express.remoting";

export default class StringPattern implements IRoutePattern {
    private readonly pattern: string;

    constructor(pattern: string) {
        this.pattern = pattern;
    }

    public getRaw(): any {
        return this.pattern;
    }

    public equals(pattern: IRoutePattern): boolean {
        return pattern && pattern["pattern"] === this.pattern;
    }

    public match(path: string): boolean {
        return this.pattern === path;
    }
}
