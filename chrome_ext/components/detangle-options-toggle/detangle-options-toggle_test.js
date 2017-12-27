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
 * @fileoverview Tests for the detangle-options-toggle element
 */
goog.setTestOnly();


goog.require('detangle.Profiles');
goog.require('detangle.ToggleSettings');
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
    }, 50);
  });
}


function setUp() {
  function fail_() {
    fail();
  }

  mockControl = new goog.testing.MockControl();
  goog.global.chrome = {
    runtime: {sendMessage: function() {}},
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
 * @param {{preferManaged: boolean, checkedByDefault: boolean,
 *     managedValue: (boolean|undefined), userValue: (boolean|undefined),
 *     assertChecked: boolean, assertDisabled: boolean}} scenario Test scenario
 *     options
 * @return {!Promise}
 * @suppress {const} We overwrite detangle.ToggleSettings.
 */
function simpleTest(scenario) {
  mockControl
      .createMethodMock(chrome.storage.onChanged, 'addListener')(
          goog.testing.mockmatchers.isFunction)
      .$does(function() {});
  if (scenario.thisProfile &&
      scenario.thisProfile != detangle.Profiles.CORPORATE) {
    mockControl
        .createMethodMock(chrome.storage.local, 'get')(
            'test', goog.testing.mockmatchers.isFunction)
        .$does(storageGetCallback(scenario.userValue));
  } else {
    mockControl
        .createMethodMock(chrome.storage.sync, 'get')(
            'test', goog.testing.mockmatchers.isFunction)
        .$does(storageGetCallback(scenario.userValue));
  }
  mockControl
      .createMethodMock(chrome.storage.managed, 'get')(
          'test', goog.testing.mockmatchers.isFunction)
      .$does(storageGetCallback(scenario.managedValue));
  mockControl.createMethodMock(chrome.storage.sync, 'set');
  mockControl.$replayAll();

  // Invented test data
  storageKey = /** @type {detangle.StorageKey} */ ('test');
  label = 'Test Toggle';

  detangle.ToggleSettings = {
    [storageKey]: {
      label: label,
      preferManaged: scenario.preferManaged,
      default: scenario.checkedByDefault
    }
  };
  var elem = document.createElement('detangle-options-toggle');
  elem.storageKey = storageKey;
  elem.thisProfile = scenario.thisProfile || detangle.Profiles.CORPORATE;

  return wait().then(function() {
    mockControl.$verifyAll();

    // From detangle.ToggleSettings
    assertEquals('preferManaged', scenario.preferManaged, elem.preferManaged);
    assertEquals(label, elem.label);

    // Derived from ToggleSettings and storage
    assertEquals('Checked', scenario.assertChecked, elem.checked);
    assertEquals('Disabled', scenario.assertDisabled, elem.disabled);
  });
}


function testPreferManagedManagedSetUserSet() {
  return simpleTest({
    preferManaged: true,
    checkedByDefault: false,
    managedValue: true,
    userValue: false,
    assertChecked: true,
    assertDisabled: true
  });
}


function testPreferManagedManagedSetUserUnset() {
  return simpleTest({
    preferManaged: true,
    checkedByDefault: false,
    managedValue: true,
    assertChecked: true,
    assertDisabled: true
  });
}


function testPreferManagedManagedUnsetUserSet() {
  return simpleTest({
    preferManaged: true,
    checkedByDefault: false,
    userValue: true,
    assertChecked: true,
    assertDisabled: false
  });
}


function testPreferManagedManagedUnsetUserUnset() {
  return simpleTest({
    preferManaged: true,
    checkedByDefault: true,
    assertChecked: true,
    assertDisabled: false
  });
}



function testPreferUserManagedSetUserSet() {
  return simpleTest({
    preferManaged: false,
    checkedByDefault: false,
    managedValue: false,
    userValue: true,
    assertChecked: true,
    assertDisabled: false
  });
}


function testPreferUserManagedSetUserUnset() {
  return simpleTest({
    preferManaged: false,
    checkedByDefault: false,
    managedValue: true,
    assertChecked: true,
    assertDisabled: false
  });
}


function testPreferUserManagedUnsetUserSet() {
  return simpleTest({
    preferManaged: false,
    checkedByDefault: false,
    userValue: true,
    assertChecked: true,
    assertDisabled: false
  });
}


function testPreferUserManagedUnsetUserUnset() {
  return simpleTest({
    preferManaged: false,
    checkedByDefault: true,
    assertChecked: true,
    assertDisabled: false
  });
}
