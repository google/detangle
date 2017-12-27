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

// Package detangle implements the detangle part of the nativeMessaging helper.
package detangle

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/url"
	"os"
	"os/exec"
	"strings"
)

// NativeMessage contains the data received from Detangle over the nativeMessaging protocol.
type NativeMessage struct {
	Command string `json:"command"`
	Profile string `json:"profile"`

	// Fields for command=launch
	URL         string `json:"url"`
	Incognito   bool   `json:"incognito"`
	RaiseWindow bool   `json:"raise"`

	// Fields for command=sync
	SyncData string `json:"sync_data"`
}

// NativeMessageResponse is a response that detanglenm sends back to the extension.
type NativeMessageResponse struct {
	Command string `json:"command,omitempty"`
	Error   string `json:"error,omitempty"`
	Status  string `json:"status,omitempty"`
}

// MessageHandler handles native messages, executing the requested browser commands, etc.
// Always use NewMessageHandler() - this is unusable without initialization.
type MessageHandler struct {
	extensionURL    *url.URL            // The base URL of the calling extension.
	browserCommands map[string][]string // Mapping of browser IDs to launch commands.
}

// ConfigFile is a deserialized detangle config file.
type ConfigFile struct {
	Browsers map[string][]string
}

// NewMessageHandler creates a MessageHandler initialized with platform-specific settings.
func NewMessageHandler() (*MessageHandler, error) {
	mh := &MessageHandler{}

	u, err := findExtensionURL(os.Args)
	if err != nil {
		return nil, err
	}
	mh.extensionURL, err = url.Parse(u)
	if err != nil {
		return nil, err
	}

	mh.browserCommands = make(map[string][]string, 4)
	mh.platformInit()

	systemConfig := &ConfigFile{}
	userConfig := &ConfigFile{}
	if err := systemConfig.ReadFile(systemConfigFile); err != nil && !os.IsNotExist(err) {
		log.Printf("System configuration not applied: %v", err)
	}
	if err := userConfig.ReadFile(userConfigFile); err != nil && !os.IsNotExist(err) {
		log.Printf("User configuration not applied: %v", err)
	}

	for browser, args := range systemConfig.Browsers {
		mh.browserCommands[browser] = args
	}

	for browser, args := range userConfig.Browsers {
		mh.browserCommands[browser] = args
	}

	// Deprecated browser names
	mh.browserCommands[`NONPRIV`] = mh.browserCommands[`REGULAR`]
	mh.browserCommands[`SANDBOX`] = mh.browserCommands[`ISOLATED`]

	return mh, nil
}

// ProcessNativeMessage processes a nativeMessage from the detangle extension and returns a JSONable response.
func (mh *MessageHandler) ProcessNativeMessage(message NativeMessage) *NativeMessageResponse {
	var err error

	switch message.Command {
	case "launch":
		err = mh.launch(message)
	case "sync":
		err = mh.sync(message)
	case "noop":
		// No operation
	default:
		err = errors.New("invalid command")
	}

	if err != nil {
		log.Print(err)
		return &NativeMessageResponse{
			Command: message.Command,
			Error:   err.Error(),
		}
	}

	return &NativeMessageResponse{
		Command: message.Command,
		Status:  "success",
	}
}

func (mh *MessageHandler) launch(message NativeMessage) error {
	browserCommand, ok := mh.browserCommands[message.Profile]
	if !ok {
		return fmt.Errorf("invalid browser profile: %s", message.Profile)
	}

	if message.URL != "" && !isSafeURL(message.URL) {
		return fmt.Errorf("invalid URL: %s", message.URL)
	}

	// Copy browserCommand, rather than modifying the global one.
	commandLine := make([]string, len(browserCommand))
	copy(commandLine, browserCommand)

	if message.Incognito {
		commandLine = append(commandLine, "--incognito")
	}

	if message.URL != "" {
		var url string
		if message.Incognito {
			// The extension isn't available in incognito mode, so can't encode the URL
			url = message.URL
		} else {
			// Pass the URL through the extension's open.html so it can raise the window.
			url = mh.encodeLaunchURL(message.URL, message.RaiseWindow)
		}
		commandLine = append(commandLine, url)
	}

	return runBrowser(commandLine)
}

func (mh *MessageHandler) sync(message NativeMessage) error {
	browserCommand, ok := mh.browserCommands[message.Profile]
	if !ok {
		return fmt.Errorf("invalid browser profile: %s", message.Profile)
	}

	// Copy browserCommand, rather than modifying the global one.
	commandLine := make([]string, len(browserCommand))
	copy(commandLine, browserCommand)

	syncData, err := sanitizeSyncData(message.SyncData)
	if err != nil {
		return err
	}

	commandLine = append(commandLine, "--new-window", mh.encodeSyncURL(syncData))
	return runBrowser(commandLine)
}

// encodeLaunchURL creates a URL that redirects through the extension, allowing the extension to optionally raise the window.
func (mh *MessageHandler) encodeLaunchURL(launchURL string, raiseWindow bool) string {
	if !raiseWindow {
		return launchURL // No need to redirect through extension.
	}

	u := *mh.extensionURL // Copy extensionURL
	u.Path = "open.html"

	q := url.Values{}
	q.Set("url", launchURL)
	q.Set("raise", "true")
	u.RawQuery = q.Encode()

	return u.String()
}

// encodeSyncURL creates a URL to sync configuration data to child browsers.
func (mh *MessageHandler) encodeSyncURL(syncData string) string {
	u := *mh.extensionURL // Copy extensionURL
	u.Path = "sync_options.html"

	// TODO(michaelsamuel): This is terrible!  Why did we pass a query string as sync data?
	u.RawQuery = syncData

	return u.String()
}

// findExtensionURL finds the URL of the chrome extension that launched the nativeMessaging process.
func findExtensionURL(argv []string) (string, error) {
	for _, arg := range argv {
		if strings.HasPrefix(arg, "chrome-extension://") {
			return arg, nil
		}
	}
	return "", errors.New("unable to find chrome-extension:// URL in argv")
}

// isSafeURL determines whether it's safe to launch the provided URL (with the launch command).
func isSafeURL(u string) bool {
	return strings.HasPrefix(u, "https://") ||
		strings.HasPrefix(u, "http://") ||
		strings.HasPrefix(u, "ftp://")
}

// runBrowser executes Chrome, discarding stdio and detaching from the terminal.
func runBrowser(commandLine []string) error {
	cmd := exec.Command(commandLine[0], commandLine[1:]...)
	cmd.SysProcAttr = &runBrowserSysProcAttr
	cmd.Stdin = nil
	cmd.Stdout = nil
	cmd.Stderr = nil

	if err := cmd.Start(); err != nil {
		return err
	}

	go cmd.Wait() // Reap the zombies.
	return nil
}

// sanitzeSyncData ensures that sync data is a valid query string.
// (Sync data should never have been a query string)
func sanitizeSyncData(syncData string) (string, error) {
	if syncData == "" {
		return "", nil
	}

	if syncData[0] != '?' {
		return "", errors.New("sync data should start with a '?' character")
	}

	q, err := url.ParseQuery(syncData[1:])
	if err != nil {
		return "", err
	}

	return q.Encode(), nil
}

// ReadFile reads and decodes a detangle config file.
func (config *ConfigFile) ReadFile(path string) error {
	fileData, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}

	if err = json.Unmarshal(fileData, config); err != nil {
		return err
	}

	// Expand environment variables in command-line arguments in-place.
	for _, args := range config.Browsers {
		for i, arg := range args {
			args[i] = os.ExpandEnv(arg)
		}
	}

	return nil
}
