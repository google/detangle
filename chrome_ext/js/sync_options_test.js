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

// TODO: High-level file comment.

/**
 * @fileoverview Tests for sync_options.js
 */

'use strict';

goog.setTestOnly();

goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.aclentries');
goog.require('detangle.doSyncOptions');
goog.require('detangle.encodeSyncOptions');
goog.require('detangle.test');
goog.require('goog.testing.jsunit');


let /** !Element */ messageDiv;
let /** string */ badParams =
    '?default_sandbox=true&risky_whitelist=invalid_json';
let /** string */ okParams =
    '?default_sandbox=dHJ1ZQ%3D%3D&sandbox=invalid_json' +
    '&risky_whitelist=WyIqOi8vKi5zeWQvKiJd';
let /** string */ unknownParams = 'nokey4u=foo';
let /** string */ url = 'chrome-extension://xxxxxx/sync_options.html';


/**
 * Create a DOM for testing that can be reset between tests.
 */
function createDom() {
  messageDiv = document.createElement('div');
  messageDiv.setAttribute('id', 'message_area');
  document.body.appendChild(messageDiv);
}


/**
 * Wipe the elements of the dom.
 */
function wipeDom() {
  if (messageDiv && messageDiv.parentNode) {
    messageDiv.parentNode.removeChild(messageDiv);
  }
}


/**
 * @public
 */
function setUp() {
  detangle.test.setupChromeTests();
  createDom();

  // Prevents tests from timing out.
  window.confirm = () => {
    throw new Error('Unexpected window.confirm() call');
  };
}


/**
 * @public
 */
function tearDown() {
  wipeDom();
}


/**
 * Sync options to the corporate profile will raise an error.
 *
 * @return {!Promise}
 * @public
 */
function testOptionSyncNotAllowedForCorporate() {
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.CORPORATE;

  function testMessage() {
    assertContains(
        'Attempt to sync options to Corporate profile', messageDiv.innerHTML);
    assertContains('display: inline', messageDiv.getAttribute('style'));
  }

  function testSettingsUnchanged() {}

  return detangle.doSyncOptions(url + okParams)
      .then(testMessage)
      .then(testSettingsUnchanged);
}


/**
 * Sync handler requires a valid url string.
 *
 * @return {!Promise}
 * @public
 */
function testOptionSyncRejectsInvalidUrl() {
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.REGULAR;

  function testMessage() {
    assertContains('Bad option data for', messageDiv.innerHTML);
    assertContains('display: inline', messageDiv.getAttribute('style'));
  }

  function testSettingsUnchanged() {}

  return detangle.doSyncOptions(url + badParams)
      .then(testMessage)
      .then(testSettingsUnchanged);
}


/**
 * Trigger a firstrun error
 *
 * @return {!Promise}
 * @public
 */
function testOptionSyncRejectsWrongProfile() {
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.ISOLATED;
  window.confirm = () => false;

  function testMessage() {
    assertContains(
        'Error: Attempt to reconfigure browser', messageDiv.innerHTML);
    assertContains('display: inline', messageDiv.getAttribute('style'));
  }

  function testSettingsUnchanged() {}

  return detangle.doSyncOptions(url + okParams + '&profile=NONPRIV')
      .then(testMessage)
      .then(testSettingsUnchanged);
}


/**
 * The OptionSyncHandler should initialize OK if it is:
 * - Running in the Regular browser
 * - Given a valid URL
 * - The search keys are all in detangle.Sync{Acls,Toggles}
 *
 * @return {!Promise}
 * @public
 */
function testOptionSyncInitialisesWithValidUrl() {
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.REGULAR;
  detangle.test.fakeLocalStorage[detangle.StorageKeys.REGULAR_WHITELIST] = [];
  detangle.test.fakeLocalStorage[detangle.StorageKeys.RISKY_WHITELIST] = [];
  detangle.test.fakeLocalStorage[detangle.StorageKeys.DEFAULT_SANDBOX] = false;
  detangle.test.fakeLocalStorage[detangle.StorageKeys.INCOGNITO_SANDBOX] = true;

  function testMessage() {
    assertEquals('Options updated', messageDiv.innerHTML);
    assertContains('display: inline', messageDiv.getAttribute('style'));
  }

  function testSettings() {
    assertTrue(
        detangle.test.fakeLocalStorage[detangle.StorageKeys.DEFAULT_SANDBOX]);
    assertSameElements(
        ['*://npuser/*'],
        detangle.test.fakeLocalStorage[detangle.StorageKeys.REGULAR_WHITELIST]
            .map(x => x.value));
  }

  let options = {};
  options[detangle.StorageKeys.DEFAULT_SANDBOX] = true;
  options[detangle.StorageKeys.REGULAR_WHITELIST] =
      [new detangle.aclentries.MatchPatternEntry('*://npuser/*')];

  return detangle
      .doSyncOptions(
          url +
          detangle.encodeSyncOptions([options], detangle.Profiles.REGULAR))
      .then(testMessage)
      .then(testSettings);
}
