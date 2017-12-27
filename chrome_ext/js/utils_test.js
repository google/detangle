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
 * @fileoverview Tests for utils.js
 */

goog.module('detangle.utilsTest');

goog.setTestOnly();

const ProfileIcons = goog.require('detangle.ProfileIcons');
const ProfileLabels = goog.require('detangle.ProfileLabels');
const Profiles = goog.require('detangle.Profiles');
const StorageKeys = goog.require('detangle.StorageKeys');
const testSuite = goog.require('goog.testing.testSuite');
const utils = goog.require('detangle.utils');


testSuite({
  getTestName() {
    return 'detangle.utilsTest';
  },

  testComputeProfileLabelCorporate() {
    assertEquals(
        ProfileLabels[Profiles.CORPORATE],
        utils.computeProfileLabel(Profiles.CORPORATE));
  },

  testComputeProfileLabelRegular() {
    assertEquals(
        ProfileLabels[Profiles.REGULAR],
        utils.computeProfileLabel(Profiles.REGULAR));
  },

  testComputeProfileLabelIsolated() {
    assertEquals(
        ProfileLabels[Profiles.ISOLATED],
        utils.computeProfileLabel(Profiles.ISOLATED));
  },

  testComputeProfileLabelCraziness() {
    assertEquals('Craziness', utils.computeProfileLabel('Craziness'));
  },

  testComputeAclStorageKey() {
    assertEquals(
        StorageKeys.PRIV_WHITELIST,
        utils.computeAclStorageKey(Profiles.CORPORATE));
    assertEquals(
        StorageKeys.REGULAR_WHITELIST,
        utils.computeAclStorageKey(Profiles.REGULAR));
    assertEquals(
        StorageKeys.RISKY_WHITELIST,
        utils.computeAclStorageKey(Profiles.ISOLATED));
  },

  testComputeProfileLabel() {
    assertEquals(
        ProfileIcons[Profiles.CORPORATE],
        utils.computeProfileIcon(Profiles.CORPORATE));
    assertEquals(
        ProfileIcons[Profiles.REGULAR],
        utils.computeProfileIcon(Profiles.REGULAR));
    assertEquals(
        ProfileIcons[Profiles.ISOLATED],
        utils.computeProfileIcon(Profiles.ISOLATED));
  },

  testValidateProfileCorporate() {
    /** @type {!Profiles} */
    const profile = utils.validateProfile('PRIV');
    assertEquals(profile, Profiles.CORPORATE);
  },

  testValidateProfileRegular() {
    /** @type {!Profiles} */
    const profile = utils.validateProfile('NONPRIV');
    assertEquals(profile, Profiles.REGULAR);
  },

  testValidateProfileIsolated() {
    /** @type {!Profiles} */
    const profile = utils.validateProfile('SANDBOX');
    assertEquals(profile, Profiles.ISOLATED);
  },

  testValidateProfileInvalid() {
    const e = assertThrows(function() {
      utils.validateProfile('INVALID');
    });
    assertEquals(e.message, 'Invalid Profile');
  },
});
