//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const pack = require("./pack");
const config = require("../config");
const versioning = require("../versioning");

const path = require("path");
const gulp = require("gulp");
const log = require("fancy-log");

const Architecture = common.Architecture;
const Platform = common.Platform;
const buildInfos = config.buildInfos;
const utils = common.utils;

/**
 * Generate the name of the zip file for given architecture.
 * @param {string} arch common.Architecture
 * @returns {string} The name of the zip file.
 */
function getZipName(arch) {
    return utils.format("{}-{}-{}.zip", buildInfos.targetExecutableName, buildInfos.buildNumber, arch);
}

gulp.task("publish:versioninfo@macos",
    () => Promise.resolve(
        versioning.generateVersionInfo(
            Platform.MacOs,
            (baseUrl, arch) => utils.format("{}/{}", baseUrl, getZipName(arch)))));

gulp.task("publish:zip@macos-x64",
    () => {
        if (buildInfos.targets[Platform.MacOs].archs.indexOf(Architecture.X64) < 0) {
            log.info("Skipping", "zip-macos-64:", "No x64 architecture specified in buildinfos.");
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const macZipper = require('electron-installer-zip');
            const packDirName = utils.format("{}-{}-{}", buildInfos.productName, pack.toPackagerPlatform(Platform.MacOs), pack.toPackagerArch(Architecture.X64));
            const appDirName = utils.format("{}.app", buildInfos.productName);

            macZipper(
                {
                    dir: path.resolve(path.join(buildInfos.paths.buildDir, packDirName, appDirName)),
                    out: path.resolve(path.join(buildInfos.paths.publishDir, Platform.MacOs, getZipName(pack.toPackagerArch(Architecture.X64))))
                },
                (err, res) => err ? reject(err) : resolve(res));
        });
    });

gulp.task("publish:zip",
    gulp.series("publish:prepare", "publish:zip@macos-x64"));

gulp.task("publish:macos",
    gulp.series(
        "pack:macos",
        gulp.parallel("publish:versioninfo@macos", "publish:zip")));