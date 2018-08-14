"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
const utils = require("../../utilities/utils");
const delegate_1 = require("./delegate");
const data_info_manager_1 = require("./data-info-manager");
var ProxyActionType;
(function (ProxyActionType) {
    ProxyActionType["RequestResource"] = "RequestResource";
    ProxyActionType["Delegate"] = "Delegate";
})(ProxyActionType || (ProxyActionType = {}));
const ProxyActionTypeValues = Object.values(ProxyActionType);
function isProxyMessage(msg) {
    return !utils.isNullOrUndefined(msg)
        && ProxyActionTypeValues.includes(msg.action);
}
class ObjectRemotingProxy {
    constructor(pathPattern, communicator, ownCommunicator, proxyId) {
        this.onMessage = (communicator, path, proxyMsg) => {
            if (!isProxyMessage(proxyMsg)) {
                // Log Error.
                return Promise.resolve();
            }
            const asyncRequestHandler = this.messageHandlers[proxyMsg.action];
            if (!asyncRequestHandler) {
                // Log Error.
                return Promise.resolve();
            }
            return asyncRequestHandler(communicator, path, proxyMsg);
        };
        this.onDelegateAsync = (communicator, path, msg) => {
            switch (msg.delegateType) {
                case delegate_1.DelegationType.Apply:
                    return this.onApplyAsync(communicator, path, msg);
                case delegate_1.DelegationType.Dispose:
                    return this.onDisposeAsync(communicator, path, msg);
                case delegate_1.DelegationType.GetProperty:
                    return this.onGetPropertyAsync(communicator, path, msg);
                case delegate_1.DelegationType.SetProperty:
                    return this.onSetPropertyAsync(communicator, path, msg);
                default:
                    throw new Error(`Unknown delegation type: ${msg.delegateType}`);
            }
        };
        this.onGetPropertyAsync = async (communicator, path, msg) => {
            const delegationMsg = msg.content;
            const target = this.dataInfoManager.get(delegationMsg.refId);
            if (target === undefined) {
                throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
            }
            return this.dataInfoManager.referAsDataInfo(await target[delegationMsg.property], delegationMsg.refId);
        };
        this.onSetPropertyAsync = async (communicator, path, msg) => {
            const delegationMsg = msg.content;
            const target = this.dataInfoManager.get(delegationMsg.refId);
            if (target === undefined) {
                throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
            }
            target[delegationMsg.property] = this.dataInfoManager.realizeDataInfo(delegationMsg.value, delegationMsg.refId);
            return true;
        };
        this.onApplyAsync = async (communicator, path, msg) => {
            const delegationMsg = msg.content;
            const target = this.dataInfoManager.get(delegationMsg.refId);
            if (target === undefined) {
                throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
            }
            if (typeof target !== "function") {
                throw new Error(`Target (${delegationMsg.refId}) is not a function which cannot be applied.`);
            }
            const result = await target.call(this.dataInfoManager.realizeDataInfo(delegationMsg.thisArg, delegationMsg.refId), ...delegationMsg.args.map((item) => this.dataInfoManager.realizeDataInfo(item, delegationMsg.refId)));
            return this.dataInfoManager.referAsDataInfo(result, delegationMsg.refId);
        };
        this.onDisposeAsync = (communicator, path, msg) => {
            const delegationMsg = msg.content;
            return this.dataInfoManager.releaseByIdAsync(delegationMsg.refId, delegationMsg.parentId, true);
        };
        this.onRequestResourceAsync = async (communicator, path, msg) => {
            const tempReferer = this.dataInfoManager.referAsDataInfo(() => undefined);
            const extraArgs = msg.extraArgs.map((argDataInfo) => this.dataInfoManager.realizeDataInfo(argDataInfo, tempReferer.id));
            const target = await this.resolveAsync(msg.resourceId, ...extraArgs);
            const targetDataInfo = this.dataInfoManager.referAsDataInfo(target);
            if (targetDataInfo.id) {
                msg.extraArgs.forEach((argDataInfo) => {
                    if (argDataInfo.id) {
                        this.dataInfoManager.addReferenceById(argDataInfo.id, targetDataInfo.id);
                    }
                });
            }
            await this.dataInfoManager.releaseByIdAsync(tempReferer.id);
            return targetDataInfo;
        };
        if (!Object.isObject(pathPattern)) {
            throw new Error("pathPattern must be provided.");
        }
        if (utils.isNullOrUndefined(communicator)) {
            throw new Error("communicator must be provided.");
        }
        this.id = proxyId || uuidv4();
        this._communicator = communicator;
        this.ownCommunicator = ownCommunicator === true;
        this.pathPattern = pathPattern;
        this.messageHandlers = Object.create(null);
        this.dataInfoManager = new data_info_manager_1.DataInfoManager(new delegate_1.Delegation(this));
        this.initializeMessageHandlers();
        this.communicator.map(this.pathPattern, this.onMessage);
    }
    get routePattern() {
        return this.pathPattern;
    }
    get communicator() {
        return this._communicator;
    }
    static create(pathPattern, communicator, ownCommunicator, proxyId) {
        if (!Object.isObject(pathPattern)) {
            throw new Error("pathPattern must be provided.");
        }
        if (utils.isNullOrUndefined(communicator)) {
            throw new Error("communicator must be provided.");
        }
        return new ObjectRemotingProxy(pathPattern, communicator, ownCommunicator, proxyId);
    }
    async requestAsync(identifier, ...extraArgs) {
        this.validateDisposal();
        const tempReferer = this.dataInfoManager.referAsDataInfo(() => undefined);
        try {
            const extraArgsDataInfos = extraArgs.map((arg) => this.dataInfoManager.referAsDataInfo(arg, tempReferer.id));
            const targetDataInfo = await this.communicator.sendAsync(this.pathPattern.getRaw(), {
                action: ProxyActionType.RequestResource,
                resourceId: identifier,
                extraArgs: extraArgsDataInfos
            });
            const target = this.dataInfoManager.realizeDataInfo(targetDataInfo);
            if (targetDataInfo.id) {
                extraArgsDataInfos.forEach((argDataInfo) => {
                    if (argDataInfo.id) {
                        this.dataInfoManager.addReferenceById(argDataInfo.id, targetDataInfo.id);
                    }
                });
            }
            return target;
        }
        finally {
            await this.dataInfoManager.releaseByIdAsync(tempReferer.id);
        }
    }
    setResolver(resolver) {
        this.validateDisposal();
        if (resolver && !Function.isFunction(resolver)) {
            throw new Error("resolver must be a function.");
        }
        this.resolver = resolver;
    }
    getResolver() {
        this.validateDisposal();
        return this.resolver;
    }
    get disposed() {
        return !this.messageHandlers || !this.dataInfoManager;
    }
    async disposeAsync() {
        if (!this.disposed) {
            this.communicator.unmap(this.pathPattern);
            await this.dataInfoManager.disposeAsync();
            if (this.ownCommunicator) {
                await this._communicator.disposeAsync();
            }
            this._communicator = undefined;
            this.messageHandlers = undefined;
            this.dataInfoManager = undefined;
        }
    }
    delegateAsync(type, msg) {
        return this.communicator.sendAsync(this.pathPattern.getRaw(), {
            action: ProxyActionType.Delegate,
            delegateType: type,
            content: msg
        });
    }
    resolveAsync(name, ...extraArgs) {
        if (this.resolver) {
            return this.resolver(this, name, ...extraArgs);
        }
        return undefined;
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error(`Proxy (${this.id}) already disposed.`);
        }
    }
    initializeMessageHandlers() {
        this.messageHandlers[ProxyActionType.RequestResource] = this.onRequestResourceAsync;
        this.messageHandlers[ProxyActionType.Delegate] = this.onDelegateAsync;
    }
}
exports.ObjectRemotingProxy = ObjectRemotingProxy;
//# sourceMappingURL=proxy.object.js.map