"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("jquery");
(async () => {
    const promptContext = await moduleManager.getComponentAsync("prompt.prompt-context");
    const inputOptions = promptContext.promptOptions.data;
    const $input = $("#input");
    $("#title").text(inputOptions.title);
    $("#message").text(inputOptions.message);
    if (inputOptions.password) {
        $input.attr("type", "password");
    }
    $input.keyup(($event) => {
        const keyboardEvent = $event.originalEvent;
        if (keyboardEvent.code === "Enter") {
            $("#btn-ok").click();
        }
    });
    $("#btn-ok").click(() => {
        promptContext.finish($("#input").val());
    });
    $("#btn-cancel").click(() => promptContext.finish(null));
    $(document).ready(() => {
        $input.focus();
    });
})();
//# sourceMappingURL=input.js.map