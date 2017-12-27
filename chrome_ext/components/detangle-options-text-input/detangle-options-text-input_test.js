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
var mockAddListener;
var mockStorageSyncGet;
var mockStorageManagedGet;


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
    }, 250);
  });
}


function setUp() {
  function fail_() { fail(); }

  mockControl = new goog.testing.MockControl();
  goog.global.chrome = {
    storage: {
      managed: {get: fail_},
      onChanged: {addListener: fail_},
      sync: {get: fail_, set: fail_}
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
      cbArg[key] = value;
    }
    cb(cbArg);
  };
}


/**
 * Performs a simple test of creating the element, without any later changes to
 * storage.
 *
 * @param {{preferManaged: boolean, label: string,
 *     managedValue: (string|undefined), userValue: (string|undefined),
 *     assertValue: string, assertDisabled: boolean}} scenario Test scenario
 *     options
 * @return {!Promise}
 */
function simpleTest(scenario) {
  mockControl
      .createMethodMock(chrome.storage.onChanged, 'addListener')(
          goog.testing.mockmatchers.isFunction)
      .$does(function() {});
  mockControl
      .createMethodMock(chrome.storage.sync, 'get')(
          'test', goog.testing.mockmatchers.isFunction)
      .$does(storageGetCallback(scenario.userValue));
  mockControl
      .createMethodMock(chrome.storage.managed, 'get')(
          'test', goog.testing.mockmatchers.isFunction)
      .$does(storageGetCallback(scenario.managedValue));
  mockControl.createMethodMock(chrome.storage.sync, 'set');
  mockControl.$replayAll();

  // Invented test data
  storageKey = /** @type {detangle.StorageKey} */ ('test');
  label = 'Test Input';

  var elem = document.createElement('detangle-options-text-input');
  elem.storageKey = storageKey;
  elem.preferManaged = scenario.preferManaged;

  return wait().then(function() {
    mockControl.$verifyAll();

    assertEquals('Value', scenario.assertValue, elem.displayValue);
    assertEquals('Disabled', scenario.assertDisabled, elem.disabled);
  });
}


function testPreferManagedManagedSetUserSet() {
  return simpleTest({
    label: 'Test Input',
    preferManaged: true,
    managedValue: 'm',
    userValue: 'user value',
    assertValue: 'm',
    assertDisabled: true
  });
}


function testPreferUserManagedSetUserSet() {
  return simpleTest({
    label: 'Test Input',
    preferManaged: false,
    managedValue: 'm',
    userValue: 'user value',
    assertValue: 'user value',
    assertDisabled: false
  });
}


function testPreferUserManagedUnsetUserSet() {
  return simpleTest({
    label: 'Test Input',
    preferManaged: false,
    managedValue: '',
    userValue: 'user value',
    assertValue: 'user value',
    assertDisabled: false
  });
}


function testPreferManagedManagedUnsetUserSet() {
  return simpleTest({
    label: 'Test Input',
    preferManaged: true,
    managedValue: '',
    userValue: 'user value',
    assertValue: 'user value',
    assertDisabled: false
  });
}
