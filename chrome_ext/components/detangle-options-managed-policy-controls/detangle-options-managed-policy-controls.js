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
 * @fileoverview Container for managed-policy-related options/settings
 */

goog.require('detangle.StorageKeys');

Polymer({
  is: 'detangle-options-managed-policy-controls',

  properties: {
    lastUpdated: {type: Number, value: 0},
    thisProfile: {type: String},
    managedPolicyUrlUser: {type: String, value: ''},
    managedPolicyUrlManaged: {type: String, value: ''},
    lastUpdatedDisplay:
        {type: String, computed: 'computelastUpdatedDisplay(lastUpdated)'},
    showControls: {
      type: Boolean,
      computed:
          'computeControlsVisible(managedPolicyUrlManaged, managedPolicyUrlUser)'
    },
    updateInProgress: {type: Boolean, value: false},
    refreshDisabled: {
      type: Boolean,
      computed:
          'computeRefreshDisabled(updateInProgress, managedPolicyUrlManaged, managedPolicyUrlUser)'
    },
  },


  /**
   * formats lastUpdated based on locale for display. Returns
   * 'never' if not set.
   *
   * @param {number} lastUpdated millis since epoch
   * @return {string}
   */
  computelastUpdatedDisplay: function(lastUpdated) {
    if (!lastUpdated) {
      return 'never';
    }
    // forge has a fixed timezone/locale, so no hacks needed for testing
    var t = new Date(lastUpdated);
    return t.toLocaleTimeString() + ', ' + t.toLocaleDateString();
  },

  /**
   * Computes if the controls should be shown. Show nothing if the URL
   * is not set.
   *
   * @return {boolean}
   */
  computeControlsVisible: function() {
    return this.computeManagedPolicyUrlIsSet();
  },

  /**
   * Computes if the update managed policy button should be disabled.
   * If the URL is not set, or if an update is in progress, the button
   * should be disabled.
   *
   * @param {boolean} updateInProgress true if the update button has been pressed
   * @return {boolean}
   */
  computeRefreshDisabled(updateInProgress) {
    return (!this.computeManagedPolicyUrlIsSet()) || updateInProgress;
  },

  /**
   * Returns true if a managed policy URL is set in a relevant chrome.storage
   * location.
   *
   * @return {boolean}
   */
  computeManagedPolicyUrlIsSet() {
    return !!(this.managedPolicyUrlManaged || this.managedPolicyUrlUser);
  },

  /**
   * Asks the background page to refresh webservice ACLs.
   */
  refresh() {
    this.updateInProgress = true;
    chrome.runtime.sendMessage(
      {'command': 'refresh_webservice_acl'},
      response => { this.updateInProgress = false; }
    );
  },

  /**
   * Sets up the storage listener and retrieves initial values.
   * @override
   */
  ready() {
    /**
     * @param {!Object<string, !StorageChange>} changes
     * @param {string} areaName
     * @suppress {reportUnknownTypes}
     */
    const storageChanged = (changes, areaName) => {
      if (changes[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED]) {
        this.lastUpdated =
            changes[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED]
                .newValue ||
            0;
      }

      if (changes[detangle.StorageKeys.MANAGED_POLICY_URL]) {
        const /** string */ change =
            changes[detangle.StorageKeys.MANAGED_POLICY_URL].newValue || '';

        switch (areaName) {
          case 'local':
          case 'sync':
            this.managedPolicyUrlUser = change;
            break;
          case 'managed':
            this.managedPolicyUrlManaged = change;
            break;
        }
      }
    };

    chrome.storage.onChanged.addListener(storageChanged);
    this.updateValuesFromStorage();
  },

  /**
   * Fetches the existing values from managed and sync storage.
   *
   */
  updateValuesFromStorage: function() {
    var self = this;

    chrome.storage.sync.get(
        detangle.StorageKeys.MANAGED_POLICY_URL, function(items) {
          let val = stringValue(items);
          if (val) {
            self.managedPolicyUrlUser = val;
          }
        });
    chrome.storage.local.get(
        detangle.StorageKeys.MANAGED_POLICY_URL, function(items) {
          let val = stringValue(items);
          if (val) {
            self.managedPolicyUrlUser = val;
          }
        });
    chrome.storage.managed.get(
        detangle.StorageKeys.MANAGED_POLICY_URL,
        items => this.managedPolicyUrlManaged = stringValue(items));


    /**
     * @param {!Object<string, string>} items Retrieved items from storage.
     * @return {string}
     */
    function stringValue(items) {
      if (detangle.StorageKeys.MANAGED_POLICY_URL in items) {
        return items[detangle.StorageKeys.MANAGED_POLICY_URL];
      } else {
        return '';
      }
    }

    chrome.storage.local.get(
        detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED, function(items) {
          if (detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED in items) {
            self.lastUpdated =
                items[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED];
          }
        });
  },
});
