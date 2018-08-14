"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
var DataType;
(function (DataType) {
    DataType["Undefined"] = "undefined";
    DataType["Null"] = "null";
    DataType["Object"] = "object";
    DataType["Boolean"] = "boolean";
    DataType["Number"] = "number";
    DataType["String"] = "string";
    DataType["Symbol"] = "symbol";
    DataType["Function"] = "function";
    DataType["Buffer"] = "node-buffer";
})(DataType = exports.DataType || (exports.DataType = {}));
const DataTypeValues = Object.values(DataType);
exports.True = {
    type: DataType.Boolean,
    value: true
};
exports.False = {
    type: DataType.Boolean,
    value: false
};
exports.Null = {
    type: DataType.Null,
    value: null
};
exports.Undefined = {
    type: DataType.Undefined,
    value: undefined
};
function dataTypeOf(data) {
    const sysType = typeof data;
    switch (sysType) {
        case DataType.Object:
            if (data === null) {
                return DataType.Null;
            }
            else if (data instanceof Buffer) {
                return DataType.Buffer;
            }
            return DataType.Object;
        default:
            return sysType;
    }
}
exports.dataTypeOf = dataTypeOf;
function isDataInfo(dataInfo) {
    return !String.isEmptyOrWhitespace(dataInfo.type)
        && DataTypeValues.includes(dataInfo.type);
}
exports.isDataInfo = isDataInfo;
//# sourceMappingURL=data-info.js.map