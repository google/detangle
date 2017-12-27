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
 * @fileoverview Tests for the detangle-options-text-input element
 */
goog.setTestOnly();

goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');


var mockControl;


/**
 * Waits for async events to settle down, then flush the dom and resolves the
 * promise.
 *
 * @public
 * @return {!Promise}
 */
function wait() {
  return new Promise(function(resolve) {
    window.setTimeout(function() {
      Polymer.dom.flush();
      resolve();
    }, 750);
  });
}


function setUp() {
  function fail_() {
    fail();
  }

  mockControl = new goog.testing.MockControl();
  goog.global.chrome = {
    storage: {
      local: {get: fail_},
      managed: {get: fail_},
      sync: {get: fail_},
      onChanged: {addListener: function() {}},
    }
  };
}


function tearDown() {
  mockControl.$tearDown();
}


/**
 * Stand in for the chrome.storage.*.get callback
 * @param {?} value Value to be associated with the key
 * @return {function(string, !Function)}
 */
function storageGetCallback(value) {
  return function(key, cb) {
    var cbArg = {};
    if (value !== undefined) {
      cbArg = value;
    }
    cb(cbArg);
  };
}


/**
 * Performs a simple test of creating the element, without any later changes to
 * storage.
 *
 * @param {{lastUpdated: number, lastUpdatedDisplay: string,
 * controlsShown: boolean, syncUrl: string, managedUrl: string, url: string}} scenario Test scenario
 *     options
 * @return {!Promise}
 */
function simpleTest(scenario) {
  mockControl
      .createMethodMock(chrome.storage.onChanged, 'addListener')(
          goog.testing.mockmatchers.isFunction)(
          goog.testing.mockmatchers.isFunction)
      .$does(function() {});


  goog.global.chrome.storage.sync.get = storageGetCallback({
    managed_policy_url: scenario.syncUrl,
  });

  goog.global.chrome.storage.managed.get = storageGetCallback({
    managed_policy_url: scenario.managedUrl,
  });

  goog.global.chrome.storage.local.get = storageGetCallback({
    managed_policy_url: scenario.url,
    managed_policy_last_updated: scenario.lastUpdated,
  });

  mockControl.$replayAll();

  var elem = document.createElement('detangle-options-managed-policy-controls');

  return wait().then(function() {
    mockControl.$verifyAll();

    assertEquals(
        'Last updated timestring', scenario.lastUpdatedDisplay,
        elem.lastUpdatedDisplay);
    assertEquals(
        'Resolved storage value', scenario.lastUpdated, elem.lastUpdated);
    assertEquals('Visible', elem.showControls, scenario.controlsShown);
    assertEquals(
        'Refresh disabled', elem.refreshDisabled, scenario.refreshDisabled);
  });
}


function testStorageFetchedAndValueComputedCorrectlyManaged() {
  return simpleTest({
    managedUrl: 'bleb',
    syncUrl: '',
    lastUpdated: 1480643677648,
    lastUpdatedDisplay: '5:54:37 PM, 12/1/2016',
    controlsShown: true,
    refreshDisabled: false,
  });
}

function testStorageFetchedAndValueComputedCorrectlySync() {
  return simpleTest({
    managedUrl: '',
    syncUrl: 'bleb',
    lastUpdated: 1480643677648,
    lastUpdatedDisplay: '5:54:37 PM, 12/1/2016',
    controlsShown: true,
    refreshDisabled: false,
  });
}

function testNotSetHidesControls() {
  return simpleTest({
    managedUrl: '',
    syncUrl: '',
    lastUpdated: 0,
    lastUpdatedDisplay: 'never',
    controlsShown: false,
    refreshDisabled: true,
  });
}
