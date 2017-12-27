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
 * @fileoverview Tests for the detangle-troubleshooting element
 */
goog.setTestOnly();

goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');


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
    runtime: {
      getPlatformInfo: fail_,
    },
    storage: {
      local: {get: fail_},
      managed: {get: fail_},
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
    if (cb == undefined) {  // invoked with just callback
      cb = key;
      key = undefined;
    }

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
  * @param {{platform: string, lastUpdated_: number, managedUrl: string}} scenario Test scenario
  *     options
  * @return {!Promise}
  */
function simpleTest(scenario) {
  goog.global.chrome.runtime.getPlatformInfo = (function(platform) {
    return function(cb) {
      cb({
        os: platform,
      });
    };
  })(scenario.platform);

  goog.global.chrome.storage.managed.get = storageGetCallback({
    managed_policy_url: scenario.managedUrl,
  });

  goog.global.chrome.storage.local.get = storageGetCallback({
    managed_policy_last_updated: scenario.lastUpdated_,
  });

  mockControl.$replayAll();

  var elem = document.createElement('detangle-troubleshooting');

  return wait().then(function() {
    mockControl.$verifyAll();

    assertEquals(
        'Managed URL state correct', scenario.managedUrl,
        elem.managedPolicyUrlManaged);
    assertEquals('Platform state correct', scenario.platform, elem.platform);
    assertEquals(
        'Last updated state correct', scenario.lastUpdated_, elem.lastUpdated_);
    assertEquals(
        'osPackageStatusIcon correct', scenario.osOkayIcon,
        elem.osPackageStatusIcon_);
    assertEquals(
        'supportedOSStatusIcon correct', scenario.platformOkayIcon,
        elem.supportedOSStatusIcon_);
    assertEquals(
        'updateOkayIcon correct', scenario.updateOkayIcon,
        elem.updatedFromWebserviceStatusIcon_);
    assertEquals(
        'recommendationKind correct', scenario.recommendation,
        elem.recommendationKind);
  });
}


function testLinuxEverythingOkay() {
  return simpleTest({
    managedUrl: 'bleb',
    lastUpdated_: 1480643677648,
    platform: 'linux',
    osOkayIcon: 'check',
    platformOkayIcon: 'check',
    updateOkayIcon: 'check',
    recommendation: 'ok',
  });
}

function testEverythingOkayExceptHaventUpdated() {
  return simpleTest({
    managedUrl: 'bleb',
    lastUpdated_: 0,
    platform: 'linux',
    osOkayIcon: 'check',
    platformOkayIcon: 'check',
    updateOkayIcon: 'close',
    recommendation: 'force-webservice',
  });
}

function testManagedPolicyUrlNotSetWin() {
  return simpleTest({
    managedUrl: '',
    lastUpdated_: 0,
    platform: 'win',
    osOkayIcon: 'close',
    platformOkayIcon: 'check',
    updateOkayIcon: 'close',
    recommendation: 'install-win',
  });
}

function testManagedPolicyUrlNotSetMac() {
  return simpleTest({
    managedUrl: '',
    lastUpdated_: 0,
    platform: 'mac',
    osOkayIcon: 'close',
    platformOkayIcon: 'check',
    updateOkayIcon: 'close',
    recommendation: 'install-mac',
  });
}

function testManagedPolicyUrlNotSetLinux() {
  return simpleTest({
    managedUrl: '',
    lastUpdated_: 0,
    platform: 'linux',
    osOkayIcon: 'close',
    platformOkayIcon: 'check',
    updateOkayIcon: 'close',
    recommendation: 'install-linux',
  });
}

function testChromeOS() {
  return simpleTest({
    managedUrl: '',
    lastUpdated_: 0,
    platform: 'cros',
    osOkayIcon: 'close',
    platformOkayIcon: 'close',
    updateOkayIcon: 'close',
    recommendation: 'platform-partially-supported',
  });
}

function testOsNotSupported() {
  return simpleTest({
    managedUrl: '',
    lastUpdated_: 0,
    platform: 'blueberryOS',
    osOkayIcon: 'close',
    platformOkayIcon: 'close',
    updateOkayIcon: 'close',
    recommendation: 'platform-unsupported',
  });
}
