//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as ng from "angular";

import { electron } from "../../../utilities/electron-adapter";

interface ITitleBarScope extends ng.IScope {
    minimizeWindow: () => void;
    maximizeOrRestoreWindow: () => void;
    closeWindow: () => void;
    isWindowMaximized: () => boolean;
}

function maximizeOrRestoreWindow() {
    const currentWindow = electron.remote.getCurrentWindow();

    if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
    } else {
        currentWindow.maximize();
    }
}

ng.module("http-express")
    .controller("TitleBarController",
        ["$scope",
            ($scope: ITitleBarScope) => {
                $scope.maximizeOrRestoreWindow = maximizeOrRestoreWindow;

                $scope.minimizeWindow = () => electron.remote.getCurrentWindow().minimize();
                $scope.closeWindow = () => electron.remote.getCurrentWindow().close();
                $scope.isWindowMaximized = () => electron.remote.getCurrentWindow().isMaximized();
            }]);
