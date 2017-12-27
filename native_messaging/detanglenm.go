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

// Tool detanglenm implements a nativeMessaging helper for the Detangle extension.
package main

import (
	"io/ioutil"
	"log"
	"os"
	"runtime"

	"github.com/google/detangle/native_messaging/detangle"
	"github.com/google/detangle/native_messaging/nativemessaging"
)

func main() {
	if runtime.GOOS == `windows` {
		log.SetOutput(ioutil.Discard) // Windows stderr = stdout and will break nativeMessaging protocol.
	} else {
		log.SetOutput(os.Stderr)
	}

	mh, err := detangle.NewMessageHandler()
	if err != nil {
		log.Fatal(err.Error())
	}

	for {
		var message detangle.NativeMessage
		if err := nativemessaging.Read(&message); err != nil {
			log.Fatalf("Unable to read nativeMessage: %v", err)
		}
		response := mh.ProcessNativeMessage(message)
		nativemessaging.Write(response)
	}
}
