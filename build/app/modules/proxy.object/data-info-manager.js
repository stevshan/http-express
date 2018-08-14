"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const data_info_1 = require("./data-info");
const reference_node_1 = require("./reference-node");
const FuncName_DisposeAsync = "disposeAsync";
class DataInfoManager {
    constructor(delegation) {
        if (!Object.isObject(delegation) || delegation === null) {
            throw new Error("delegate must be supplied.");
        }
        this.delegation = delegation;
        this.refRoot = reference_node_1.ReferenceNode.createRoot();
    }
    get disposed() {
        return this.refRoot === undefined || this.delegation === undefined;
    }
    get(refId) {
        this.validateDisposal();
        const referee = this.refRoot.referById(refId);
        if (!referee) {
            return undefined;
        }
        return referee.target;
    }
    async disposeAsync() {
        if (!this.disposed) {
            const promises = this.refRoot.getRefereeIds().map((refId) => refId === this.refRoot.id ? Promise.resolve() : this.releaseByIdAsync(refId));
            await Promise.all(promises);
            this.refRoot = undefined;
            this.delegation = undefined;
        }
    }
    addReferenceById(refereeId, parentId) {
        this.validateDisposal();
        const referee = this.refRoot.referById(refereeId);
        if (!referee) {
            throw new Error(`refereeId (${refereeId}) doesn't exist.`);
        }
        parentId = parentId || this.refRoot.id;
        referee.addRefererById(parentId);
    }
    referAsDataInfo(target, parentId) {
        this.validateDisposal();
        return this.toDataInfo(target, parentId);
    }
    realizeDataInfo(dataInfo, parentId) {
        this.validateDisposal();
        if (dataInfo.id) {
            parentId = parentId || this.refRoot.id;
            const existingRef = this.refRoot.referById(dataInfo.id, parentId);
            if (existingRef) {
                return existingRef.target;
            }
            if (dataInfo.type === data_info_1.DataType.Object) {
                return this.realizeObjectDataInfo(dataInfo, parentId);
            }
            else if (dataInfo.type === data_info_1.DataType.Function) {
                return this.realizeFunctionDataInfo(dataInfo, parentId);
            }
            else {
                // Log Error [BUG].
            }
        }
        if (dataInfo.type === data_info_1.DataType.Buffer) {
            return Buffer.from(dataInfo.value.data);
        }
        return dataInfo.value;
    }
    async releaseByIdAsync(refId, parentId, locally) {
        this.validateDisposal();
        const referee = this.refRoot.referById(refId);
        if (referee) {
            if (locally !== true) {
                await this.delegation.disposeAsync(refId, parentId);
            }
            parentId = parentId || this.refRoot.id;
            referee.removeRefererById(parentId);
        }
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error("DataInfoManager already disposed.");
        }
    }
    toDataInfo(target, parentId, recursive) {
        let dataInfo = {
            type: data_info_1.dataTypeOf(target)
        };
        const existingRefId = this.refRoot.getRefId(target);
        parentId = parentId || this.refRoot.id;
        recursive = !(recursive === false);
        if (existingRefId) {
            dataInfo.id = existingRefId;
            dataInfo = this.refRoot.getRefDataInfo(target) || dataInfo;
            this.refRoot.referById(existingRefId, parentId);
        }
        else if (Object.isSerializable(target)) {
            dataInfo.value = target;
        }
        else if (recursive && dataInfo.type === data_info_1.DataType.Object) {
            return this.toObjectDataInfo(target, parentId);
        }
        else {
            const ref = this.refRoot.refer(target, parentId);
            dataInfo.id = ref.id;
        }
        return dataInfo;
    }
    toObjectDataInfo(target, parentId) {
        const ref = this.refRoot.refer(target, parentId);
        let dataInfo = ref.getRefDataInfo(target);
        if (dataInfo) {
            return dataInfo;
        }
        dataInfo = {
            type: data_info_1.DataType.Object,
            id: ref.id,
            memberInfos: Object.create(null)
        };
        const memberInfos = dataInfo.memberInfos;
        let currentObj = target;
        while (currentObj && currentObj !== Object.prototype) {
            const propertyDescriptors = Object.getOwnPropertyDescriptors(currentObj);
            for (const propertyName in propertyDescriptors) {
                const propertyDescriptor = propertyDescriptors[propertyName];
                if (!propertyDescriptor.enumerable
                    || !propertyDescriptor.writable
                        && !propertyDescriptor.get
                        && !propertyDescriptor.set) {
                    memberInfos[propertyName] = this.toDataInfo(propertyDescriptor.value, dataInfo.id, false);
                }
            }
            currentObj = Object.getPrototypeOf(currentObj);
        }
        return ref.setRefDataInfo(target, dataInfo);
    }
    generateDisposeFunc(refId, parentId, superDisposeFunc) {
        return async () => {
            if (superDisposeFunc) {
                await superDisposeFunc();
            }
            await this.releaseByIdAsync(refId, parentId, false);
        };
    }
    realizeFunctionDataInfo(dataInfo, parentId) {
        const base = () => undefined;
        base[FuncName_DisposeAsync] = this.generateDisposeFunc(dataInfo.id, parentId);
        const handlers = {
            apply: async (target, thisArg, args) => {
                const refId = this.refRoot.getRefId(target);
                const thisArgDataInfo = this.toDataInfo(thisArg, refId);
                const argsDataInfos = [];
                for (const arg of args) {
                    argsDataInfos.push(this.toDataInfo(arg, refId));
                }
                const resultDataInfo = await this.delegation.applyAsync(refId, thisArgDataInfo, argsDataInfos);
                return this.realizeDataInfo(resultDataInfo, refId);
            }
        };
        const funcProxy = new Proxy(base, handlers);
        const parentRef = this.refRoot.referById(parentId);
        parentRef.addReferee(funcProxy, dataInfo.id);
        return funcProxy;
    }
    realizeObjectDataInfo(dataInfo, parentId) {
        const base = Object.create(null);
        const handlers = {
            get: (target, property, receiver) => {
                const baseValue = target[property];
                if (baseValue || typeof property === "symbol") {
                    return baseValue;
                }
                const refId = this.refRoot.getRefId(target);
                const resultDataInfoPromise = this.delegation.getPropertyAsync(refId, property);
                return resultDataInfoPromise.then((resultDataInfo) => this.realizeDataInfo(resultDataInfo, refId));
            },
            set: (target, property, value, receiver) => {
                if (typeof property === "symbol") {
                    target[property] = value;
                    return true;
                }
                if (property in target) {
                    return false;
                }
                const refId = this.refRoot.getRefId(target);
                const valueDataInfo = this.toDataInfo(value, refId);
                this.delegation.setPropertyAsync(refId, property, valueDataInfo);
                return true;
            },
            has: (target, prop) => {
                return true;
            }
        };
        const objProxy = new Proxy(base, handlers);
        const parentRef = this.refRoot.referById(parentId);
        // Register the dataInfo before initialize the members.
        parentRef.addReferee(objProxy, dataInfo.id);
        if (dataInfo.memberInfos) {
            for (const propertyName of Object.getOwnPropertyNames(dataInfo.memberInfos)) {
                Object.defineProperty(base, propertyName, {
                    enumerable: false,
                    configurable: false,
                    writable: propertyName === FuncName_DisposeAsync,
                    value: this.realizeDataInfo(dataInfo.memberInfos[propertyName], dataInfo.id)
                });
            }
        }
        base[FuncName_DisposeAsync] = this.generateDisposeFunc(dataInfo.id, parentId, base[FuncName_DisposeAsync]);
        return objProxy;
    }
}
exports.DataInfoManager = DataInfoManager;
//# sourceMappingURL=data-info-manager.js.map