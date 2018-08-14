"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils = require("../../utilities/appUtils");
const common_1 = require("./common");
const handle_json_1 = require("./request-handlers/handle-json");
const handle_json_2 = require("./response-handlers/handle-json");
const handle_redirection_1 = require("./response-handlers/handle-redirection");
const handle_auth_aad_1 = require("./response-handlers/handle-auth-aad");
const handle_auth_cert_1 = require("./response-handlers/handle-auth-cert");
const node_http_client_builder_1 = require("./node.http-client-builder");
const electron_http_client_builder_1 = require("./electron.http-client-builder");
function buildNodeHttpClientAsync(log, certLoader, protocol, serverCertValidator) {
    return Promise.resolve(new node_http_client_builder_1.default(log, certLoader, serverCertValidator))
        // Request handlers
        .then(builder => builder.handleRequestAsync(handle_json_1.default))
        // Response handlers
        .then(builder => builder.handleResponseAsync(handle_redirection_1.default))
        .then(builder => builder.handleResponseAsync(handle_json_2.default))
        .then(builder => builder.buildAsync(protocol));
}
function buildElectronHttpClientAsync(log, protocol, serverCertValidator) {
    return Promise.resolve(new electron_http_client_builder_1.default(log, serverCertValidator))
        // Request handlers
        .then(builder => builder.handleRequestAsync(handle_json_1.default))
        // Response handlers
        .then(builder => builder.handleResponseAsync(handle_redirection_1.default))
        .then(builder => builder.handleResponseAsync(handle_json_2.default))
        .then(builder => builder.buildAsync(protocol));
}
exports.getModuleMetadata = (components) => {
    components
        .register({
        name: "http.http-client",
        version: appUtils.getAppVersion(),
        descriptor: (log, certLoader, serverCertValidator) => buildNodeHttpClientAsync(log, certLoader, common_1.HttpProtocols.any, serverCertValidator),
        deps: ["logging", "cert.cert-loader"]
    })
        .register({
        name: "http.https-client",
        version: appUtils.getAppVersion(),
        descriptor: (log, certLoader, serverCertValidator) => buildNodeHttpClientAsync(log, certLoader, common_1.HttpProtocols.https, serverCertValidator),
        deps: ["logging", "cert.cert-loader"]
    })
        .register({
        name: "http.node-http-client",
        version: appUtils.getAppVersion(),
        descriptor: (log, certLoader, serverCertValidator) => buildNodeHttpClientAsync(log, certLoader, common_1.HttpProtocols.any, serverCertValidator),
        deps: ["logging", "cert.cert-loader"]
    })
        .register({
        name: "http.node-https-client",
        version: appUtils.getAppVersion(),
        descriptor: async (log, certLoader, serverCertValidator) => buildNodeHttpClientAsync(log, certLoader, common_1.HttpProtocols.https, serverCertValidator),
        deps: ["logging", "cert.cert-loader"]
    })
        .register({
        name: "http.electron-http-client",
        version: appUtils.getAppVersion(),
        descriptor: (log, serverCertValidator) => buildElectronHttpClientAsync(log, common_1.HttpProtocols.any, serverCertValidator),
        deps: ["logging"]
    })
        .register({
        name: "http.electron-https-client",
        version: appUtils.getAppVersion(),
        descriptor: (log, serverCertValidator) => buildElectronHttpClientAsync(log, common_1.HttpProtocols.https, serverCertValidator),
        deps: ["logging"]
    })
        .register({
        name: "http.node-client-builder",
        version: appUtils.getAppVersion(),
        descriptor: async (log, certLoader, serverCertValidator) => new node_http_client_builder_1.default(log, certLoader, serverCertValidator),
        deps: ["logging", "cert.cert-loader"]
    })
        .register({
        name: "http.electron-client-builder",
        version: appUtils.getAppVersion(),
        descriptor: async (log, serverCertValidator) => new electron_http_client_builder_1.default(log, serverCertValidator),
        deps: ["logging"]
    })
        // Request Handlers
        .register({
        name: "http.request-handlers.handle-json",
        version: appUtils.getAppVersion(),
        descriptor: async () => handle_json_1.default
    })
        // Response Handlers
        .register({
        name: "http.response-handlers.handle-redirection",
        version: appUtils.getAppVersion(),
        descriptor: async () => handle_redirection_1.default
    })
        .register({
        name: "http.response-handlers.handle-json",
        version: appUtils.getAppVersion(),
        descriptor: async () => handle_json_2.default
    })
        .register({
        name: "http.response-handlers.handle-auth-aad",
        version: appUtils.getAppVersion(),
        descriptor: (handlingHost, aadMetadata) => handle_auth_aad_1.default.bind(null, handlingHost, aadMetadata)
    })
        .register({
        name: "http.response-handlers.handle-auth-cert",
        version: appUtils.getAppVersion(),
        descriptor: (certLoader, pkiCertSvc, selectClientCertAsyncHandler) => handle_auth_cert_1.default.bind(null, certLoader, pkiCertSvc, selectClientCertAsyncHandler),
        deps: ["cert.cert-loader", "cert.pki-service"]
    });
    return {
        name: "http",
        version: appUtils.getAppVersion()
    };
};
//# sourceMappingURL=index.js.map