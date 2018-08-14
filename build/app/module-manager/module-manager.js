"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const utils = require("../utilities/utils");
const di = require("../utilities/di");
const diExt = require("../utilities/di.ext");
const communicator_1 = require("../modules/ipc/communicator");
const proxy_object_1 = require("../modules/proxy.object/proxy.object");
const string_1 = require("../modules/remoting/pattern/string");
const appUtils = require("../utilities/appUtils");
const default_module_loading_policy_1 = require("./default-module-loading-policy");
const ComponentCollection_1 = require("./ComponentCollection");
var ModuleManagerAction;
(function (ModuleManagerAction) {
    ModuleManagerAction["loadModuleAsync"] = "loadModuleAsync";
    ModuleManagerAction["loadModuleDirAsync"] = "loadModuleDirAsync";
    ModuleManagerAction["requestConstructorOptions"] = "requestConstructorOptions";
})(ModuleManagerAction = exports.ModuleManagerAction || (exports.ModuleManagerAction = {}));
function createDedicationDiDescriptor(moduleManager, descriptor, injects) {
    if (!Function.isFunction(descriptor)) {
        throw new Error("descriptor must be a function.");
    }
    if (Array.isNullUndefinedOrEmpty(injects)) {
        injects = undefined;
    }
    else if (!Array.isArray(injects)) {
        throw new Error("inject must be an array of string.");
    }
    else {
        for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
            const inject = injects[injectIndex];
            if (String.isEmptyOrWhitespace(inject)) {
                injects[injectIndex] = undefined;
            }
            else if (!String.isString(inject)) {
                throw new Error("Inject identity must be a string.");
            }
        }
    }
    return async (container, ...extraArgs) => {
        const args = [];
        if (injects !== undefined) {
            for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
                const inject = injects[injectIndex];
                if (inject !== undefined) {
                    const arg = await moduleManager.getComponentAsync(inject);
                    if (arg === undefined) {
                        throw new Error(`Required inject, "${inject}", is not available in the module manager.`);
                    }
                    args.push(arg);
                }
                else {
                    args.push(null);
                }
            }
        }
        if (Array.isArray(extraArgs) && extraArgs.length > 0) {
            for (let extraArgIndex = 0; extraArgIndex < extraArgs.length; extraArgIndex++) {
                args.push(extraArgs[extraArgIndex]);
            }
        }
        return descriptor(...args);
    };
}
function createLazySingletonDiDescriptor(moduleManager, descriptor, injects) {
    const dedicationDescriptor = createDedicationDiDescriptor(moduleManager, descriptor, injects);
    let singleton = undefined;
    return (container, ...extraArgs) => {
        if (singleton === undefined) {
            singleton = dedicationDescriptor(container, ...extraArgs);
            descriptor = undefined;
        }
        return singleton;
    };
}
var Patterns;
(function (Patterns) {
    Patterns.ModuleManager = new string_1.default("/module-manager");
    Patterns.ObjectProxy = new string_1.default("/module-manager/object-proxy");
})(Patterns = exports.Patterns || (exports.Patterns = {}));
class ModuleManager {
    constructor(hostVersion, parentCommunicator) {
        this.onProxyResolvingAsync = async (proxy, name, ...extraArgs) => {
            const dep = this.container.getDep(name, ...extraArgs);
            if (dep) {
                return dep;
            }
            return this.getComponentFromProxiesAsync(proxy, name, ...extraArgs);
        };
        this.onModuleManagerMessageAsync = async (communicator, path, content) => {
            switch (content.action) {
                case ModuleManagerAction.loadModuleDirAsync:
                    const loadDirMsg = content;
                    await this.loadModuleDirAsync(loadDirMsg.content);
                    break;
                case ModuleManagerAction.loadModuleAsync:
                    const loadModuleMsg = content;
                    await this.loadModuleAsync(loadModuleMsg.content);
                    break;
                default:
                    throw new Error(`Unknown ModuleManagerAction: ${content.action}`);
            }
        };
        if (!semver.valid(hostVersion)) {
            throw new Error(`Invalid hostVersion "${hostVersion}".`);
        }
        this._hostVersion = hostVersion;
        this.moduleLoadingInfos = [];
        this.moduleLoadingPolicy = new default_module_loading_policy_1.default();
        this.container = new di.DiContainer();
        if (parentCommunicator) {
            this.parentProxy = proxy_object_1.ObjectRemotingProxy.create(Patterns.ObjectProxy, parentCommunicator, true);
            this.parentProxy.setResolver(this.onProxyResolvingAsync);
            parentCommunicator.map(Patterns.ModuleManager, this.onModuleManagerMessageAsync);
        }
        this.container.set("module-manager", diExt.singleton(this));
    }
    get hostVersion() {
        return this._hostVersion;
    }
    get loadedModules() {
        return this.moduleLoadingInfos.slice();
    }
    async newHostAsync(hostName, hostCommunicator) {
        if (String.isEmptyOrWhitespace(hostName)) {
            throw new Error("hostName cannot be null/undefined/empty.");
        }
        if (!this.children) {
            this.children = [];
        }
        if (0 <= this.children.findIndex((child) => child.proxy.id === hostName)) {
            throw new Error(`hostName, "${hostName}", already exists.`);
        }
        let proxy;
        let childProcess;
        if (!hostCommunicator) {
            childProcess =
                appUtils.fork(appUtils.local("./bootstrap.js"), [appUtils.toCmdArg(ModuleManager.ConstructorOptionsCmdArgName, JSON.stringify(this.generateConstructorOptions()))]);
            hostCommunicator = communicator_1.Communicator.fromChannel(childProcess, { id: hostName });
            proxy = await proxy_object_1.ObjectRemotingProxy.create(Patterns.ObjectProxy, hostCommunicator, true, hostName);
        }
        else {
            proxy = await proxy_object_1.ObjectRemotingProxy.create(Patterns.ObjectProxy, hostCommunicator, false, hostName);
        }
        proxy.setResolver(this.onProxyResolvingAsync);
        this.children.push({
            process: childProcess,
            proxy: proxy,
            communicator: hostCommunicator
        });
    }
    async destroyHostAsync(hostName) {
        if (String.isEmptyOrWhitespace(hostName)) {
            throw new Error("hostName cannot be null/undefined/empty.");
        }
        if (!this.children) {
            return;
        }
        const childIndex = this.children.findIndex((child) => child.proxy.id === hostName);
        if (childIndex < 0) {
            return;
        }
        const child = this.children[childIndex];
        await child.proxy.disposeAsync();
        if (child.process) {
            child.process.kill();
        }
        this.children.splice(childIndex, 1);
        child.communicator = undefined;
        child.process = undefined;
        child.proxy = undefined;
    }
    async loadModuleDirAsync(dirName, hostName, respectLoadingMode) {
        if (!fs.existsSync(dirName)) {
            throw new Error(`Directory "${dirName}" doesn't exist.`);
        }
        const dirStat = fs.statSync(dirName);
        if (!dirStat.isDirectory()) {
            throw new Error(`Path "${dirName}" is not a directory.`);
        }
        if (!utils.isNullOrUndefined(hostName) && !String.isEmptyOrWhitespace(hostName)) {
            const child = await this.obtainChildAsync(hostName);
            await child.communicator.sendAsync(Patterns.ModuleManager.getRaw(), {
                action: ModuleManagerAction.loadModuleDirAsync,
                content: dirName
            });
        }
        else {
            const loadedModules = [];
            // Load modules.
            for (const subName of fs.readdirSync(dirName)) {
                const modulePath = path.join(dirName, subName);
                const moduleStat = fs.statSync(modulePath);
                if (moduleStat.isFile() && path.extname(modulePath) !== ".js") {
                    continue;
                }
                const loadedModule = await this.internalLoadModuleAsync(modulePath, respectLoadingMode);
                if (!loadedModule) {
                    continue;
                }
                loadedModules.push(loadedModule);
            }
            // Initialize modules.
            for (const module of loadedModules) {
                await this.initializeModuleAsync(module);
            }
        }
    }
    setModuleLoadingPolicy(policy) {
        if (utils.isNullOrUndefined(policy)) {
            policy = new default_module_loading_policy_1.default();
        }
        if (!Function.isFunction(policy.shouldLoadAsync)) {
            throw new Error("policy must implement shouldLoad() function.");
        }
        this.moduleLoadingPolicy = policy;
    }
    async loadModuleAsync(path, hostName, respectLoadingMode) {
        if (!fs.existsSync(path)) {
            throw new Error(`path "${path}" doesn't exist.`);
        }
        if (!utils.isNullOrUndefined(hostName) && !String.isEmptyOrWhitespace(hostName)) {
            const child = await this.obtainChildAsync(hostName);
            await child.communicator.sendAsync(Patterns.ModuleManager.getRaw(), {
                action: ModuleManagerAction.loadModuleAsync,
                content: path
            });
        }
        else {
            const module = await this.internalLoadModuleAsync(path, respectLoadingMode);
            if (Function.isFunction(module.initializeAsync)) {
                await module.initializeAsync(this);
            }
        }
    }
    register(componentInfo) {
        if (!componentInfo || !Object.isObject(componentInfo)) {
            throw new Error("componentInfo must be provided.");
        }
        if (!String.isString(componentInfo.name) || String.isEmptyOrWhitespace(componentInfo.name)) {
            throw new Error("componentInfo.name must be provided. (non-empty/whitespaces)");
        }
        if (!Function.isFunction(componentInfo.descriptor)) {
            throw new Error("componentInfo.descriptor function must be provided.");
        }
        return this.registerComponents([componentInfo]);
    }
    getComponentAsync(componentIdentity, ...extraArgs) {
        if (String.isEmptyOrWhitespace(componentIdentity)) {
            throw new Error("componentIdentity cannot be null/undefined/empty.");
        }
        const component = this.container.getDep(componentIdentity, ...extraArgs);
        if (component !== undefined) {
            return Promise.resolve(component);
        }
        return this.getComponentFromProxiesAsync(null, componentIdentity, ...extraArgs);
    }
    onHostVersionMismatch(callback) {
        if (callback === undefined) {
            return this.hostVersionMismatchHandler;
        }
        else if (callback === null) {
            this.hostVersionMismatchHandler = null;
        }
        else if (Function.isFunction(callback)) {
            this.hostVersionMismatchHandler = callback;
        }
        else {
            throw new Error("Provided callback must be a function.");
        }
    }
    generateConstructorOptions() {
        return {
            hostVersion: this.hostVersion,
            initialModules: this.loadedModules.filter((info) => info.loadingMode === "Always")
        };
    }
    registerComponents(componentInfos) {
        for (const componentInfo of componentInfos) {
            if (componentInfo.singleton === true) {
                this.container.set(componentInfo.name, createLazySingletonDiDescriptor(this, componentInfo.descriptor, componentInfo.deps));
            }
            else {
                this.container.set(componentInfo.name, createDedicationDiDescriptor(this, componentInfo.descriptor, componentInfo.deps));
            }
        }
        return this;
    }
    async obtainChildAsync(hostName) {
        let childIndex = this.children ? this.children.findIndex((child) => child.proxy.id === hostName) : -1;
        if (childIndex < 0) {
            await this.newHostAsync(hostName);
            childIndex = this.children.findIndex((child) => child.proxy.id === hostName);
        }
        return this.children[childIndex];
    }
    async internalLoadModuleAsync(modulePath, respectLoadingMode) {
        if (!(await this.moduleLoadingPolicy.shouldLoadAsync(this, path.basename(modulePath)))) {
            return undefined;
        }
        const module = require(modulePath);
        if (!Function.isFunction(module.getModuleMetadata)) {
            throw new Error(`Invalid module "${modulePath}": missing getModuleMetadata().`);
        }
        const componentCollection = new ComponentCollection_1.default();
        const moduleInfo = module.getModuleMetadata(componentCollection);
        if (!(await this.moduleLoadingPolicy.shouldLoadAsync(this, moduleInfo))) {
            return undefined;
        }
        this.moduleLoadingInfos.push({
            location: modulePath,
            name: moduleInfo.name,
            version: moduleInfo.version,
            hostVersion: moduleInfo.hostVersion,
            loadingMode: moduleInfo.loadingMode
        });
        if (respectLoadingMode === true && moduleInfo.loadingMode !== "Always") {
            return undefined;
        }
        if (!utils.isNullOrUndefined(moduleInfo.hostVersion)
            && !String.isEmptyOrWhitespace(moduleInfo.hostVersion)
            && !semver.gte(this.hostVersion, moduleInfo.hostVersion)) {
            if (!Function.isFunction(this.hostVersionMismatchHandler)
                || !this.hostVersionMismatchHandler(moduleInfo, this.hostVersion, moduleInfo.hostVersion)) {
                throw new Error(`Invalid module "${path}": Expected host version: ${moduleInfo.hostVersion}. Current host version: ${this.hostVersion}`);
            }
        }
        this.registerComponents(componentCollection.getComponents());
        return module;
    }
    async initializeModuleAsync(module) {
        if (Function.isFunction(module.initializeAsync)) {
            await module.initializeAsync(this);
        }
    }
    async getComponentFromProxiesAsync(fromProxy, componentIdentity, ...extraArgs) {
        const fromProxyId = fromProxy ? fromProxy.id : null;
        if (this.children) {
            for (const child of this.children) {
                if (fromProxyId === child.proxy.id) {
                    continue;
                }
                const component = await child.proxy.requestAsync(componentIdentity, ...extraArgs);
                if (component) {
                    return component;
                }
            }
        }
        if (this.parentProxy && this.parentProxy.id !== fromProxyId) {
            return this.parentProxy.requestAsync(componentIdentity, ...extraArgs);
        }
        return undefined;
    }
}
ModuleManager.ConstructorOptionsCmdArgName = "module-manager-constructor-options";
exports.ModuleManager = ModuleManager;
//# sourceMappingURL=module-manager.js.map