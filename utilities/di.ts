//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "http-express.common";

import * as utils from "./utils";

export interface IDiDescriptor {
    (diContainer: IDiContainer, ...extraArgs: Array<any>): any;
}

export interface IDiContainer {
    getDep<T>(name: string, ...extraArgs: Array<any>): T;
    get(name: string): IDiDescriptor;
    set(name: string, descriptor: IDiDescriptor): IDiContainer;
}

export interface IDiDescriptorDictionary {
    get(name: string): IDiDescriptor;
    set(name: string, descriptor: IDiDescriptor): void;
}

export class DiDescriptorDictionary implements IDiDescriptorDictionary {
    private readonly descriptorDictionary: IDictionary<IDiDescriptor>;

    constructor() {
        this.descriptorDictionary = Object.create(null);
    }

    public get(name: string): IDiDescriptor {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }

        return this.descriptorDictionary[name];
    }

    public set(name: string, descriptor: IDiDescriptor): void {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }

        if (utils.isNullOrUndefined(descriptor)) {
            delete this.descriptorDictionary[name];
        } else {
            this.descriptorDictionary[name] = descriptor;
        }
    }
}

export class DiContainer implements IDiContainer {
    private readonly descriptorDictionary: IDiDescriptorDictionary;

    constructor(dictionary?: IDiDescriptorDictionary) {
        if (utils.isNullOrUndefined(dictionary)) {
            this.descriptorDictionary = new DiDescriptorDictionary();
        } else {
            this.descriptorDictionary = dictionary;
        }
    }

    public getDep<T>(name: string, ...extraArgs: Array<any>): T {
        const descriptor = this.get(name);

        if (utils.isNullOrUndefined(descriptor)) {
            return undefined;
        } else {
            return descriptor(this, ...extraArgs);
        }
    }

    public get(name: string): IDiDescriptor {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }

        return this.descriptorDictionary.get(name);
    }

    public set(name: string, descriptor: IDiDescriptor): IDiContainer {
        if (String.isEmptyOrWhitespace(name)) {
            throw new Error("name should not be null/undefined/empty.");
        }

        if (utils.isNullOrUndefined(descriptor)) {
            this.descriptorDictionary.set(name, undefined);
        } else {
            this.descriptorDictionary.set(name, descriptor);
        }

        return this;
    }
}
