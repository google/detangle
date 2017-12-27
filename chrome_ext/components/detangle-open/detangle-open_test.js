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
 * @fileoverview Tests for the detangle-open component.
 */

'use strict';

goog.setTestOnly();


goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('goog.testing.jsunit');


/** @type {!Element} */
var elem;

/** @type {(string|undefined)} */
var redirectTarget;

function setUp() {
  chrome = {
    windows: {
      getCurrent: function() {},
    },
    runtime: {},
    storage: {
      local: {
        get: function(keys, callback) {
          callback({
            [detangle.StorageKeys.THIS_PROFILE]: detangle.Profiles.REGULAR,
          });
        },
      },
    },
  };

  elem = document.createElement('detangle-open');
  redirectTarget = undefined;
  elem.redirectTo = function(targetUrl) {
    redirectTarget = targetUrl;
  };
}

/**
 * Waits, then resolves.
 *
 * @return {!Promise}
 */
function wait() {
  return new Promise(resolve => {
    setTimeout(resolve, 250);
  });
}


function testComputedParamsRaisesByDefault() {
  elem.queryString = 'url=http://www.example.com/';
  assertEquals('http://www.example.com/', elem.targetUrl);
  assertTrue(elem.shouldRaiseWindow);
}


function testComputedParamsRaiseTrue() {
  elem.queryString = 'url=http://www.example.com/&raise=true';
  assertEquals('http://www.example.com/', elem.targetUrl);
  assertTrue(elem.shouldRaiseWindow);
}


function testComputedParamsRaiseFalse() {
  elem.queryString = 'url=http://www.example.com/&raise=false';
  assertEquals('http://www.example.com/', elem.targetUrl);
  assertFalse(elem.shouldRaiseWindow);
}


function testComputedParamsInvalidQueryString() {
  elem.queryString = 'blah';
  assertEquals('', elem.targetUrl);
}


function testReadyToRedirectHttpNoRaise() {
  return elem.readyToRedirect('http://www.example.com/', false).then(() => {
    assertEquals('http://www.example.com/', redirectTarget);
    assertUndefined(elem.errorMessage);
  });
}


function testReadyToRedirectHttpsNoRaise() {
  return elem.readyToRedirect('https://www.example.com/', false).then(() => {
    assertEquals('https://www.example.com/', redirectTarget);
    assertUndefined(elem.errorMessage);
  });
}


function testReadyToRedirectFtpNoRaise() {
  return elem.readyToRedirect('ftp://www.example.com/', false).then(() => {
    assertEquals('ftp://www.example.com/', redirectTarget);
    assertUndefined(elem.errorMessage);
  });
}


function testReadyToRedirectChromeExt() {
  return elem.readyToRedirect('chrome-extension://www.example.com/', false)
      .then(() => {
        assertUndefined(redirectTarget);
        assertRegExp('^Unacceptable', elem.errorMessage);
      });
}


function testReadyToRedirectBareword() {
  return elem.readyToRedirect('blah', false).then(() => {
    assertUndefined(redirectTarget);
    assertRegExp('^Invalid', elem.errorMessage);
  });
}

function testReadyToRedirectCorporate() {
  chrome.storage.local.get = function(keys, callback) {
    callback({
      [detangle.StorageKeys.THIS_PROFILE]: detangle.Profiles.CORPORATE,
    });
  };
  return elem.readyToRedirect('http://www.example.com/', false).then(() => {
    assertUndefined(redirectTarget);
    assertEquals(
        'Attempt to open URL in Corporate profile.', elem.errorMessage);
  });
}
