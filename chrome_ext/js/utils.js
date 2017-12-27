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
 * @fileoverview Utility functions for frontend pages/components
 */

goog.module('detangle.utils');
goog.module.declareLegacyNamespace();

const ProfileIcons = goog.require('detangle.ProfileIcons');
const ProfileLabels = goog.require('detangle.ProfileLabels');
const Profiles = goog.require('detangle.Profiles');
const StorageKeys = goog.require('detangle.StorageKeys');


/**
 * Computes the human-facing name for a profile.
 *
 * @param {string} profile A stringified detangle.Profiles value
 * @return {string} The end-user readable label for the profile
 */
function computeProfileLabel(profile) {
  try {
    /** @type {!Profiles} */
    var validatedProfile = validateProfile(profile);
    return ProfileLabels[validatedProfile] || profile;
  } catch (e) {
    return profile || '';
  }
}
exports.computeProfileLabel = computeProfileLabel;


/**
 * Computes the appropriate icon to represent a profile.
 *
 * @param {string} profile A stringified Profiles value
 * @return {string} The end-user icon for the profile
 */
function computeProfileIcon(profile) {
  try {
    /** @type {!Profiles} */
    var validatedProfile = validateProfile(profile);
    return ProfileIcons[validatedProfile] || 'account-box';
  } catch (e) {
    return 'account-box';
  }
}
exports.computeProfileIcon = computeProfileIcon;


/**
 * @public
 *
 * @param {Profiles} profile Profile that we want the ACL for
 * @return {StorageKeys} The key that the ACL for the provided profile
 *     is kept in.
 */
function computeAclStorageKey(profile) {
  switch (profile) {
    case Profiles.CORPORATE:
      return StorageKeys.PRIV_WHITELIST;
    case Profiles.REGULAR:
      return StorageKeys.REGULAR_WHITELIST;
    case Profiles.ISOLATED:
      return StorageKeys.RISKY_WHITELIST;
    default:
      throw new Error('Invalid profile: ' + profile);
  }
}
exports.computeAclStorageKey = computeAclStorageKey;


/**
 * Validates the profile, returning a strongly typed version of the string
 * passed.
 *
 * @param {string|!Profiles} profile Profile to validate
 * @return {!Profiles}
 */
function validateProfile(profile) {
  // TODO(b/29025048): Remove literal strings when we have storage migration
  // implemented for profile labels.
  switch (profile) {
    case Profiles.CORPORATE:
    case 'PRIV':
      return Profiles.CORPORATE;
    case Profiles.REGULAR:
    case 'NONPRIV':
      return Profiles.REGULAR;
    case Profiles.ISOLATED:
    case 'SANDBOX':
      return Profiles.ISOLATED;
    default:
      throw new Error('Invalid Profile');
  }
}
exports.validateProfile = validateProfile;
