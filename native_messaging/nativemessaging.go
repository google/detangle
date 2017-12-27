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

// Package nativemessaging implements Chrome's nativeMessaging protocol.
package nativemessaging

// Chrome's nativeMessaging protocol is a way for extensions to communicate with
// a program running natively on the host operating system.
//
// Chrome will launch the nativeMessaging program, and send and receive messages
// via stdin and stdout.
//
// Messages are a native byte order (ugh!) 32-bit unsigned integer length,
// followed by a JSON message.

import (
	"encoding/json"
	"errors"
	"io"
	"os"
)

// Read reads a single nativeMessage from stdin and decode the JSON into the provided interface.
func Read(message interface{}) error {
	return read(os.Stdin, message)
}

func read(stdin io.Reader, message interface{}) error {
	sizeBuf := make([]byte, 4)
	_, err := io.ReadFull(stdin, sizeBuf)
	if err != nil {
		return err
	}
	messageLength := byteOrder.Uint32(sizeBuf)
	if messageLength >= (1 << 31) {
		return errors.New("message from Chrome was >= 2 GB")
	}

	messageBuf := make([]byte, int(messageLength))
	_, err = io.ReadFull(stdin, messageBuf)
	if err != nil {
		return err
	}

	return json.Unmarshal(messageBuf, message)
}

// Write serializes message into JSON then writes it to stdout via the nativeMessaging protocol.
func Write(message interface{}) error {
	return write(os.Stdout, message)
}

func write(stdout io.Writer, message interface{}) error {
	messageBuf, err := json.Marshal(message)
	if err != nil {
		return err
	}

	if len(messageBuf) > (1 << 20) {
		return errors.New("cannot send message over 1 MB")
	}

	b := make([]byte, len(messageBuf)+4)
	byteOrder.PutUint32(b[:4], uint32(len(messageBuf)))
	copy(b[4:], messageBuf)
	_, err = stdout.Write(b)
	return err
}
