"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
const path = require("path");
const fs = require("fs");
const url = require("url");
const child_process = require("child_process");
const env_1 = require("./env");
const Context = Object.create(null);
const CmdArgParseFormat = /^\s*\-\-([a-zA-Z0-9_\-+@]+)\=?(.*)$/g;
exports.appDir = getAppDir();
function getAppDir() {
    const argDict = toArgDict(process.argv);
    return argDict["appDir"] || argDict["app-path"] || path.dirname(require.main.filename);
}
function getInspectArg() {
    const inspectArg = getCmdArg("inspect-brk");
    if (utils.isNullOrUndefined(inspectArg)) {
        return undefined;
    }
    if (!Context.inspectPort) {
        if (String.isEmptyOrWhitespace(inspectArg)) {
            // NodeJS Default Port: https://nodejs.org/en/docs/guides/debugging-getting-started/
            Context.inspectPort = 9229;
        }
        else {
            const args = inspectArg.split(":");
            if (args.length === 1) {
                Context.inspectPort = parseInt(args[0], 10);
            }
            else if (args.length > 1) {
                Context.inspectPort = parseInt(args[1], 10);
            }
            else {
                throw new Error(`Unable to handle --inspect-brk=${inspectArg}`);
            }
            Context.inspectPort += 100;
        }
    }
    return `--inspect-brk=${Context.inspectPort++}`;
}
function getIconPath() {
    switch (env_1.env.platform) {
        case env_1.Platform.Windows:
            return local("./icons/icon.ico", true);
        case env_1.Platform.MacOs:
            return local("./icons/icon.icns", true);
        case env_1.Platform.Linux:
        default:
            return local("./icons/icon128x128.png", true);
    }
}
exports.getIconPath = getIconPath;
function toCmdArg(argName, argValue) {
    return `--${argName}=${argValue}`;
}
exports.toCmdArg = toCmdArg;
function toCmdArgs(argDict) {
    if (!utils.isNullOrUndefined(argDict)
        && (!Object.isObject(argDict) || Array.isArray(argDict))) {
        throw new Error("argDict must be an IDictionary<string>.");
    }
    const args = [];
    for (const key in argDict) {
        args.push(`--${key}=${argDict[key]}`);
    }
    return args;
}
exports.toCmdArgs = toCmdArgs;
function toArgDict(args) {
    if (!Array.isArray(args)) {
        throw new Error("args must be an array of string.");
    }
    const argDict = Object.create(null);
    for (const arg of args) {
        let matchResult;
        while (matchResult = CmdArgParseFormat.exec(arg)) {
            argDict[matchResult[1]] = matchResult[2];
        }
    }
    return argDict;
}
exports.toArgDict = toArgDict;
function getCmdArg(argName) {
    if (!Context.cmdArgs) {
        Context.cmdArgs = toArgDict(process.argv);
    }
    return Context.cmdArgs[argName];
}
exports.getCmdArg = getCmdArg;
function formEssentialForkArgs() {
    return [`--appDir=${exports.appDir}`];
}
exports.formEssentialForkArgs = formEssentialForkArgs;
function fork(modulePath, forkArgs) {
    if (!String.isString(modulePath) || String.isEmptyOrWhitespace(modulePath)) {
        throw new Error("modulePath must be provided.");
    }
    if (!utils.isNullOrUndefined(forkArgs) && !Array.isArray(forkArgs)) {
        throw new Error("forkArgs must be an array of string.");
    }
    const args = formEssentialForkArgs();
    if (Array.isArray(process.argv)) {
        let arg = getInspectArg();
        if (arg) {
            args.push(arg);
        }
    }
    if (forkArgs) {
        args.push(...forkArgs);
    }
    return child_process.fork(modulePath, args);
}
exports.fork = fork;
function getAppVersion() {
    const packageJson = JSON.parse(fs.readFileSync(local("./package.json", true), { encoding: "utf8" }));
    return packageJson.version;
}
exports.getAppVersion = getAppVersion;
function resolve(pathObject, fromAppDir = false) {
    const urlObject = {
        protocol: "file:",
        slashes: true
    };
    if (String.isString(pathObject)) {
        urlObject.pathname = local(pathObject, fromAppDir);
    }
    else {
        urlObject.pathname = local(pathObject.path, fromAppDir);
        if (pathObject.hash) {
            urlObject.hash = pathObject.hash;
        }
        if (pathObject.query) {
            urlObject.query = pathObject.query;
        }
        if (pathObject.search) {
            urlObject.search = pathObject.search;
        }
    }
    return url.format(urlObject);
}
exports.resolve = resolve;
function local(target, fromAppDir = false) {
    return path.join(fromAppDir ? exports.appDir : path.dirname(utils.getCallerInfo().fileName), target);
}
exports.local = local;
function logUnhandledRejection() {
    process.on("unhandledRejection", (reason, promise) => {
        if (moduleManager) {
            moduleManager.getComponentAsync("logging")
                .then((log) => {
                if (log) {
                    log.writeErrorAsync("Unhandled promise rejection: {}", reason);
                }
                else {
                    console.error("Unhandled promise rejection: ", promise);
                }
            });
        }
        else {
            console.error("Unhandled promise rejection: ", promise);
        }
    });
}
exports.logUnhandledRejection = logUnhandledRejection;
function injectModuleManager(moduleManager) {
    Object.defineProperty(global, "moduleManager", {
        writable: false,
        configurable: false,
        enumerable: false,
        value: moduleManager
    });
}
exports.injectModuleManager = injectModuleManager;
//# sourceMappingURL=appUtils.js.map