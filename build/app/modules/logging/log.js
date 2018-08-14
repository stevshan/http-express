"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../../utilities/utils");
var Severities;
(function (Severities) {
    Severities["Event"] = "event";
    Severities["Verbose"] = "verbose";
    Severities["Information"] = "info";
    Severities["Warning"] = "warning";
    Severities["Error"] = "error";
    Severities["Critical"] = "critical";
})(Severities = exports.Severities || (exports.Severities = {}));
const defaultLoggingSettings = {
    logCallerInfo: true,
    loggers: [
        {
            name: "console",
            component: "logging.logger.console",
            logAllProperties: false,
            logCallerInfo: true
        }
    ]
};
async function createAsync(loggingSettings) {
    if (!utils.isNullOrUndefined(loggingSettings)
        && !Object.isObject(loggingSettings)) {
        throw new Error("loggingSettings must be an Object implementing ILoggingSettings.");
    }
    loggingSettings = loggingSettings || defaultLoggingSettings;
    const log = new Log(loggingSettings.logCallerInfo, loggingSettings.properties);
    if (!loggingSettings.loggers) {
        return log;
    }
    if (!Object.isObject(loggingSettings.loggers)) {
        throw new Error("loggingSettings.loggers must be an object implementing IDicionary<ILoggerSettings>.");
    }
    for (const loggerSettings of loggingSettings.loggers) {
        let logger;
        if (moduleManager !== undefined) {
            logger = await moduleManager.getComponentAsync(loggerSettings.component, loggerSettings);
        }
        else {
            const loggerModule = require("./loggers/" + loggerSettings.component.substr(loggerSettings.component.lastIndexOf(".") + 1));
            if (loggerModule.default !== undefined) {
                logger = new loggerModule.default(loggerSettings);
            }
            else {
                logger = new (loggerModule[loggerSettings.component])(loggerSettings);
            }
        }
        if (!logger) {
            throw new Error(`failed to load logger, ${loggerSettings.component}, named '${loggerSettings.name}'.`);
        }
        await log.addLoggerAsync(logger);
    }
    return log;
}
exports.createAsync = createAsync;
class Log {
    static stringifier(obj) {
        if (obj instanceof Error) {
            obj = obj.toJSON();
        }
        return utils.defaultStringifier(obj);
    }
    get disposed() {
        return this.loggers === undefined;
    }
    constructor(includeCallerInfo, defaultProperties) {
        if (!utils.isNullOrUndefined(defaultProperties)
            && !Object.isObject(defaultProperties)) {
            throw new Error("defaultProperties must be an object.");
        }
        this.loggers = [];
        this.defaultProperties = defaultProperties;
        this.logCallerInfo = includeCallerInfo === true;
    }
    async writeMoreAsync(properties, severity, messageOrFormat, ...params) {
        this.validateDisposal();
        if (!String.isString(messageOrFormat)) {
            return;
        }
        if (Array.isArray(params) && params.length > 0) {
            messageOrFormat = utils.formatEx(Log.stringifier, messageOrFormat, ...params);
        }
        properties = this.generateProperties(properties);
        await Promise.all(this.loggers.map((logger) => logger.writeAsync(properties, severity, messageOrFormat)));
    }
    writeAsync(severity, messageOrFormat, ...params) {
        return this.writeMoreAsync(null, severity, messageOrFormat, ...params);
    }
    writeInfoAsync(messageOrFormat, ...params) {
        return this.writeAsync(Severities.Information, messageOrFormat, ...params);
    }
    writeVerboseAsync(messageOrFormat, ...params) {
        return this.writeAsync(Severities.Verbose, messageOrFormat, ...params);
    }
    writeWarningAsync(messageOrFormat, ...params) {
        return this.writeAsync(Severities.Warning, messageOrFormat, ...params);
    }
    writeErrorAsync(messageOrFormat, ...params) {
        return this.writeAsync(Severities.Error, messageOrFormat, ...params);
    }
    writeCriticalAsync(messageOrFormat, ...params) {
        return this.writeAsync(Severities.Critical, messageOrFormat, ...params);
    }
    async writeExceptionAsync(exception, properties) {
        this.validateDisposal();
        properties = this.generateProperties(properties);
        await Promise.all(this.loggers.map((logger) => logger.writeExceptionAsync(properties, exception)));
    }
    async writeEventAsync(name, properties) {
        this.validateDisposal();
        if (!String.isString(name)) {
            return;
        }
        properties = this.generateProperties(properties);
        await Promise.all(this.loggers.map((logger) => logger.writeAsync(properties, Severities.Event, name)));
    }
    async writeMetricAsync(name, value, properties) {
        this.validateDisposal();
        if (!String.isString(name)) {
            return;
        }
        if (!Number.isNumber(value)) {
            value = 1;
        }
        properties = this.generateProperties(properties);
        await Promise.all(this.loggers.map((logger) => logger.writeMetricAsync(properties, name, value)));
    }
    async removeLoggerAsync(name) {
        this.validateDisposal();
        if (!String.isString(name)) {
            throw new Error("name must be supplied.");
        }
        for (let loggerIndex = 0; loggerIndex < this.loggers.length; loggerIndex++) {
            const logger = this.loggers[loggerIndex];
            if (name === await logger.name) {
                return this.loggers.splice(loggerIndex, 1)[0];
            }
        }
        return undefined;
    }
    async addLoggerAsync(logger) {
        this.validateDisposal();
        if (!logger) {
            throw new Error("logger must be provided.");
        }
        if (!Object.isObject(logger)) {
            throw new Error("logger must be an object implementing ILogger.");
        }
        this.loggers.push(logger);
    }
    async disposeAsync() {
        this.defaultProperties = undefined;
        this.loggers = undefined;
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error("Already disposed.");
        }
    }
    generateProperties(properties) {
        let finalProperties = null;
        if (this.defaultProperties) {
            finalProperties = Object.create(this.defaultProperties);
        }
        if (Object.isObject(properties)) {
            finalProperties = finalProperties || Object.create(null);
            finalProperties = Object.assign(finalProperties, properties);
        }
        if (this.logCallerInfo) {
            const callerInfo = utils.getCallerInfo();
            const typeName = callerInfo.typeName || "";
            let functionName = callerInfo.functionName;
            if (!functionName) {
                functionName = `<Anonymous>@{${callerInfo.lineNumber},${callerInfo.columnNumber}}`;
            }
            finalProperties = finalProperties || Object.create(null);
            finalProperties["Caller.FileName"] = callerInfo.fileName;
            if (!String.isEmptyOrWhitespace(typeName)) {
                finalProperties["Caller.Name"] = `${typeName}.`;
            }
            else {
                finalProperties["Caller.Name"] = "";
            }
            finalProperties["Caller.Name"] += `${functionName}()`;
        }
        return finalProperties;
    }
}
//# sourceMappingURL=log.js.map