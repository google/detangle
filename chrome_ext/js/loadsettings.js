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
 * @fileoverview Code related to the global settings for the extension.
 */

goog.module('detangle.loadSettings');
goog.module.declareLegacyNamespace();

const Acl = goog.require('detangle.Acl');
const Profiles = goog.require('detangle.Profiles');
const PromiseStorageArea = goog.require('detangle.PromiseStorageArea');
const Settings = goog.require('detangle.Settings');
const StorageKeys = goog.require('detangle.StorageKeys');
const getLocalStorage = goog.require('detangle.getLocalStorage');
const getManagedStorage = goog.require('detangle.getManagedStorage');
const getPrefsStorage = goog.require('detangle.getPrefsStorage');
const {assertBoolean, assertNumber, assertString} = goog.require('goog.asserts');
const {validateProfile} = goog.require('detangle.utils');


/**
 * The list of storage keys to be loaded from managed and sync storage.
 *
 * @private {!Array<StorageKeys>}
 */
const prefKeys_ = [
  StorageKeys.DEFAULT_SANDBOX,
  StorageKeys.DISPLAY_HANDOFF_PAGE,
  StorageKeys.GLOBAL_BLACKLIST,
  StorageKeys.INCOGNITO_SANDBOX,
  StorageKeys.PRIV_BLACKLIST,
  StorageKeys.PRIV_WHITELIST,
  StorageKeys.REGULAR_BLACKLIST,
  StorageKeys.REGULAR_WHITELIST,
  StorageKeys.RISKY_BLACKLIST,
  StorageKeys.RISKY_WHITELIST,
  StorageKeys.MANAGED_POLICY_URL,
  StorageKeys.MANAGED_POLICY_BASE_UPDATE_PERIOD,
  StorageKeys.MANAGED_POLICY_UPDATE_VARIATION,
  StorageKeys.NETWORK_CLASS,
];


/**
 * Loads settings from storage.
 *
 * @package
 * @return {!Promise<!Settings>}
 */
function loadSettings() {
  return getLocalStorage()
      .getValue(StorageKeys.THIS_PROFILE)
      .then(checkProfileDefined_)
      .then(validateProfile)
      .then(loadPrefs_)
      .then(processStorage_);

  /**
   * Checks that the profile is defined.
   *
   * @param {(string|undefined)} profile The value retrieved from storage
   * @return {string}
   */
  function checkProfileDefined_(profile) {
    if (!profile) {
      throw new Error('Current profile not yet configured');
    }
    return /** @type {string} */ (profile);
  }

  /**
   * Loads preferences from the relevant storage areas, depending on the profile
   * we're operating in.
   *
   * @param {Profiles} thisProfile The profile we're operating in.
   * @return {!Promise<!Array>}
   */
  function loadPrefs_(thisProfile) {
    /** @type {!PromiseStorageArea} */
    var prefsStorage;

    if (thisProfile == Profiles.CORPORATE) {
      prefsStorage = getPrefsStorage();
    } else {
      prefsStorage = getLocalStorage();
    }

    /** @const {!Promise<!Object<string, ?>>} */
    const userSettings = prefsStorage.get(prefKeys_);
    /** @const {!Promise<!Object<string, ?>>} */
    const managedSettings = getManagedStorage().get(prefKeys_);
    /** @const {!Promise<!Object<string, ?>>} */
    const cachedSettings =
        getLocalStorage().getValue(StorageKeys.CACHED_WEBSERVICE_ACL);

    return Promise.all(
        [thisProfile, userSettings, managedSettings, cachedSettings]);
  }

  /**
   * Processes the Promise.all() output.
   *
   * @private
   * @param {!Array} items The resolved results from [loadThisProfile,
   *     loadUserAcl, loadManagedAcl]
   * @return {!Settings}
   */
  function processStorage_(items) {
    /** @type {!Profiles} */
    const thisProfile = items[0];

    /** @type {!Object<string, ?>} */
    const userPrefs = items[1];

    /** @type {!Object<string, ?>} */
    const managedPrefs = items[2];

    /** @type {!Object<string, ?>} */
    let webserviceAcls = items[3] || {};

    /**
     * Grabs a storage key from managed storage if it exists, otherwise from
     * user storage, otherwise pick the default value.
     *
     * @private
     * @param {!StorageKeys} storageKey Key to retrieve
     * @param {?} defaultValue value returned if not in either storage
     * @return {?}
     */
    function preferManaged_(storageKey, defaultValue) {
      if (storageKey in managedPrefs) {
        return managedPrefs[storageKey];
      } else if (storageKey in userPrefs) {
        return userPrefs[storageKey];
      } else {
        return defaultValue;
      }
    }

    /**
     * Grabs a storage key from user storage if it exists, otherwise from
     * managed storage, otherwise pick the default value.
     *
     * @private
     * @param {!StorageKeys} storageKey Key to retrieve
     * @param {?} defaultValue value returned if not in either storage
     * @return {?}
     */
    function preferUser_(storageKey, defaultValue) {
      if (storageKey in userPrefs) {
        return userPrefs[storageKey];
      } else if (storageKey in managedPrefs) {
        return managedPrefs[storageKey];
      } else {
        return defaultValue;
      }
    }

    const /** string */ managedPolicyUrl =
        assertString(preferManaged_(StorageKeys.MANAGED_POLICY_URL, ''));

    const /** (string|undefined) */ managedPolicySource =
        webserviceAcls[StorageKeys.MANAGED_POLICY_SOURCE];

    // Don't use the cached webservice ACL if:
    // - The managed policy URL is not set
    // - The managed policy cache logged it source and the source is different
    //   to the managed policy URL
    if (!managedPolicyUrl ||
        (managedPolicySource && managedPolicySource != managedPolicyUrl)) {
      webserviceAcls = {};
    }

    const /** ?string */ managedPolicyETag =
        webserviceAcls[StorageKeys.MANAGED_POLICY_ETAG] || null;

    /**
     * The typical use-case would have managed storage only defining the
     * corporate ACL, and leaving regular and isolated alone, therefore also
     * leaving defaultIsolated alone.
     *
     * That being said, if managed storage does have an opinion on regular and
     * isolated acls, it probably should also have an opinion on
     * defaultIsolated.
     *
     * @type {boolean}
     */
    const defaultIsolated =
        assertBoolean(preferManaged_(StorageKeys.DEFAULT_SANDBOX, false));

    /** @type {boolean} */
    const incognitoIsolated =
        assertBoolean(preferManaged_(StorageKeys.INCOGNITO_SANDBOX, false));

    /** @type {boolean} */
    const displayHandoffPage =
        assertBoolean(preferUser_(StorageKeys.DISPLAY_HANDOFF_PAGE, true));

    /** @type {string} */
    const networkClass =
        assertString(preferManaged_(StorageKeys.NETWORK_CLASS, ''));

    /** @type {number} */
    const managedPolicyBaseUpdatePeriod = assertNumber(
        preferManaged_(StorageKeys.MANAGED_POLICY_BASE_UPDATE_PERIOD, 60 * 2));

    /** @type {number} */
    const managedPolicyUpdateVariation = assertNumber(
        preferManaged_(StorageKeys.MANAGED_POLICY_UPDATE_VARIATION, 30));

    const globalBlacklist = new Acl({
      userEntries: userPrefs[StorageKeys.GLOBAL_BLACKLIST],
      managedEntries: managedPrefs[StorageKeys.GLOBAL_BLACKLIST],
      webserviceEntries: webserviceAcls[StorageKeys.GLOBAL_BLACKLIST],
      networkClass: networkClass,
    });

    /** @type {!Object<Profiles, !Acl>} */
    const acls = {
      [Profiles.CORPORATE]: new Acl({
        userEntries: userPrefs[StorageKeys.PRIV_WHITELIST],
        managedEntries: managedPrefs[StorageKeys.PRIV_WHITELIST],
        webserviceEntries: webserviceAcls[StorageKeys.PRIV_WHITELIST],
        networkClass: networkClass,
      }),
      [Profiles.REGULAR]: new Acl({
        userEntries: userPrefs[StorageKeys.REGULAR_WHITELIST],
        managedEntries: managedPrefs[StorageKeys.REGULAR_WHITELIST],
        webserviceEntries: webserviceAcls[StorageKeys.REGULAR_WHITELIST],
        networkClass: networkClass,
      }),
      [Profiles.ISOLATED]: new Acl({
        userEntries: userPrefs[StorageKeys.RISKY_WHITELIST],
        managedEntries: managedPrefs[StorageKeys.RISKY_WHITELIST],
        webserviceEntries: webserviceAcls[StorageKeys.RISKY_WHITELIST],
        networkClass: networkClass,
      })
    };

    /** @type {!Object<Profiles, !Acl>} */
    const blackLists = {
      [Profiles.CORPORATE]: new Acl({
        userEntries: userPrefs[StorageKeys.PRIV_BLACKLIST],
        managedEntries: managedPrefs[StorageKeys.PRIV_BLACKLIST],
        webserviceEntries: webserviceAcls[StorageKeys.PRIV_BLACKLIST],
        networkClass: networkClass
      }),
      [Profiles.REGULAR]: new Acl({
        userEntries: userPrefs[StorageKeys.REGULAR_BLACKLIST],
        managedEntries: managedPrefs[StorageKeys.REGULAR_BLACKLIST],
        webserviceEntries: webserviceAcls[StorageKeys.REGULAR_BLACKLIST],
        networkClass: networkClass
      }),
      [Profiles.ISOLATED]: new Acl({
        userEntries: userPrefs[StorageKeys.RISKY_BLACKLIST],
        managedEntries: managedPrefs[StorageKeys.RISKY_BLACKLIST],
        webserviceEntries: webserviceAcls[StorageKeys.RISKY_BLACKLIST],
        networkClass: networkClass
      })
    };

    let dtSettings = new Settings({
      thisProfile,
      defaultIsolated,
      incognitoIsolated,
      displayHandoffPage,
      managedPolicyUrl,
      managedPolicyBaseUpdatePeriod,
      managedPolicyUpdateVariation,
      managedPolicyETag,
      networkClass,
      acls,
      blackLists,
      globalBlacklist,
    });

    return dtSettings;
  }
}

exports = loadSettings;
