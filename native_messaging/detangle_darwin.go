// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package detangle

import (
	"os"
	"syscall"
)

var (
	runBrowserSysProcAttr = syscall.SysProcAttr{Setsid: true}

	systemConfigFile = "/Library/Application Support/Detangle/detangleconfig.json"
	userConfigFile   = os.ExpandEnv("${HOME}/Library/Application Support/Detangle/detangleconfig.json")
)

func (mh *MessageHandler) platformInit() {
	mh.browserCommands["REGULAR"] = []string{
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"--profile-directory=DetangleRegular",
		"--no-default-browser-check",
	}
	mh.browserCommands["ISOLATED"] = []string{
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"--profile-directory=DetangleIsolated",
		"--no-default-browser-check",
	}
}
