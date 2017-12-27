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

/**
 * @fileoverview The options page
 */

goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.ThemeIds');
goog.require('detangle.utils');


Polymer({
  is: 'detangle-options',

  properties: {
    /**
     * The profile we're currently operating in.
     * @type {string|undefined}
     */
    thisProfile: {
      type: String,
    },

    /**
     * Whether the options page is read-only.
     * @type {boolean}
     */
    readOnly: {
      type: Boolean,
      value: true,
      computed: 'computeReadOnly(thisProfile)',
    },

    /**
     * Which options page is currently selected.
     */
    selectedPage: {
      type: Number,
      value: 0,
    },

    /**
     * Which options toggles to display on the Global Settings page.
     * @type {!Array<!detangle.StorageKeys>}
     * @const
     */
    optionsToggles: {
      type: Array,
      value: [
        detangle.StorageKeys.DEFAULT_SANDBOX,
        detangle.StorageKeys.INCOGNITO_SANDBOX,
        detangle.StorageKeys.DISPLAY_HANDOFF_PAGE,
      ],
    },

    /**
     * Which "profiles" exist.
     * @type {!Array<!detangle.Profiles>}
     * @const
     */
    profiles: {
      type: Array,
      value: [
        detangle.Profiles.CORPORATE,
        detangle.Profiles.REGULAR,
        detangle.Profiles.ISOLATED,
      ],
    },

    /**
     * Which profile to display/edit the ACL for.
     */
    sitesProfile: {
      type: String,
      value: detangle.Profiles.CORPORATE,
    },

    /**
     * Which storage area to read/write user ACLs from.
     */
    sitesStorageArea: {
      type: String,
      value: 'sync',
    },

    /**
     * Whether detangle is configured yet.
     */
    configured: {
      type: Boolean,
      value: false,
      computed: 'isConfigured(thisProfile)',
    },

    /**
     * Whether we have any managed policy.
     */
    haveManagedPolicy: {
      type: Boolean,
      value: true,
    },

    /**
     * Whether detangle is running on a supported OS platform.
     */
    platformSupported: {
      type: Boolean,
      value: true,
    },

    /**
     * Whether we have install problems.
     */
    hasInstallProblems: {
      type: Boolean,
      computed:
          'computeHasInstallProblems(platformSupported, haveManagedPolicy)',
    },
  },

  listeners: {
    'setup.tap': 'configureAsCorporate',
    'resync.tap': 'sendResyncCommand',
  },

  /**
   * Computes whether there was an install problem.
   * @param {boolean} platformSupported
   * @param {boolean} haveManagedPolicy
   * @return {boolean}
   */
  computeHasInstallProblems: function(platformSupported, haveManagedPolicy) {
    return !platformSupported || !haveManagedPolicy;
  },

  /**
   * Computes whether the options page should be read-only.
   * @param {string} thisProfile The profile that we're operating in
   * @return {boolean}
   */
  computeReadOnly: function(thisProfile) {
    return thisProfile != detangle.Profiles.CORPORATE;
  },

  /**
   * Opens the add ACL dialog.
   * @suppress {reportUnknownTypes}
   */
  addAcl: function() {
    this.$.addDialog.open();
  },

  /**
   * Computes the human-readable label for a profile.
   * @param {string} profile A profile to get the label for
   * @return {string}
   */
  computeProfileLabel: function(profile) {
    return detangle.utils.computeProfileLabel(profile);
  },

  /**
   * Gets the storage key for the whitelist covering the profile.
   * @param {string} profile The profile to get the storage key for
   * @return {!detangle.StorageKeys}
   */
  computeStorageKey: function(profile) {
    return detangle.utils.computeAclStorageKey(
        /** @type {!detangle.Profiles} */ (profile));
  },

  /**
   * Computes whether Detangle is configured yet.
   * @param {string} profile The current profile
   * @return {boolean}
   */
  isConfigured: function(profile) {
    return !!profile;
  },

  /**
   * Configures detangle to operate as the Corporate browser.
   */
  configureAsCorporate: function() {
    var items = {
      [detangle.StorageKeys.THIS_PROFILE]: detangle.Profiles.CORPORATE,
    };
    chrome.storage.local.set(items);
  },

  /**
   * Sends the resync command to the background page.
   */
  sendResyncCommand: function() {
    chrome.runtime.sendMessage({'command': 'resync'}, console.log);
  },

  /**
   * Gets the storage area that holds preferences for the current profile.
   * @param {string} thisProfile The profile we're operating in.
   * @return {string}
   */
  prefsStorageArea: function(thisProfile) {
    return thisProfile == detangle.Profiles.CORPORATE ? 'sync' : 'local';
  },

  /**
   * Gets the URL for the per-profile recommended theme.
   *
   * @param {(string|undefined)} thisProfile The profile we want a theme for.
   * @return {string}
   */
  getRecommendedThemeUrl: function(thisProfile) {
    let themeId = detangle.ThemeIds[thisProfile || ''] ||
        detangle.ThemeIds[detangle.Profiles.ISOLATED];
    return 'https://chrome.google.com/webstore/detail/' + themeId;
  },
});
