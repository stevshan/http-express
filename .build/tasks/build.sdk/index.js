//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../../common");
const config = require("../../config");
const utilities = require("../../utilities");

const gulp = require("gulp");
const path = require("path");
const fs = require("fs");

const buildInfos = config.buildInfos;

/**
 * @returns {Array.<string>} 
 */
function getTypeDeclarationGlobs() {
    return utilities.formGlobs(["**/*.d.ts"]);
}

gulp.task("build:sdk@prepare",
    () => Promise.resolve(utilities.ensureDirExists(buildInfos.paths.sdkDir)));

gulp.task("build:sdk@ts-declarations",
    () =>
        gulp.src(getTypeDeclarationGlobs())
            .pipe(gulp.dest(buildInfos.paths.sdkDir)));

gulp.task("build:sdk@packagejson",
    () => {
        const packageJson = config.packageJson;
        /** @type {import("../../config").IPackageJson} */
        const sdkPackageJson = config.loadJson("./package.json", __dirname);

        sdkPackageJson.version = buildInfos.buildNumber;
        sdkPackageJson.main = packageJson.main;

        if (!sdkPackageJson.dependencies) {
            sdkPackageJson.dependencies = Object.create(null);
        } else {
            for (const depName of Object.keys(sdkPackageJson.dependencies)) {
                const depVersion = sdkPackageJson.dependencies[depName];

                if (!depVersion || depVersion === "*") {
                    let depVersion = packageJson.dependencies[depName];

                    if (!depVersion) {
                        depVersion = packageJson.devDependencies[depName];
                    }

                    if (!depVersion) {
                        throw new Error(`Cannot find the corresponding version in package.json for sdk for the dependency: ${depName}`);
                    }

                    sdkPackageJson.dependencies[depName] = depVersion;
                }
            }
        }

        Object.assign(sdkPackageJson.dependencies, packageJson.dependencies);

        fs.writeFileSync(path.join(buildInfos.paths.sdkDir, "package.json"), JSON.stringify(sdkPackageJson, undefined, 4));

        return Promise.resolve();
    });

gulp.task("build:sdk@http-express",
    () =>
        gulp.src(
            [
                path.join(buildInfos.paths.appDir, "**/*"),
                "!" + path.join(buildInfos.paths.appDir, "package.json"),
                "!" + path.join(buildInfos.paths.appDir, "node_modules"),
                "!" + path.join(buildInfos.paths.appDir, "node_modules/**/*")
            ],
            {
                base: buildInfos.paths.appDir
            })
            .pipe(gulp.dest(buildInfos.paths.sdkDir)));

gulp.task("build:sdk",
    gulp.series(
        "build:sdk@prepare",
        gulp.parallel(
            "build:sdk@ts-declarations",
            "build:sdk@packagejson",
            "build:sdk@http-express")));
