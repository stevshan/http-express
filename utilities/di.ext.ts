//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "./utils";
import { IDiDescriptor } from "./di";

export interface IDescriptor {
    (...args: Array<any>): any;
}

export function dedication(typeDescriptor: IDescriptor, injects: Array<string>): IDiDescriptor {
    if (!Function.isFunction(typeDescriptor)) {
        throw new Error("typeDescriptor must be a function.");
    }

    if (Array.isNullUndefinedOrEmpty(injects)) {
        injects = undefined;
    } else if (!Array.isArray(injects)) {
        throw new Error("inject must be an array of string.");
    } else {
        for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
            const inject = injects[injectIndex];

            if (String.isEmptyOrWhitespace(inject)) {
                injects[injectIndex] = undefined;
            } else if (!String.isString(inject)) {
                throw new Error("Inject identity must be a string.");
            }
        }
    }

    return (container, ...extraArgs) => {
        const args: Array<any> = [];

        if (injects !== undefined) {
            for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
                const inject = injects[injectIndex];

                if (inject !== undefined) {
                    const arg = container.getDep(inject);

                    if (arg === undefined) {
                        throw new Error(`Required inject, "${inject}", is not available in the container.`);
                    }

                    args.push(arg);
                } else {
                    args.push(null);
                }
            }
        }

        if (Array.isArray(extraArgs) && extraArgs.length > 0) {
            for (let extraArgIndex = 0; extraArgIndex < extraArgs.length; extraArgIndex++) {
                args.push(extraArgs[extraArgIndex]);
            }
        }

        return typeDescriptor(...args);
    };
}

export function singleton(instance: any): IDiDescriptor {
    return (container) => instance;
}

export function lazySingleton(typeDescriptor: IDescriptor, injects: Array<string>): IDiDescriptor {
    let descriptor = dedication(typeDescriptor, injects);
    let singleton: any = undefined;

    return (container, ...extraArgs) => {
        if (singleton === undefined) {
            singleton = descriptor(container, ...extraArgs);
            descriptor = undefined;
        }

        return singleton;
    };
}
