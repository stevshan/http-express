"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
exports.getModuleMetadata = (components) => {
    components.register({
        name: "browser-window",
        version: appUtils.getAppVersion(),
        descriptor: require("./browser-window").default,
        deps: ["module-manager"]
    });
    return {
        name: "browser-window",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
//# sourceMappingURL=index.js.map