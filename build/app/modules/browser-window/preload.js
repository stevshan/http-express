"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
require("../../module-manager/bootstrap");
process.once("loaded", async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;
});
//# sourceMappingURL=preload.js.map