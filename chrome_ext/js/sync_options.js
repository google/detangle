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
 * @fileoverview Handles calls to the sync_options page.
 */

'use strict';

goog.provide('detangle.doSyncOptions');
goog.provide('detangle.syncOptions');

goog.require('detangle.LocalStorageSyncKeys');
goog.require('detangle.NoProfileSpecified');
goog.require('detangle.ProfileLabels');
goog.require('detangle.StorageKeys');
goog.require('detangle.SyncStorageSyncKeys');
goog.require('detangle.decodeSyncOptions');
goog.require('detangle.doFirstRun');
goog.require('detangle.getLocalStorage');


/**
 * Option sync code.
 *
 * Called by the sync_options webpage, which is launched by detanglenm with a
 * GET parameter providing base64, uri-encoded options data as parameters.
 *
 * @package
 * @param {string} pageUrl The page URL to process.
 * @return {!Promise} Promise to apply synched options to the settings.
 */
detangle.syncOptions = function(pageUrl) {
  /**
   * Check whether this profile accepts sync requests, throws an Error if it
   * doesn't.
   *
   * @param {!detangle.Profiles} thisProfile The settings that will be checked.
   */
  function checkThisProfileCanSync(thisProfile) {
    // Only proceed if this is a subordinate profile (REGULAR or ISOLATED).
    if (!detangle.CHILD_PROFILE_TYPES[thisProfile]) {
      let name = detangle.ProfileLabels[thisProfile] || 'Unconfigured';
      throw new Error('Attempt to sync options to ' + name + ' profile');
    }
  }

  /**
   * Decide whether to allow sync, and if so, get the option data.
   * @return {!URLSearchParams} pass through option data to sync.
   * @param {string} pageUrl A URL string containing the parameters to extract.
   */
  function getOptions(pageUrl) {
    let /** !URL */ syncUrl = new URL(pageUrl);
    let /** !URLSearchParams */ optionParams =
        new URLSearchParams(syncUrl.search.slice(1));
    return optionParams;
  }

  /**
   * Set options for parameters with both valid names and decodable data.
   * @param {!URLSearchParams} optionParams The option data to sync.
   * @return {!Promise}
   */
  function setOptions(optionParams) {
    /** {!Map} */
    let options = detangle.decodeSyncOptions(optionParams);

    let itemsToSet = {};

    for (let key of detangle.SyncStorageSyncKeys) {
      itemsToSet[key] = options.get(key);  // Gets unset if not in options
    }

    for (let key of detangle.LocalStorageSyncKeys) {
      itemsToSet[key] = options.get(key);  // Gets unset if not in options
    }

    return detangle.getLocalStorage().set(itemsToSet);
  }

  // Bind the page URL so that it can be used in a Promise.
  let getOptionsFromPage = () => getOptions(pageUrl);

  return detangle.getLocalStorage()
      .getValue(detangle.StorageKeys.THIS_PROFILE)
      .then(checkThisProfileCanSync)
      .then(getOptionsFromPage)
      .then(setOptions);
};


/**
 * Trigger the options sync to this profile.
 *
 * This is the webpage handler to:
 * - handle requests.
 * - close the page once the sync is complete.
 * - notify the user if there was a problem with the sync.
 *
 * @param {string=} opt_currentUrl Use this instead of window.location.href
 * @return {!Promise} Promise to try sync the options then update the status.
 */
detangle.doSyncOptions = function(opt_currentUrl) {
  /**
   * Notify that the options sync failed.
   * @param {boolean} close Close the window after the message is displayed.
   * @param {?*=} opt_msg Error object/string
   * @param {?string=} opt_style The css style to decorate the message with.
   * @private
   */
  function display_(close, opt_msg, opt_style) {
    const /** string */ msgString =
        opt_msg.toString ? opt_msg.toString() : '' + opt_msg;
    const /** ?Element */ msgDiv = document.querySelector('#message_area');
    console.log(msgString);
    msgDiv.innerText = msgString;
    msgDiv.className = opt_style ? opt_style : 'success';
    msgDiv.style.display = 'inline';
    if (close) {
      window.close();
    }
  }

  let completed_ = (m = 'Options updated') => display_(true, m, 'success');
  let failed_ = e => display_(false, e, 'fail');
  let currentUrl = opt_currentUrl || window.location.href;

  return detangle.doFirstRun(currentUrl)
      .catch(function(e) {
        // For compatability, we allow options sync without profile specified,
        // but of course if we're unconfigured we will still be unconfigured.
        // TODO(michaelsamuel): remove this once most are updated
        if (!(e instanceof detangle.NoProfileSpecified)) {
          return Promise.reject(e);
        }
      })
      .then(() => detangle.syncOptions(currentUrl))
      .then(completed_, failed_);
};


// Sync options when the page loads, but only if this is a real Chrome instance.
// Tests will need to call doSyncOptions manually.
if (chrome && chrome.runtime && chrome.runtime.id) {
  // The event listener needs a function, not a Promise. Give it a function.
  document.addEventListener(
      'DOMContentLoaded', function() { detangle.doSyncOptions(); });
}
