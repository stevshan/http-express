//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "http-express.cert" {
    export interface ICertificate {
        type: "pfx" | "pem";
    }

    export interface IPfxCertificate extends ICertificate {
        type: "pfx";
        password?: string;
        pfx: string | Buffer;
    }

    export interface IPemCertificate extends ICertificate {
        type: "pem";
        password?: string;
        key?: string | Buffer;
        cert: string | Buffer;
    }

    export interface ICertificateInfo {
        subjectName: string;
        issuerName: string;
        serialNumber: string;
        hasPrivateKey?: boolean;
        validStart: Date;
        validExpiry: Date;
        thumbprint: string;
    }

    export type StoreName = "My";

    export interface IPkiCertificateService {
        getCertificateInfosAsync(storeName: StoreName): Promise<Array<ICertificateInfo>>;
        getCertificateAsync(certInfo: ICertificateInfo): Promise<IPfxCertificate>;
    }

    export interface ICertificateLoader {
        loadAsync(cert: ICertificate): Promise<ICertificate>;
        loadPfxAsync(path: string, password?: string): Promise<IPfxCertificate>;
        loadPemAsync(certPath: string, keyPath?: string, keyPassword?: string): Promise<IPemCertificate>;
    }
}

declare module "http-express.module-manager" {
    import { IPkiCertificateService, ICertificateLoader } from "http-express.cert";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "cert.pki-service"): Promise<IPkiCertificateService>;
        getComponentAsync(componentIdentity: "cert.cert-loader"): Promise<ICertificateLoader>;
    }
}
