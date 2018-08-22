//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as fs from "fs";
import * as path from "path";
import * as appUtils from "../../utilities/appUtils";
import { env } from "../../utilities/env";

if (fs.existsSync(appUtils.local(`main-${env.platform}.css`))) {
    const linkEf = document.createElement("link");

    linkEf.rel = "stylesheet";
    linkEf.type = "text/css";
    linkEf.href = path.relative(__dirname, appUtils.local(`main-${env.platform}.css`));

    document.getElementsByTagName("head")[0].appendChild(linkEf);
}

import "./controllers/TitleBarController";
import "./controllers/HttpClientController";

import "bootstrap";
