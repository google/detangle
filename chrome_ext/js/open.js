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

/**
 * @fileoverview Page that opens URLs sent from other browsers.
 */

goog.module('detangle.open');

const Profiles = goog.require('detangle.Profiles');
const StorageKeys = goog.require('detangle.StorageKeys');
const getLocalStorage = goog.require('detangle.getLocalStorage');


/**
 * Entry point for open.html behavior.
 */
function ready() {
  const /** !URLSearchParams */ searchParams =
      new URLSearchParams(window.location.search.slice(1));
  const /** boolean */ shouldRaise =
      (searchParams.get('raise') || 'true') == true;
  const /** ?string */ targetUrl = searchParams.get('url');

  if (!targetUrl) {
    showError('No url parameter provided');
    return;
  }

  if (!/^(https?|ftp):\/\//.test(targetUrl)) {
    showError('Invalid URL provided');
    return;
  }

  let /** !Promise */ promise = checkThisProfile();

  if (shouldRaise) {
    promise = promise.then(getCurrentWindow).then(raiseWindow);
  }

  promise.then(() => redirect(targetUrl), e => showError(e.message));
}


/**
 * Redirects the page to targetUrl.
 *
 * @param {string} targetUrl
 */
function redirect(targetUrl) {
  window.location.replace(targetUrl);
}


/**
 * Checks that the current profile isn't CORPORATE.
 *
 * The CORPORATE profile won't open URLs from other browsers.
 *
 * @return {!Promise}
 */
function checkThisProfile() {
  return getLocalStorage().getValue(StorageKeys.THIS_PROFILE).then(profile => {
        if (profile == Profiles.CORPORATE) {
          throw new Error('Attempt to open URL in Corporate profile.');
        }
      });
}


/**
 * Gets the current chrome.windows.Window.
 * @return {!Promise<!ChromeWindow>}
 */
function getCurrentWindow() {
  return new Promise(resolve => {
    chrome.windows.getCurrent(resolve);
  });
}


/**
 * Raises the supplied chrome.windows.Window.
 *
 * @param {!ChromeWindow} win The window that we should raise.
 * @return {!Promise<!ChromeWindow>}
 */
function raiseWindow(win) {
  return new Promise(resolve => {
    chrome.windows.update(
        win.id, {drawAttention: true, focused: true}, resolve);
  });
}


/**
 * Shows an error message.
 *
 * @param {string} message
 */
function showError(message) {
  const elem = document.createElement('h2');
  elem.innerText = 'Error opening URL: ' + message;
}


document.addEventListener('DOMContentLoaded', ready);
