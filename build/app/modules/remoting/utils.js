"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../../utilities/utils");
class Utils {
    isCommunicator(communicator) {
        return !utils.isNullOrUndefined(communicator)
            && String.isString(communicator.id)
            && Function.isFunction(communicator.map)
            && Function.isFunction(communicator.unmap)
            && Function.isFunction(communicator.sendAsync);
    }
    isRoutePattern(pattern) {
        return !utils.isNullOrUndefined(pattern)
            && Function.isFunction(pattern.equals)
            && Function.isFunction(pattern.getRaw)
            && Function.isFunction(pattern.match);
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map