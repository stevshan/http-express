"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class StringPattern {
    constructor(pattern) {
        this.pattern = pattern;
    }
    getRaw() {
        return this.pattern;
    }
    equals(pattern) {
        return pattern && pattern["pattern"] === this.pattern;
    }
    match(path) {
        return this.pattern === path;
    }
}
exports.default = StringPattern;
//# sourceMappingURL=string.js.map