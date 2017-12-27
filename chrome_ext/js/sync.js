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
 * @fileoverview Utility methods to help sync options between profiles.
 */

'use strict';

goog.provide('detangle.LocalStorageSyncKeys');
goog.provide('detangle.SyncStorageSyncKeys');
goog.provide('detangle.decodeSyncOptions');
goog.provide('detangle.encodeSyncOptions');
goog.provide('detangle.fetchSyncData');

goog.require('detangle.StorageKeys');
goog.require('detangle.getLocalStorage');
goog.require('detangle.getPrefsStorage');


/**
 * Storage keys to be retrieved from sync storage and sent to subordinate
 * profiles.
 *
 * @type {!Array<detangle.StorageKeys>}
 * @const
 */
detangle.SyncStorageSyncKeys = [
  detangle.StorageKeys.DEFAULT_SANDBOX,
  detangle.StorageKeys.DISPLAY_HANDOFF_PAGE,
  detangle.StorageKeys.INCOGNITO_SANDBOX,
  // TODO(michaelsamuel): Don't sync these when we start syncing the cached ACL.
  detangle.StorageKeys.MANAGED_POLICY_BASE_UPDATE_PERIOD,
  detangle.StorageKeys.MANAGED_POLICY_UPDATE_VARIATION,
  detangle.StorageKeys.MANAGED_POLICY_URL,
  detangle.StorageKeys.REGULAR_BLACKLIST,
  detangle.StorageKeys.RISKY_BLACKLIST,
  detangle.StorageKeys.REGULAR_WHITELIST,
  detangle.StorageKeys.RISKY_WHITELIST,
];


/**
 * Storage keys to be retrieved from local storage and sent to subordinate
 * profiles.
 *
 * @type {!Array<detangle.StorageKeys>}
 * @const
 */
detangle.LocalStorageSyncKeys = [
  // TODO(michaelsamuel): re-enable when sync channel can handle size.
  // detangle.StorageKeys.CACHED_WEBSERVICE_ACL,
];


/**
 * Fetches sync data from storage and encodes it as a URL search param.
 * @param {detangle.Profiles} targetProfile
 * @return {!Promise<string>}
 */
detangle.fetchSyncData = function(targetProfile) {
  return Promise
      .all([
        detangle.getPrefsStorage().get(detangle.SyncStorageSyncKeys),
        detangle.getLocalStorage().get(detangle.LocalStorageSyncKeys)
      ])
      .then(function(storageData) {
        return detangle.encodeSyncOptions(storageData, targetProfile);
      });
};

/**
 * Converts options data from URI parameters. Parameters are decoded serially,
 * and each parameter is passed to a callback function.
 *
 * Only settings that are listed in detangle.Sync{Acls,Toggles} will be decoded.
 *
 * @suppress {missingProperties} URLSearchParams.entries() not in externs
 * @param {!URLSearchParams} encodedParams The parameters to process.
 * @return {!Map}
 * @package
 */
detangle.decodeSyncOptions = function(encodedParams) {
  let /** !Map */ decodedOptions = new Map();

  // Identify the options that need to be saved and store them.
  for (let opt of encodedParams.entries()) {
    if (opt[0] == 'profile') {
      continue;  // profile is used by doFirstRun and isn't JSON encoded :/
    }
    try {
      decodedOptions.set(opt[0], JSON.parse(opt[1]));
    } catch (e) {
      throw new Error('Bad option data for ' + opt[0]);
    }
  }

  return decodedOptions;
};


/**
 * Encodes settings data into URI parameters. Settings are encoded and added
 * to a parameter string.
 *
 * @param {!Array<!Object<string, ?>>} storageData Retrieved storage data
 * @param {!detangle.Profiles} targetProfile Profile to encode options for
 * @return {string}
 * @package
 */
detangle.encodeSyncOptions = function(storageData, targetProfile) {
  let /** !URLSearchParams */ encodedOptions = new URLSearchParams();

  // Append the target profile, picked up by firstRun()
  encodedOptions.append('profile', targetProfile);

  for (let i = 0; i < storageData.length; i++) {
    for (let key of Object.keys(storageData[i])) {
      let val = storageData[i][key];
      let param = JSON.stringify(val);
      encodedOptions.append(key, param);
    }
  }

  return '?' + encodedOptions.toString();
};
