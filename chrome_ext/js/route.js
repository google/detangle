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
 * @fileoverview Route URLs to the correct profile
 */

'use strict';

goog.provide('detangle.getProfile');
goog.provide('detangle.isBlocked');

goog.require('detangle.Acl');
goog.require('detangle.Profiles');
goog.require('detangle.Settings');


/**
 * Decide which profile should handle navigation..
 * Profile resolution is as follows:
 * - if the url is flagged for the Isolated profile, isolate it.
 * - if the url is handled by the current profile, continue.
 * - otherwise, send it to the default profile.
 *
 * TODO(michaelsamuel): Now that we have blacklisting we may consider a simpler
 * flow, such as stay here, otherwise lowest->highest.
 *
 * @package
 * @param {?detangle.Settings} settings Detangle settings to make decision based
 *     on
 * @param {string} destination Intercepted url
 * @return {!detangle.Profiles} profile Profile to handle the request, null for
 *     current
 */
detangle.getProfile = function(settings, destination) {
  if (!settings) {
    // Should be unreachable!
    throw new Error('Attempt to make routing decision without settings');
  }

  switch (settings.thisProfile) {
    case detangle.Profiles.CORPORATE:
      return detangle.getProfileCorporate_(
          /** @type {!detangle.Settings} */ (settings), destination);
    case detangle.Profiles.REGULAR:
      return detangle.getProfileRegular_(
          /** @type {!detangle.Settings} */ (settings), destination);
    case detangle.Profiles.ISOLATED:
      return detangle.Profiles.ISOLATED;
    default:
      // Should be unreachable!
      throw new Error('Internal Error: invalid profile!');
  }
};


/*
 * detangle.matches(Regular|Corporate|Isolated)_ are helper functions to make
 * the
 * getProfile(Corporate|Regular)_ functions less copy-pastey
 */


/**
 * Test whether destination matches the Corporate ACL
 *
 * @private
 * @param {!detangle.Settings} settings Detangle settings to make decision based
 *     on
 * @param {string} destination A url
 * @return {boolean} whether it matched
 */
detangle.matchesCorporate_ = function(settings, destination) {
  return settings.acls[detangle.Profiles.CORPORATE].test(destination);
};


/**
 * Test whether destination matches the Regular ACL
 *
 * @private
 * @param {!detangle.Settings} settings Detangle settings to make decision based
 *     on
 * @param {string} destination A url
 * @return {boolean} whether it matched
 */
detangle.matchesRegular_ = function(settings, destination) {
  return settings.acls[detangle.Profiles.REGULAR].test(destination);
};


/**
 * Test whether destination matches the Isolated ACL
 *
 * @private
 * @param {!detangle.Settings} settings Detangle settings to make decision based
 *     on
 * @param {string} destination A url
 * @return {boolean} whether it matched
 */
detangle.matchesIsolated_ = function(settings, destination) {
  return settings.acls[detangle.Profiles.ISOLATED].test(destination);
};


/**
 * We're in the Corporate browser, decide where to hand off destination to.
 *
 * @private
 * @param {!detangle.Settings} settings Detangle settings to make decision based
 *     on
 * @param {string} destination Intercepted url
 * @return {!detangle.Profiles} profile Profile to handle the request, null for
 *     current
 */
detangle.getProfileCorporate_ = function(settings, destination) {
  let defaultToRegular = !settings.defaultIsolated;

  // Isolated preempts the whitelist
  if (detangle.matchesIsolated_(settings, destination)) {
    return detangle.Profiles.ISOLATED;
  }

  // Check if it's in the corporate whitelist
  if (detangle.matchesCorporate_(settings, destination)) {
    return detangle.Profiles.CORPORATE;
  }

  // Depending on regular acl and default behaviour, get rid of it
  if (defaultToRegular || detangle.matchesRegular_(settings, destination)) {
    return detangle.Profiles.REGULAR;
  } else {
    return detangle.Profiles.ISOLATED;
  }
};


/**
 * We're in the Regular profile, decide where to hand off destination to.
 *
 * @private
 * @param {!detangle.Settings} settings Detangle settings to make decision based
 *     on
 * @param {string} destination Intercepted url
 * @return {!detangle.Profiles} profile Profile to handle the request, null for
 *     current
 */
detangle.getProfileRegular_ = function(settings, destination) {
  let defaultRegular = !settings.defaultIsolated;

  // Isolated preempts the whitelist
  if (detangle.matchesIsolated_(settings, destination)) {
    return detangle.Profiles.ISOLATED;
  }

  // If the default profile is regular one or it's in the regular ACL, keep it
  if (defaultRegular || detangle.matchesRegular_(settings, destination)) {
    return detangle.Profiles.REGULAR;
  } else {
    return detangle.Profiles.ISOLATED;
  }
};


/**
 * Tests whether a URL is blocked in this profile.
 *
 * @param {!detangle.Settings} settings Detangle settings to make decision based
 *     on.
 * @param {string} destination URL to test
 * @return {boolean}
 */
detangle.isBlocked = function(settings, destination) {
  /** @type {!detangle.Acl} */
  let blackList =
      settings.blackLists[settings.thisProfile] || new detangle.Acl();
  return settings.globalBlacklist.test(destination) ||
      blackList.test(destination);
};
