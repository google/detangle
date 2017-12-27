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
 * @fileoverview Tests for firstrun.js
 */

'use strict';

goog.setTestOnly();


goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.doFirstRun');
goog.require('detangle.firstRun');
goog.require('detangle.test');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');


let /** !Object<string, ?> */ storageBacking;

var mockControl_;


/**
 * @public
 */
function setUp() {
  detangle.test.setupChromeTests();
  mockControl_ = new goog.testing.MockControl();
  window.confirm = (_) => false;
}


/**
 * @public
 */
function tearDown() {
  mockControl_.$tearDown();
}


/**
 * Test that we can configure as ISOLATED profile successfully.
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunIsolated() {
  return detangle
      .firstRun('chrome-extension://blah/firstrun.html?profile=SANDBOX')
      .then(function(profile) {
        assertEquals(detangle.Profiles.ISOLATED, profile);
        assertEquals(
            'SANDBOX',
            detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE]);
      });
}


/**
 * Test that we can configure as REGULAR profile successfully.
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunRegular() {
  return detangle
      .firstRun('chrome-extension://blah/firstrun.html?profile=NONPRIV')
      .then(function(profile) {
        assertEquals(detangle.Profiles.REGULAR, profile);
        assertEquals(
            'NONPRIV',
            detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE]);
      });
}


/**
 * Test that we don't allow arbitrary profile names
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunInvalid() {
  return detangle
      .firstRun('chrome-extension://blah/firstrun.html?profile=INVALID')
      .then(fail, function(error) {
        assertNotContains(
            detangle.StorageKeys.THIS_PROFILE, detangle.test.fakeLocalStorage);
      });
}


/**
 * Test that passing no profile does nothing
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunNoProfile() {
  return detangle.firstRun('chrome-extension://blah/firstrun.html')
      .then(fail, function(error) {
        assertNotContains(
            detangle.StorageKeys.THIS_PROFILE, detangle.test.fakeLocalStorage);
      });
}


/**
 * Test that we don't allow child profiles to be configured as PRIV.
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunCorporate() {
  return detangle.firstRun('chrome-extension://blah/firstrun.html?profile=PRIV')
      .then(fail, function(error) {
        assertNotContains(
            detangle.StorageKeys.THIS_PROFILE, detangle.test.fakeLocalStorage);
      });
}


/**
 * Tests that we don't allow reconfiguration of child profiles if user clicks
 * cancel.
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunReconfigureCancel() {
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.CORPORATE;

  mockControl_
      .createMethodMock(window, 'confirm')(goog.testing.mockmatchers.isString)
      .$returns(false);
  mockControl_.$replayAll();

  return detangle
      .firstRun(
          'chrome-extension://blah/firstrun.html?profile=' +
          detangle.Profiles.REGULAR)
      .then(fail, function(error) {
        assertEquals(
            detangle.Profiles.CORPORATE,
            detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE]);
        mockControl_.$verifyAll();
      });
}


/**
 * Tests that we reconfigure child profiles if user clicks ok.
 *
 * @return {!Promise}
 * @public
 */
function testFirstrunReconfigureOk() {
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.CORPORATE;

  mockControl_
      .createMethodMock(window, 'confirm')(goog.testing.mockmatchers.isString)
      .$returns(true);
  mockControl_.$replayAll();

  return detangle
      .firstRun(
          'chrome-extension://blah/firstrun.html?profile=' +
          detangle.Profiles.REGULAR)
      .then(function(profile) {
        assertEquals(detangle.Profiles.REGULAR, profile);
        assertEquals(
            detangle.Profiles.REGULAR,
            detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE]);
        mockControl_.$verifyAll();
      });
}


/**
 * Test that if storage fails, we notice
 *
 * @return {!Promise}
 * @suppress {checkTypes} We're breaking chrome.storage.local
 * @public
 */
function testStorageSetFail() {
  chrome.storage.local = new detangle.test.ObjectBackedStorageArea(
      detangle.test.fakeLocalStorage, 'local', true);

  return detangle
      .firstRun(
          'chrome-extension://blah/firstrun.html?profile=' +
          detangle.Profiles.REGULAR)
      .then(fail, function(error) {
        assertNotContains(
            detangle.StorageKeys.THIS_PROFILE, detangle.test.fakeLocalStorage);
        assertEquals('Attempt to write to read-only storage', error.message);
      });
}


/**
 * Tests that when we call doFirstRun on an unconfigured child profile that a
 * new tab is created to <extension>/firstrun.html.
 *
 * @public
 * @return {!Promise}
 */
function testDoFirstRunUnconfigured() {
  var mockGetURL = mockControl_.createMethodMock(chrome.runtime, 'getURL');
  mockGetURL('firstrun.html').$returns('./firstrun.html');

  var mockTabCreate = mockControl_.createMethodMock(chrome.tabs, 'create');
  mockTabCreate(new goog.testing.mockmatchers.ArgumentMatcher(function(props) {
    return props.active && props.url.endsWith('firstrun.html');
  }));
  mockControl_.$replayAll();

  return detangle
      .doFirstRun(
          'chrome-extension://blah/firstrun.html?profile=' +
          detangle.Profiles.REGULAR)
      .then(function() {
        mockControl_.$verifyAll();
      });
}


/**
 * Tests that when we call doFirstRun on a configured child profile that a new
 * tab isn't created.
 *
 * @public
 * @return {!Promise}
 */
function testDoFirstRunAlreadyConfigured() {
  mockControl_.createMethodMock(chrome.runtime, 'getURL');
  mockControl_.createMethodMock(chrome.tabs, 'create');
  mockControl_.$replayAll();

  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.REGULAR;
  return detangle
      .doFirstRun(
          'chrome-extension://blah/firstrun.html?profile=' +
          detangle.Profiles.REGULAR)
      .then(function() {
        mockControl_.$verifyAll();
      });
}


/**
 * Tests that when we call doFirstRun on a configured child profile telling it
 * that it's a different type of child profile that it throws an error.
 *
 * @public
 * @return {!Promise}
 */
function testDoFirstRunAlreadyConfiguredDifferentProfile() {
  mockControl_.createMethodMock(chrome.runtime, 'getURL');
  mockControl_.createMethodMock(chrome.tabs, 'create');
  mockControl_.$replayAll();

  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.ISOLATED;
  return detangle
      .doFirstRun(
          'chrome-extension://blah/firstrun.html?profile=' +
          detangle.Profiles.REGULAR)
      .then(fail, function(unused_error) {
        mockControl_.$verifyAll();
      });
}
