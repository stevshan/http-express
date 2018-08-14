"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
var DelegationType;
(function (DelegationType) {
    DelegationType["GetProperty"] = "Get";
    DelegationType["SetProperty"] = "Set";
    DelegationType["Apply"] = "Apply";
    DelegationType["Dispose"] = "Dispose";
})(DelegationType = exports.DelegationType || (exports.DelegationType = {}));
class Delegation {
    constructor(delegator) {
        this.delegator = delegator;
    }
    getPropertyAsync(refId, property) {
        const msg = {
            refId: refId,
            property: property
        };
        return this.delegator.delegateAsync(DelegationType.GetProperty, msg);
    }
    setPropertyAsync(refId, property, valueDataInfo) {
        const msg = {
            refId: refId,
            property: property,
            value: valueDataInfo
        };
        return this.delegator.delegateAsync(DelegationType.SetProperty, msg);
    }
    applyAsync(refId, thisArgDataInfo, argsDataInfos) {
        const msg = {
            refId: refId,
            thisArg: thisArgDataInfo,
            args: argsDataInfos
        };
        return this.delegator.delegateAsync(DelegationType.Apply, msg);
    }
    disposeAsync(refId, parentId) {
        const msg = {
            refId: refId,
            parentId: parentId
        };
        return this.delegator.delegateAsync(DelegationType.Dispose, msg);
    }
}
exports.Delegation = Delegation;
//# sourceMappingURL=delegate.js.map