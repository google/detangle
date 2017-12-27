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
 * @fileoverview Tests for the detangle-intercepted-page element
 */
goog.setTestOnly();

goog.require('detangle.Profiles');
goog.require('goog.testing.jsunit');


// Workaround because unit tests won't work if we don't import a detangle
// namespace :(
console.log(detangle.Profiles.CORPORATE);

function setUp() {
  function noop() {}

  chrome = {
    runtime: {sendMessage: noop},
    storage: {
      managed: {get: noop},
      onChanged: {addListener: noop},
      sync: {get: noop, set: noop}
    }
  };
}


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

function testHashToEventId() {
  window.location.hash = '#fakeEvent';
  elem = document.createElement('detangle-intercepted-page');
  return wait().then(function() { assertEquals('fakeEvent', elem.eventId); });
}
