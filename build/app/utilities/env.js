"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
var Architecture;
(function (Architecture) {
    Architecture["Unknown"] = "unknown";
    Architecture["X86"] = "x86";
    Architecture["X64"] = "x64";
    Architecture["Arm"] = "arm";
})(Architecture = exports.Architecture || (exports.Architecture = {}));
var Platform;
(function (Platform) {
    Platform["Windows"] = "windows";
    Platform["Linux"] = "linux";
    Platform["MacOs"] = "macos";
    Platform["Unknown"] = "unknown";
})(Platform = exports.Platform || (exports.Platform = {}));
class Environment {
    get platform() {
        switch (process.platform) {
            case "win32":
                return Platform.Windows;
            case "linux":
                return Platform.Linux;
            case "darwin":
                return Platform.MacOs;
            default:
                return Platform.Unknown;
        }
    }
    get arch() {
        switch (process.arch) {
            case "ia32":
                return Architecture.X86;
            case "x64":
                return Architecture.X64;
            case "arm":
                return Architecture.Arm;
            default:
                return Architecture.Unknown;
        }
    }
    start(path) {
        const escape = (str) => {
            return str.replace(/"/g, '\\\"');
        };
        let cmd = "";
        if (!path) {
            throw new Error("path must be specified!");
        }
        switch (this.platform) {
            case Platform.Windows:
                cmd = "start \"upgrade\"";
                break;
            case Platform.MacOs:
                cmd = "open";
                break;
            case Platform.Linux:
            default:
                cmd = "xdg-open";
                break;
        }
        child_process_1.execSync(cmd + ' "' + escape(path) + '"');
    }
}
exports.env = new Environment();
//# sourceMappingURL=env.js.map