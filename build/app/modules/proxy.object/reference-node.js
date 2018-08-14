"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
const utils = require("../../utilities/utils");
class ReferenceNode {
    get internalRoot() {
        return this._root || this;
    }
    get root() {
        return this._root;
    }
    get id() {
        return this._id;
    }
    get target() {
        return this._target;
    }
    static createRoot() {
        return new ReferenceNode(undefined, undefined);
    }
    getRefereeIds() {
        return Object.values(this.referees).map((ref) => ref.id);
    }
    addReferee(target, newRefId) {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }
        if (!utils.isNullOrUndefined(newRefId)
            && (newRefId === "" || !String.isString(newRefId))) {
            throw new Error("newRefId must be non-empty string.");
        }
        const referee = this.create(target, newRefId);
        this.addRefereeById(referee.id);
        return referee;
    }
    addRefereeById(refereeId) {
        const referee = this.internalRoot.referees[refereeId];
        if (!referee) {
            throw new Error(`unknown refereeId '${refereeId}'.`);
        }
        referee.internallyAddReferer(this);
        this.internallyAddReferee(referee);
    }
    removeRefereeById(refereeId) {
        const referee = this.internalRoot.referees[refereeId];
        if (!referee) {
            return;
        }
        referee.internallyRemoveReferer(this);
        this.internallyRemoveReferee(referee);
    }
    addReferer(target, newRefId) {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }
        if (!utils.isNullOrUndefined(newRefId)
            && (newRefId === "" || !String.isString(newRefId))) {
            throw new Error("newRefId must be non-empty string.");
        }
        const referer = this.create(target, newRefId);
        this.addRefererById(referer.id);
        return referer;
    }
    addRefererById(refererId) {
        const referer = this.internalRoot.referees[refererId];
        if (!referer) {
            throw new Error(`unknown refererId '${refererId}'.`);
        }
        referer.internallyAddReferee(this);
        this.internallyAddReferer(referer);
    }
    removeRefererById(refererId) {
        const referer = this.internalRoot.referees[refererId];
        if (!referer) {
            return;
        }
        referer.internallyRemoveReferee(this);
        this.internallyRemoveReferer(referer);
    }
    referById(refereeId, refererId) {
        const referee = this.internalRoot.referees[refereeId];
        if (!referee) {
            return undefined;
        }
        if (refererId) {
            referee.addRefererById(refererId);
        }
        return referee;
    }
    refer(target, refererId) {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }
        const existingRefId = this.getRefId(target);
        let referee;
        if (existingRefId) {
            referee = this.internalRoot.referees[existingRefId];
            if (!referee) {
                throw new Error(`The target already been referenced but refId: ${existingRefId} is unknown.`);
            }
        }
        else {
            referee = this.create(target);
        }
        if (refererId) {
            referee.addRefererById(refererId);
        }
        return referee;
    }
    getRefId(target) {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            return undefined;
        }
        return target[this.symbol_refId];
    }
    setRefDataInfo(target, dataInfo) {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }
        return target[this.symbol_dataInfo] = dataInfo;
    }
    getRefDataInfo(target) {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            return undefined;
        }
        return target[this.symbol_dataInfo];
    }
    constructor(root, target, refId) {
        if (utils.isNullOrUndefined(root) !== utils.isNullOrUndefined(target)) {
            throw new Error("root and target must be provided togehter or none are provided.");
        }
        refId = refId || uuidv4();
        this._root = root;
        this._id = refId;
        this._target = target;
        this.referees = Object.create(null);
        if (!utils.isNullOrUndefined(root)) {
            this.symbol_refId = this.internalRoot.symbol_refId;
            this.symbol_dataInfo = this.internalRoot.symbol_dataInfo;
            this.referers = Object.create(null);
            this.internalRoot.internallyAddReferee(this);
            this.target[this.symbol_refId] = this._id;
        }
        else {
            // When this is a root node.
            this.symbol_refId = Symbol("refId");
            this.symbol_dataInfo = Symbol("dataInfo");
            this.referers = undefined;
            this.referees[this._id] = this;
        }
    }
    create(target, newRefId) {
        const refId = target[this.symbol_refId];
        if (refId) {
            throw new Error(`target has already been referenced. refId=${refId}`);
        }
        return new ReferenceNode(this.internalRoot, target, newRefId);
    }
    isOrphan() {
        return Object.isEmpty(this.referers);
    }
    internallyAddReferee(referee) {
        this.referees[referee.id] = referee;
    }
    internallyRemoveReferee(referee) {
        delete this.referees[referee.id];
    }
    internallyAddReferer(referer) {
        this.referers[referer.id] = referer;
    }
    internallyRemoveReferer(referer) {
        delete this.referers[referer.id];
        if (this.isOrphan()) {
            this.release();
        }
    }
    release() {
        Object.values(this.referees).forEach(referee => referee.removeRefererById(this._id));
        if (this._target) {
            delete this._target[this.symbol_refId];
            delete this._target[this.symbol_dataInfo];
            this._target = undefined;
        }
        delete this._root.referees[this._id];
        this.referees = undefined;
        this.referers = undefined;
    }
}
exports.ReferenceNode = ReferenceNode;
//# sourceMappingURL=reference-node.js.map