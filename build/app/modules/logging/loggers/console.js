"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const utils = require("../../../utilities/utils");
const log_1 = require("../log");
class ConsoleLogger {
    get name() {
        return Promise.resolve(this.settings.name);
    }
    get disposed() {
        return this.console === undefined;
    }
    constructor(settings, targetConsole) {
        if (!Object.isObject(settings)) {
            settings = {
                name: "console",
                component: "logging.logger.console"
            };
        }
        this.settings = settings;
        this.settings.logAllProperties = settings.logAllProperties === true;
        this.settings.logCallerInfo = utils.getValue(settings.logCallerInfo, true);
        if (utils.isNullOrUndefined(targetConsole)) {
            this.console = console;
        }
        else {
            this.console = targetConsole;
        }
    }
    writeAsync(properties, severity, message) {
        this.validateDisposal();
        const consoleMsg = this.formatConsoleMsg(properties, message);
        switch (severity) {
            case log_1.Severities.Critical:
                this.console.error(consoleMsg);
                this.console.trace();
                break;
            case log_1.Severities.Error:
                this.console.error(consoleMsg);
                break;
            case log_1.Severities.Warning:
                this.console.warn(consoleMsg);
                break;
            case log_1.Severities.Event:
            case log_1.Severities.Information:
                this.console.info(consoleMsg);
                break;
            case log_1.Severities.Verbose:
            default:
                this.console.log(consoleMsg);
                break;
        }
        return Promise.resolve();
    }
    writeExceptionAsync(properties, error) {
        this.validateDisposal();
        let exceptionMsg = "";
        exceptionMsg += error.name + ": " + error.message;
        exceptionMsg += "\r\n";
        exceptionMsg += error.stack;
        this.console.error(this.formatConsoleMsg(properties, exceptionMsg));
        return Promise.resolve();
    }
    writeMetricAsync(properties, name, value) {
        this.validateDisposal();
        this.console.info(this.formatConsoleMsg(properties, name + ": " + value.toString()));
        return Promise.resolve();
    }
    disposeAsync() {
        this.console = undefined;
        return Promise.resolve();
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error(`Logger, "${this.name}", already disposed.`);
        }
    }
    formatProperties(properties) {
        let consoleMsg = "";
        if (!utils.isNullOrUndefined(properties)) {
            if (this.settings.logAllProperties) {
                for (const propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName) && !propertyName.startsWith("Caller.")) {
                        consoleMsg += `<${propertyName}:${properties[propertyName]}>`;
                    }
                }
            }
            if (this.settings.logCallerInfo
                && (!String.isEmptyOrWhitespace(properties["Caller.FileName"])
                    || !String.isEmptyOrWhitespace(properties["Caller.Name"]))) {
                consoleMsg += `[${path.basename(properties["Caller.FileName"])}:${properties["Caller.Name"]}]`;
            }
        }
        return consoleMsg;
    }
    formatConsoleMsg(properties, message) {
        let consoleMsg = "[" + new Date().toLocaleTimeString() + "]";
        const formatedProperties = this.formatProperties(properties);
        if (!String.isEmptyOrWhitespace(formatedProperties)) {
            consoleMsg += " ";
            consoleMsg += formatedProperties;
        }
        consoleMsg += " ";
        consoleMsg += message;
        return consoleMsg;
    }
}
exports.default = ConsoleLogger;
//# sourceMappingURL=console.js.map