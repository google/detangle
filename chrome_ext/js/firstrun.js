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
 * @fileoverview Prepare the browser profile for it's designated role.
 */

'use strict';

goog.provide('detangle.AlreadyConfigured');
goog.provide('detangle.AttemptToReconfigure');
goog.provide('detangle.NoProfileSpecified');
goog.provide('detangle.doFirstRun');
goog.provide('detangle.firstRun');

goog.require('detangle.CHILD_PROFILE_TYPES');
goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.getLocalStorage');
goog.require('detangle.utils');
goog.require('goog.uri.utils');


/**
 * Error thrown when the browser is already configured.
 */
detangle.AlreadyConfigured = class extends Error {};


/**
 * Error thrown when the browser has already been configured as something else.
 */
detangle.AttemptToReconfigure = class extends Error {
  /**
   * @param {!detangle.Profiles} providedProfile
   */
  constructor(providedProfile) {
    super('Attempt to reconfigure browser as ' + providedProfile);
    this.providedProfile = providedProfile;
  }
};

/**
 * Error thrown when no profile was specified in the URL.
 */
detangle.NoProfileSpecified = class extends Error {};


/**
 * First run code.
 *
 * This is usually called by the firstrun webpage, which is intended to be
 * launched with a GET parameter specifying the profile, eg:
 * chrome-extension://xxxxxx/firstrun.html?profile=NONPRIV
 *
 * This is probably not ideal, but it's the only way to kick this off at the
 * moment.  It will refuse to reconfigure.
 *
 * @package
 * @param {string=} opt_currentUrl Use this instead of window.location.href
 * @return {!Promise<detangle.Profiles>} which profile we're now configured as
 */
detangle.firstRun = function(opt_currentUrl) {
  return Promise.resolve(opt_currentUrl || window.location.href)
      .then(extractProvidedProfile)
      .then(checkProvidedProfile)
      .then(checkNotAlreadyConfigured)
      .catch(maybeReconfigure)
      .then(setCurrentProfile);

  /**
   * Extract the provided profile from current_url.
   *
   * @param {!string} currentUrl The URL that we're visiting
   * @return {?string} The content of the profile url parameter
   */
  function extractProvidedProfile(currentUrl) {
    return goog.uri.utils.getParamValue(currentUrl, 'profile');
  }

  /**
   * Check that the provided profile is sensible.
   *
   * @param {?string} providedProfile Profile provided in URL
   * @return {!detangle.Profiles} Pass through validated provided profile
   */
  function checkProvidedProfile(providedProfile) {
    if (!providedProfile) {
      throw new detangle.NoProfileSpecified();
    }
    /** @type {!detangle.Profiles} */
    var validatedProfile = detangle.utils.validateProfile(providedProfile);
    if (!detangle.CHILD_PROFILE_TYPES[validatedProfile]) {
      throw new Error('Invalid/unsupported profile type: ' + validatedProfile);
    }
    return validatedProfile;
  }

  /**
   * Checks whether the profile is already configured.
   *
   * @param {!detangle.Profiles} providedProfile Profile provided by GET
   *     parameter.
   * @return {!Promise<!detangle.Profiles>} pass through provided profile
   */
  function checkNotAlreadyConfigured(providedProfile) {
    /** @type {!detangle.PromiseStorageArea} */
    var localStorage = detangle.getLocalStorage();
    return localStorage.get(detangle.StorageKeys.THIS_PROFILE)
        .then(function(items) {
          if (detangle.StorageKeys.THIS_PROFILE in items) {
            if (items[detangle.StorageKeys.THIS_PROFILE] == providedProfile) {
              throw new detangle.AlreadyConfigured();
            } else {
              throw new detangle.AttemptToReconfigure(providedProfile);
            }
          }
          return providedProfile;
        });
  }


  /**
   * Prompt to reconfigure the browser type if it was already configured.
   *
   * @param {*} e The exception that was thrown
   * @return {!detangle.Profiles}
   */
  function maybeReconfigure(e) {
    if (e instanceof detangle.AttemptToReconfigure &&
        confirm(
            'Reconfigure this browser as ' +
            detangle.utils.computeProfileLabel(e.providedProfile) + '?')) {
      return e.providedProfile;
    }
    throw e;
  }


  /**
   * Set the current profile to the provided profile string in GET parameter.
   *
   * @param {detangle.Profiles} providedProfile
   * @return {!Promise<detangle.Profiles>} pass through providedProfile
   */
  function setCurrentProfile(providedProfile) {
    /** @type {!Object<string,?>} */
    var storageItemsToSet = {};
    /** @type {!detangle.PromiseStorageArea} */
    var localStorage = detangle.getLocalStorage();

    storageItemsToSet[detangle.StorageKeys.THIS_PROFILE] = providedProfile;
    return localStorage.set(storageItemsToSet).then(function() {
      return providedProfile;
    });
  }
};


/**
 * Kicks off the first run code.
 *
 * Called as a onload handler from firstrun.html - it's purpose is to execute
 * firstrun() then adjust the webpage depending on what happened.
 *
 * TODO(michaelsamuel): figure out how to test this code.
 *
 * @param {string=} opt_currentUrl Use this instead of window.location.href
 * @return {!Promise}
 * @public
 */
detangle.doFirstRun = function(opt_currentUrl) {
  /**
   * Runs once firstrun has successfully completed.
   *
   * @param {!detangle.Profiles} unused_profile Profile that we're now
   * configured as
   * @private
   */
  function completed_(unused_profile) {
    chrome.tabs.create(
        {url: chrome.runtime.getURL('firstrun.html'), active: true});
  }

  /**
   * Catch AlreadyConfigured errors, re-reject others
   *
   * @param {*} reason An exception that was thrown somewhere in the Promise
   *     chain
   * @return {(!Promise|undefined)}
   */
  function failed_(reason) {
    if (!(reason instanceof detangle.AlreadyConfigured)) {
      return Promise.reject(reason);
    }
  }

  return detangle.firstRun(opt_currentUrl).then(completed_, failed_);
};
