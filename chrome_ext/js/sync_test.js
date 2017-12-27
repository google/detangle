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
 * @fileoverview Tests for sync.js
 */

'use strict';

goog.setTestOnly();


goog.require('detangle.AclEntryTags');
goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.decodeSyncOptions');
goog.require('detangle.encodeSyncOptions');
goog.require('detangle.fetchSyncData');
goog.require('detangle.test');
goog.require('goog.testing.jsunit');


/**
 * Tests that valid options are decoded OK.
 * @suppress {missingProperties} URLSearchParams.keys() not in externs.
 * @public
 */
function testParamsDecodeValidParams() {
  let params = '?' + detangle.StorageKeys.DEFAULT_SANDBOX + '=true' +
      '&' + detangle.StorageKeys.REGULAR_WHITELIST +
      '=%5B%7B%22type%22%3A%22matchpattern%22%2C%22value%22%3A%22%2A%3A//np/acl%22%7D%5D' +
      '&' + detangle.StorageKeys.RISKY_WHITELIST +
      '=%5B%7B%22type%22%3A%22matchpattern%22%2C%22value%22%3A%22%2A%3A//sb/acl%22%7D%5D' +
      '&profile=' + detangle.Profiles.REGULAR;
  let testUrl = new URL('about:blank' + params);
  let encoded = new URLSearchParams(testUrl.search.slice(1));
  let decoded = detangle.decodeSyncOptions(encoded);
  let expectKeys = [
    detangle.StorageKeys.DEFAULT_SANDBOX,
    detangle.StorageKeys.REGULAR_WHITELIST, detangle.StorageKeys.RISKY_WHITELIST
  ];
  assertSameElements(expectKeys, [...decoded.keys()]);
  assertTrue(decoded.get(detangle.StorageKeys.DEFAULT_SANDBOX));
  assertObjectEquals(
      [{type: detangle.AclEntryTags.MATCHPATTERN, value: '*://np/acl'}],
      decoded.get(detangle.StorageKeys.REGULAR_WHITELIST));
  assertObjectEquals(
      [{type: detangle.AclEntryTags.MATCHPATTERN, value: '*://sb/acl'}],
      decoded.get(detangle.StorageKeys.RISKY_WHITELIST));
}


/**
 * Invalid option encodings raise an error.
 * @public
 */
function testParamsThrowsErrorForInvalidParams() {
  let e = assertThrows(function() {
    let testUrl = new URL('about:blank?risky_whitelist=should_fail"');
    let encoded = new URLSearchParams(testUrl.search.slice(1));
    detangle.decodeSyncOptions(encoded);
  });
  assertContains('Bad option data for risky_whitelist', e.message);
}


/**
 * Options are encoded OK. Options other than SyncOptions are omitted.
 * @suppress {missingProperties} URLSearchParams.keys() isn't in externs.
 * @public
 */
function testOptionsEncodedToParams() {
  let options = {};
  options[detangle.StorageKeys.REGULAR_WHITELIST] =
      [{type: detangle.AclEntryTags.MATCHPATTERN, value: '*://np/'}];
  options[detangle.StorageKeys.RISKY_WHITELIST] =
      [{type: detangle.AclEntryTags.MATCHPATTERN, value: '*://sb/'}];
  options[detangle.StorageKeys.INCOGNITO_SANDBOX] = true;
  let testUrl = new URL(
      'about:blank/' +
      detangle.encodeSyncOptions([options], detangle.Profiles.REGULAR));
  let params = new URLSearchParams(testUrl.search.slice(1));
  assertSameElements(
      [
        'profile', detangle.StorageKeys.REGULAR_WHITELIST,
        detangle.StorageKeys.RISKY_WHITELIST,
        detangle.StorageKeys.INCOGNITO_SANDBOX
      ],
      [...params.keys()]);
  assertEquals('true', params.get(detangle.StorageKeys.INCOGNITO_SANDBOX));
  assertArrayEquals(
      [{type: detangle.AclEntryTags.MATCHPATTERN, value: '*://np/'}],
      JSON.parse(params.get(detangle.StorageKeys.REGULAR_WHITELIST) || ''));
  assertArrayEquals(
      [{type: detangle.AclEntryTags.MATCHPATTERN, value: '*://sb/'}],
      JSON.parse(params.get(detangle.StorageKeys.RISKY_WHITELIST) || ''));
}


function testFetchSyncData() {
  detangle.test.setupChromeTests();
  detangle.test.fakeLocalStorage[detangle.StorageKeys.THIS_PROFILE] =
      detangle.Profiles.CORPORATE;
  // TODO(michaelsamuel): re-enable when we can sync large acl
  // detangle.test.fakeLocalStorage[detangle.StorageKeys.CACHED_WEBSERVICE_ACL]
  // = {};
  detangle.test.fakeSyncStorage[detangle.StorageKeys.PRIV_WHITELIST] = [];
  detangle.test.fakeSyncStorage[detangle.StorageKeys.REGULAR_WHITELIST] = [];
  detangle.test.fakeSyncStorage[detangle.StorageKeys.RISKY_WHITELIST] = [];

  return detangle.fetchSyncData(detangle.Profiles.REGULAR)
      .then(params => new URLSearchParams(params.slice(1)))
      .then(detangle.decodeSyncOptions)
      .then(syncOptions => {
        // TODO(michaelsamuel): re-enable when we can sync large acl
        // assertTrue(syncOptions.has(detangle.StorageKeys.CACHED_WEBSERVICE_ACL));
        assertTrue(syncOptions.has(detangle.StorageKeys.REGULAR_WHITELIST));
        assertTrue(syncOptions.has(detangle.StorageKeys.RISKY_WHITELIST));
        assertFalse(syncOptions.has(detangle.StorageKeys.THIS_PROFILE));
        assertFalse(syncOptions.has(detangle.StorageKeys.PRIV_WHITELIST));
      });
}
