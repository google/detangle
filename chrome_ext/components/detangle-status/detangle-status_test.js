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
 * @fileoverview Tests for the detangle-status element
 */

'use strict';

goog.require('detangle.Profiles');
goog.require('goog.testing.jsunit');


/** @private {(!detangle.Profiles|undefined)} */
var thisProfile_;


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
  chrome = {runtime: {}};
  chrome.runtime.sendMessage = function(msg, callback) {
    callback({running_in: thisProfile_});
  };
  detangle.StatusElement.instance = undefined;
}


function testCorporate() {
  thisProfile_ = detangle.Profiles.CORPORATE;
  var element = document.createElement('detangle-status');
  return wait().then(function() {
    assertEquals(detangle.Profiles.CORPORATE, element.thisProfile);
  });
}


function testRegular() {
  thisProfile_ = detangle.Profiles.REGULAR;
  var element = document.createElement('detangle-status');
  return wait().then(function() {
    assertEquals(detangle.Profiles.REGULAR, element.thisProfile);
  });
}


function testIsolated() {
  thisProfile_ = detangle.Profiles.ISOLATED;
  var element = document.createElement('detangle-status');
  return wait().then(function() {
    assertEquals(detangle.Profiles.ISOLATED, element.thisProfile);
  });
}


function testNoResponse() {
  chrome.runtime.sendMessage = function() {};

  var element = document.createElement('detangle-status');
  return wait().then(function() {
    assertUndefined(element.thisProfile);
  });
}

function testMultipleInstances() {
  const thisProfile = detangle.Profiles.ISOLATED;
  let numCalls = 0;

  chrome.runtime.sendMessage = function(msg, callback) {
    numCalls += 1;
    callback({running_in: thisProfile});
  };
  document.createElement('detangle-status');  // Call 1
  document.createElement('detangle-status');  // No call
  document.createElement('detangle-status');  // No call
  detangle.StatusElement.instance = undefined;
  const element = document.createElement('detangle-status');  // Call 2
  return wait().then(function() {
    assertEquals(detangle.Profiles.ISOLATED, element.thisProfile);
    assertEquals(2, numCalls);
  });
}
