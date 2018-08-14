//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const common = require("./common");

const path = require("path");
const log = require("fancy-log");
const fs = require("fs");

const utils = common.utils;

/**
 * @typedef IDynamicDependency
 * @property {string} version
 * @property {Array.<'dev'|'prod'>} dependencyTypes
 * @property {string} platform
 */

/**
  * @typedef IPackageJson
  * @property {string} name
  * @property {string} version
  * @property {string} main
  * @property {string} homepage
  * @property {string} [license]
  * @property {Array.<string>} [devDependencies]
  * @property {Array.<string>} [dependencies]
  * @property {Array.<string>} [optionalDependencies]
  * @property {Array.<string>} [peerDependencies]
  * @property {Array.<string>} [bundleDependencies]
  * @property {Array.<string>} [extensionDependencies]
  * @property {Array.<IDynamicDependency>} [dynamicDependencies]
  */

/**
 * @typedef IBuildTarget
 * @property {Array.<'x86'|'x64'>} archs - Array of Architecture
 */

/**
 * @typedef IBuildTargets
 * @property {IBuildTarget} [windows]
 * @property {IBuildTarget} [macos]
 * @property {IBuildTarget} [linux]
 */

/**
 * @typedef IBuildPaths
 * @property {string} buildDir
 * @property {string} publishDir
 * @property {string} appDir
 * @property {string} modulesDir
 */

/**
 * @typedef IBuildLicensing
 * @property {string} apis.usages.url
 * @property {string} apis.usages.method
 * @property {string} group
 * @property {string} project
 * @property {string} thirdPartyNoticesFileName;
 * @property {Object.<string, string>} packageLicenses
 */

/**
 * @typedef IUpdateInfos
 * @property {string} baseUrl
 * @property {Object.<string, IPackageInfo | string>} packageInfos;
 */

/**
 * @typedef IBuildInfos
 * @property {string} productName
 * @property {string} description
 * @property {string} copyright
 * @property {string} targetExecutableName
 * @property {string} appId
 * @property {string} appCategory
 * @property {string} buildNumber
 * @property {IUpdateInfos} updateInfos
 * @property {IBuildTargets} targets
 * @property {IBuildPaths} paths
 * @property {IBuildLicensing} licensing
 */

/**
 * Create a JSON object from a file.
 * @param {string} fileName
 * @param {string} [baseDir]
 * @returns {any} the JSON object.
 */
function loadJson(fileName, baseDir) {
    if (!utils.isNullOrUndefined(baseDir) && !utils.isString(baseDir)) {
        throw new Error("baseDir must be a string.");
    }

    if (!utils.string.isNullUndefinedOrWhitespaces(baseDir)) {
        fileName = path.join(baseDir, fileName);
    } else {
        fileName = path.resolve(fileName);
    }

    return JSON.parse(fs.readFileSync(fileName, { encoding: "utf8" }));
}
exports.loadJson = loadJson;

/** @type {IPackageJson} */
const packageJson = loadJson("./package.json");
exports.packageJson = packageJson;

/**
 * @type {IBuildInfos}
 */
const buildInfos = loadJson("./.build/buildInfos.json");
exports.buildInfos = buildInfos;

// buildInfos auto-initializiation
log.info("Starting", "buildInfos auto-initializiation", "...");

if (buildInfos.buildNumber === "*") {
    log.info("Read", "BUILD_BUILDNUMBER", "=", process.env["BUILD_BUILDNUMBER"]);
    log.info("Read", "packageJson.version", "=", packageJson.version)
    buildInfos.buildNumber = process.env["BUILD_BUILDNUMBER"] || packageJson.version;
    log.info("Initialized", "buildInfos.buildNumber:", "=", buildInfos.buildNumber);
}

if (buildInfos.paths.appDir === "*") {
    buildInfos.paths.appDir = path.join(buildInfos.paths.buildDir, "app");
    log.info("Initialized", "buildInfos.paths.appDir", "=", buildInfos.paths.appDir);
}

log.info("Finished", "buildInfos auto-initializiation", ".");

/**
 * @typedef ITypeScriptConfig
 * @property {Array.<string>} include
 * @property {Array.<string>} exclude
 * @property {*} compilerOptions
 */

/** @type {ITypeScriptConfig} */
exports.tsConfig = loadJson("./tsconfig.json");
