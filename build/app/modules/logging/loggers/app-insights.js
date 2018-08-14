"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const applicationinsights_1 = require("applicationinsights");
const utils = require("../../../utilities/utils");
const log_1 = require("../log");
function toAppInsightsSeverity(severity) {
    switch (severity) {
        case log_1.Severities.Critical:
            return applicationinsights_1.Contracts.SeverityLevel.Critical;
        case log_1.Severities.Information:
            return applicationinsights_1.Contracts.SeverityLevel.Information;
        case log_1.Severities.Warning:
            return applicationinsights_1.Contracts.SeverityLevel.Warning;
        case log_1.Severities.Error:
            return applicationinsights_1.Contracts.SeverityLevel.Error;
        case log_1.Severities.Verbose:
        default:
            return applicationinsights_1.Contracts.SeverityLevel.Verbose;
    }
}
class AppInsightsLogger {
    get name() {
        return Promise.resolve(this._name);
    }
    get disposed() {
        return this.client === undefined;
    }
    constructor(settings) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be supplied.");
        }
        this._name = settings.name;
        this.client = new applicationinsights_1.TelemetryClient(settings["instrumentationKey"]);
    }
    writeAsync(properties, severity, message) {
        this.validateDisposal();
        const telemetry = {
            severity: toAppInsightsSeverity(severity),
            message: message
        };
        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }
        this.client.trackTrace(telemetry);
        return Promise.resolve();
    }
    writeExceptionAsync(properties, error) {
        this.validateDisposal();
        const telemetry = {
            exception: error
        };
        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }
        this.client.trackException(telemetry);
        return Promise.resolve();
    }
    writeMetricAsync(properties, name, value) {
        this.validateDisposal();
        const telemetry = {
            name: name,
            value: value
        };
        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }
        this.client.trackMetric(telemetry);
        return Promise.resolve();
    }
    disposeAsync() {
        this.client = undefined;
        return Promise.resolve();
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error(`Logger, "${this.name}", already disposed.`);
        }
    }
}
exports.default = AppInsightsLogger;
//# sourceMappingURL=app-insights.js.map