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
 * @fileoverview Container for troubleshooting code
 */

goog.require('detangle.StorageKeys');

Polymer({
  is: 'detangle-troubleshooting',

  properties: {
    /**
     * Number of seconds since webservice was fetched.
     *
     * @type {number}
     */
    lastUpdated_: {
      type: Number,
      value: 0,
    },
    /**
     * URL stored in managed storage, from which to fetch managed policy.
     *
     * @type {(string|undefined)}
     */
    managedPolicyUrlManaged: {
      type: String,
      notify: true,
    },
    /**
     * Operating system the extension is running on.
     *
     * @type {(string|undefined)}
     */
    platform: {
      type: String,
      notify: true,
    },

    /**
     * If true, the checklist will be shown in the component
     *
     * @type {boolean}
     */
    showSummary: {
      type: Boolean,
      value: true,
    },

    /**
     * The icon to be shown for the OS package checklist item.
     *
     * @type {(string|undefined)}
     */
    osPackageStatusIcon_: {
      type: String,
      computed: 'computeOsPackageStatusIcon(managedPolicyUrlManaged)',
    },
    /**
     * The icon to be shown for the updated successfully checklist item.
     *
     * @type {(string|undefined)}
     */
    updatedFromWebserviceStatusIcon_: {
      type: String,
      computed: 'computeUpdatedFromWebserviceStatusIcon(lastUpdated_)',
    },
    /**
     * The icon to be shown for the platform supported checklist item.
     *
     * @type {(string|undefined)}
     */
    supportedOSStatusIcon_: {
      type: String,
      computed: 'computeSupportedOSStatusIcon(platformSupported)',
    },
    /**
     * A string representing the kind of advice we should show to the user.
     *
     * @type {(string|undefined)}
     */
    recommendationKind: {
      type: String,
      notify: true,
      computed:
          'computeRecommendationKind(managedPolicyUrlManaged, lastUpdated_, platform)',
    },
    /**
     * Indicates whether any managed configuration exists for the extension.
     *
     * @type {boolean}
     */
    haveManagedPolicy: {
      type: Boolean,
      notify: true,
    },
    /**
     * Indicates whether the OS is supported.
     *
     * @type {(boolean|undefined)}
     */
    platformSupported: {
      type: Boolean,
      notify: true,
      computed: 'computePlatformSupported(platform)',
    },
  },

  /**
   * Returns a string symbolizing the kind of recommendation which should be
   * surfaced.
   *
   * @param {(string|undefined)} managedPolicyUrlManaged
   * @param {number} lastUpdated_
   * @param {(string|undefined)} platform
   * @return {string}
   */
  computeRecommendationKind(managedPolicyUrlManaged, lastUpdated_, platform) {
    if (platform == 'cros') {
      return 'platform-partially-supported';
    }

    if (!this.computePlatformSupported(platform)) {
      return 'platform-unsupported';
    }

    if (!managedPolicyUrlManaged) {
      switch (platform) {
        case 'linux':
          return 'install-linux';
        case 'mac':
          return 'install-mac';
        case 'win':
          return 'install-win';
      }
    }

    if (!lastUpdated_) return 'force-webservice';

    return 'ok';
  },


  /**
   * Returns true if the OS is supported.
   *
   * @param {(string|undefined)} platform
   * @return {boolean}
   */
  computePlatformSupported(platform) {
    return ['win', 'linux', 'mac'].includes(platform);
  },

  /**
   * Returns the icon for supported operating systems.
   *
   * @param {boolean} platformSupported
   * @return {string}
   */
  computeSupportedOSStatusIcon(platformSupported) {
    return platformSupported ? 'check' : 'close';
  },

  /**
   * Returns the icon for OS package installation.
   *
   * @param {(string|undefined)} managedPolicyUrlManaged
   * @return {string}
   */
  computeOsPackageStatusIcon(managedPolicyUrlManaged) {
    return managedPolicyUrlManaged ? 'check' : 'close';
  },

  /**
   * Returns the icon for successful sync from webservice.
   *
   * @param {number} lastUpdated_
   * @return {string}
   */
  computeUpdatedFromWebserviceStatusIcon(lastUpdated_) {
    if (lastUpdated_ > 0) {
      return 'check';
    }
    return 'close';
  },

  /**
   * Whether to show a recommendation.
   *
   * @param {string|undefined} recommendation
   * @param {string|undefined} section
   * @return {boolean}
   */
  shouldShowRecommendation(recommendation, section) {
    return recommendation == section;
  },

  /**
   * @override
   */
  ready() {
    chrome.runtime.getPlatformInfo(
        (platformInfo) => this.platform = platformInfo['os']);

    /**
     * @param {!Object<string, !StorageChange>} changes
     * @param {string} areaName
     * @suppress {reportUnknownTypes}
     */
    const storageChanged = (changes, areaName) => {
      if (changes[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED]) {
        this.lastUpdated_ =
            changes[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED]
                .newValue ||
            0;
      }

      if (areaName == 'managed') {
        this.checkHaveManagedPolicy();
        if (changes[detangle.StorageKeys.MANAGED_POLICY_URL]) {
          this.managedPolicyUrlManaged =
              changes[detangle.StorageKeys.MANAGED_POLICY_URL].newValue || '';
        }
      }
    };
    chrome.storage.onChanged.addListener(storageChanged);

    this.updateValuesFromStorage();
  },


  /**
   * Populates the haveManagedPolicy property.
   * @suppress {reportUnknownTypes}
   */
  checkHaveManagedPolicy() {
    chrome.storage.managed.get(items => {
      this.haveManagedPolicy = Object.keys(items).length > 0;
    });
  },

  /**
   * Fetches the existing values from managed and sync storage.
   * @suppress {reportUnknownTypes}
   */
  updateValuesFromStorage() {
    var self = this;
    this.checkHaveManagedPolicy();

    chrome.storage.managed.get(
        detangle.StorageKeys.MANAGED_POLICY_URL,
        items => this.managedPolicyUrlManaged =
            items[detangle.StorageKeys.MANAGED_POLICY_URL] || '');

    chrome.storage.local.get(
        detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED, function(items) {
          if (detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED in items) {
            self.lastUpdated_ =
                items[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED];
          }
        });
  },
});
