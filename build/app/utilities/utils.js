"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
var Symbols;
(function (Symbols) {
    Symbols.Serializable = Symbol("serializable");
})(Symbols || (Symbols = {}));
Symbol.isSymbol = (value) => {
    return typeof value === "symbol";
};
Number.isNumber = (value) => {
    return typeof value === "number" || value instanceof Number;
};
Function.isFunction = (value) => {
    return typeof value === "function";
};
Object.isObject = (value) => {
    return value !== null && typeof value === "object";
};
Object.isEmpty = (value) => {
    if (isNullOrUndefined(value)) {
        throw new Error("value cannot be null/undefined.");
    }
    for (const key in value) {
        if (key) {
            return false;
        }
        return false;
    }
    return true;
};
Object.markSerializable = (value, serializable = true) => {
    if (!isNullOrUndefined(value)) {
        if (Function.isFunction(value)) {
            throw new Error("Cannot mark function objects as serializable.");
        }
        if (Symbol.isSymbol(value)) {
            throw new Error("Cannot mark symbol objects as serializable.");
        }
        serializable = serializable === true;
        value[Symbols.Serializable] = serializable;
    }
    return value;
};
Object.isSerializable = (value) => {
    const valueType = typeof value;
    switch (valueType) {
        case "object":
            if (value === null) {
                return true;
            }
            if (Object.prototype.hasOwnProperty.call(value, Symbols.Serializable)) {
                return value[Symbols.Serializable] === true;
            }
            return Function.isFunction(value["toJSON"])
                || (Object.getPrototypeOf(value) === Object.prototype
                    && Object.values(value).every((propertyValue) => Object.isSerializable(propertyValue)));
        case "undefined":
        case "number":
        case "boolean":
        case "string":
            return true;
        case "symbol":
        case "function":
        default:
            return false;
    }
};
Array.isNullUndefinedOrEmpty = (value) => {
    return value === undefined || value === null || (Array.isArray(value) && value.length <= 0);
};
String.possibleString = (value) => {
    return isNullOrUndefined(value) || String.isString(value);
};
String.isString = (value) => {
    return typeof value === "string" || value instanceof String;
};
String.isEmpty = (value) => {
    return value === "";
};
String.isEmptyOrWhitespace = (value) => {
    return value.trim() === "";
};
Error.prototype.toJSON = function () {
    const error = Object.create(null);
    error.message = `Error: ${this.message}`;
    error.stack = this.stack;
    return error;
};
function defaultStringifier(obj, padding) {
    padding = getValue(padding, 0);
    if (obj === null) {
        return "null";
    }
    else if (obj === undefined) {
        return "undefined";
    }
    else {
        const objType = typeof obj;
        if ((objType !== "object")
            || (objType === "object"
                && Function.isFunction(obj.toString)
                && obj.toString !== Object.prototype.toString)) {
            return obj.toString();
        }
        else {
            let str = `\n${"".padStart(padding)}{\n`;
            for (const propertyName of Object.getOwnPropertyNames(obj)) {
                str += `${"".padStart(padding + 4)}${propertyName}: ${defaultStringifier(obj[propertyName], padding + 4)}\n`;
            }
            str += `${"".padStart(padding)}}`;
            return str;
        }
    }
}
exports.defaultStringifier = defaultStringifier;
function formatEx(stringifier, format, ...args) {
    if (!Function.isFunction(stringifier)) {
        throw new Error("stringifier must be a function.");
    }
    if (!String.isString(format)) {
        throw new Error("format must be a string");
    }
    if (!Array.isArray(args)) {
        throw new Error("args must be an array.");
    }
    if (args === null || args === undefined) {
        return format;
    }
    let matchIndex = -1;
    return format.replace(/(\{*)(\{(\d*)\})/gi, (substring, escapeChar, argIdentifier, argIndexStr) => {
        matchIndex++;
        if (escapeChar.length > 0) {
            return argIdentifier;
        }
        const argIndex = argIndexStr.length === 0 ? matchIndex : parseInt(argIndexStr, 10);
        if (isNaN(argIndex) || argIndex < 0 || argIndex >= args.length) {
            throw new Error(`Referenced arg index, '${argIndexStr}',is out of range of the args.`);
        }
        return stringifier(args[argIndex]);
    });
}
exports.formatEx = formatEx;
exports.format = formatEx.bind(null, defaultStringifier);
function isNullOrUndefined(value) {
    return value === undefined || value === null;
}
exports.isNullOrUndefined = isNullOrUndefined;
function getValue(arg, defaultValue) {
    return (arg === undefined || arg === null) ? defaultValue : arg;
}
exports.getValue = getValue;
function prepareStackTraceOverride(error, structuredStackTrace) {
    return structuredStackTrace;
}
function getCallerInfo() {
    const previousPrepareStackTraceFn = Error.prepareStackTrace;
    try {
        Error.prepareStackTrace = prepareStackTraceOverride;
        const callStack = (new Error()).stack;
        let directCallerInfo = undefined;
        for (let callStackIndex = 0; callStackIndex < callStack.length; callStackIndex++) {
            const stack = callStack[callStackIndex];
            const stackFileName = stack.getFileName();
            if (directCallerInfo === undefined) {
                if (stackFileName !== module.filename) {
                    directCallerInfo = {
                        fileName: stackFileName,
                        functionName: stack.getFunctionName(),
                        typeName: stack.getTypeName(),
                        lineNumber: stack.getLineNumber(),
                        columnNumber: stack.getColumnNumber()
                    };
                }
            }
            else if (stackFileName !== directCallerInfo.fileName) {
                return {
                    fileName: stackFileName,
                    functionName: stack.getFunctionName(),
                    typeName: stack.getTypeName(),
                    lineNumber: stack.getLineNumber(),
                    columnNumber: stack.getColumnNumber()
                };
            }
        }
        return directCallerInfo;
    }
    finally {
        Error.prepareStackTrace = previousPrepareStackTraceFn;
    }
}
exports.getCallerInfo = getCallerInfo;
//# sourceMappingURL=utils.js.map