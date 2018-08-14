"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const path = require("path");
const fs = require("fs");
require("./utils");
function ensureDirExists(dirname) {
    if (!String.isString(dirname)) {
        throw new Error("dirname should be a string.");
    }
    dirname = path.resolve(dirname);
    const dirs = [];
    while (!fs.existsSync(dirname)) {
        dirs.push(dirname);
        dirname = path.dirname(dirname);
    }
    while (dirs.length > 0) {
        fs.mkdirSync(dirs.pop());
    }
}
exports.ensureDirExists = ensureDirExists;
function rmdir(dirname) {
    if (!String.isString(dirname)) {
        throw new Error("dirname should be a string.");
    }
    dirname = path.resolve(dirname);
    if (!fs.existsSync(dirname)) {
        return;
    }
    for (const subName of fs.readdirSync(dirname)) {
        const subFullName = path.join(dirname, subName);
        const stat = fs.statSync(subFullName);
        if (stat.isDirectory()) {
            rmdir(subFullName);
        }
        else {
            fs.unlinkSync(subFullName);
        }
    }
    fs.rmdirSync(dirname);
}
exports.rmdir = rmdir;
function copyfiles(srcDir, destDir) {
    if (!String.isString(srcDir)) {
        throw new Error("srcDir should be a string.");
    }
    if (!String.isString(destDir)) {
        throw new Error("destDir should be a string.");
    }
    srcDir = path.resolve(srcDir);
    if (!fs.statSync(srcDir).isDirectory()) {
        throw new Error("srcDir must point to a directory.");
    }
    destDir = path.resolve(destDir);
    ensureDirExists(destDir);
    for (const subName of fs.readdirSync(srcDir)) {
        const subFullName = path.join(srcDir, subName);
        const destFullName = path.join(destDir, subName);
        const stat = fs.statSync(subFullName);
        if (stat.isDirectory()) {
            copyfiles(subFullName, destFullName);
        }
        else {
            fs.copyFileSync(subFullName, destFullName);
        }
    }
}
exports.copyfiles = copyfiles;
exports.readFileAsync = util.promisify(fs.readFile);
//# sourceMappingURL=fileSystem.js.map