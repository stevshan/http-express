//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPackageRepositoryConfig } from "http-express.package-manager";
import { IDictionary } from "http-express.common";

export interface IPackageConfig {
    enabled: boolean;
}

export interface IPackageManagerConfig {
    packagesDir: string;
    repos: IDictionary<IPackageRepositoryConfig>;
    packages: IDictionary<IPackageConfig>;
}

export const PackageManagerSettingsName = "package-manager";
