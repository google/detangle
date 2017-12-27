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
 * @fileoverview A togglable (boolean) detangle option.
 */

goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.ToggleSetting');
goog.require('detangle.ToggleSettings');


/**
 * Toggle values have 3 possible settings in storage - not set (aka undefined),
 * true and false.
 *
 * @private
 * @enum {number}
 */
const Toggled_ = {
  NOT_SET: -1,
  FALSE: 0,
  TRUE: 1
};


Polymer({
  is: 'detangle-options-toggle',

  properties: {
    storageKey: {type: String, reflectToAttribute: true},
    thisProfile: {type: String},
    readOnly: {type: Boolean, value: false},
    label:
        {type: String, computed: 'computeLabel(defaultLabel, overrideLabel)'},
    defaultLabel: {type: String, value: ''},
    overrideLabel: {type: String, value: ''},
    preferManaged: {type: Boolean},
    checkedByDefault: {type: Boolean},
    managedValue: {type: Number},
    userValue: {type: Number},
    checked: {
      type: Boolean,
      notify: true,
      computed:
          'computeChecked(preferManaged, checkedByDefault, managedValue, userValue)'
    },
    disabled: {
      type: Boolean,
      computed: 'computeDisabled(preferManaged, managedValue, readOnly)'
    },
  },

  listeners: {'checkbox.change': 'checkboxChanged'},

  observers: [
    'setToggleSettings(storageKey)',
    'getValuesFromStorage(storageKey, thisProfile)',
  ],

  /**
   * Configures attributes based on ToggleSettings.
   *
   * @param {detangle.StorageKeys} storageKey Key for storage items containing
   *      the toggle's values.
   */
  setToggleSettings: function(storageKey) {
    /** @type {(detangle.ToggleSetting|undefined)} */
    const toggleSettings = detangle.ToggleSettings[storageKey];
    if (!toggleSettings) {
      throw new Error('No ToggleSettings for ' + storageKey);
    }

    this.defaultLabel = toggleSettings.label;
    this.preferManaged = toggleSettings.preferManaged;
    this.checkedByDefault = toggleSettings.default;
  },

  /**
   * Computes the checked attribute based on the current state.
   *
   * @param {boolean} preferManaged Whether the managed value is preferred over
   *     the user value
   * @param {boolean} checkedByDefault Whether the absence of a managed and user
   *     value results in the checkbox being checked.
   * @param {Toggled_} managedValue The state of the toggle in managed
   *     storage
   * @param {Toggled_} userValue The state of the toggle in sync
   *     storage
   * @return {boolean}
   */
  computeChecked: function(
      preferManaged, checkedByDefault, managedValue, userValue) {
    if (userValue == Toggled_.NOT_SET && managedValue == Toggled_.NOT_SET) {
      return checkedByDefault;
    } else if (preferManaged) {
      return managedValue == Toggled_.NOT_SET ? userValue == Toggled_.TRUE :
                                                managedValue == Toggled_.TRUE;
    } else {
      return userValue == Toggled_.NOT_SET ? managedValue == Toggled_.TRUE :
                                             userValue == Toggled_.TRUE;
    }
  },

  /**
   * Computes the disabled attribute based on the current state.
   *
   * @param {boolean} preferManaged Whether the managed value is preferred over
   *     the user value
   * @param {Toggled_} managedValue The state of the toggle in managed
   *     storage
   * @param {boolean} readOnly Whether the element was explictly marked
   *     read-only.
   * @return {boolean}
   */
  computeDisabled: function(preferManaged, managedValue, readOnly) {
    return readOnly || (preferManaged && managedValue != Toggled_.NOT_SET);
  },

  /**
   * Adds a storage listener and gets current value from storage.
   * @override
   */
  ready: function() {
    chrome.storage.onChanged.addListener(storageChanged.bind(this));

    /**
     * @param {!Object<string, !StorageChange>} changes
     * @param {string} areaName
     * @suppress {reportUnknownTypes}
     */
    function storageChanged(changes, areaName) {
      if (!this.storageKey) {
        return;
      }

      /** @type {number} */
      var change;

      if (this.storageKey in changes) {
        if ('newValue' in changes[this.storageKey]) {
          change = changes[this.storageKey].newValue ? Toggled_.TRUE :
                                                       Toggled_.FALSE;
        } else {
          change = Toggled_.NOT_SET;
        }

        switch (areaName) {
          case 'local':
          case 'sync':
            this.userValue = change;
            break;
          case 'managed':
            this.managedValue = change;
            break;
        }
      }
    }
  },

  /**
   * Gets the existing values from managed and sync storage.
   *
   * @param {detangle.StorageKeys} storageKey Key that contains the values we
   *     want from the storage areas.
   * @param {detangle.Profiles} thisProfile Profile that we're currently
   *     operating in.
   */
  getValuesFromStorage: function(storageKey, thisProfile) {
    chrome.storage.managed.get(
        storageKey, items => this.managedValue = toggleValue(items));
    if (thisProfile == detangle.Profiles.CORPORATE) {
      chrome.storage.sync.get(
          storageKey, items => this.userValue = toggleValue(items));
    } else {
      chrome.storage.local.get(
          storageKey, items => this.userValue = toggleValue(items));
    }

    /**
     * @param {!Object<string, boolean>} items Retrieved items from storage.
     * @return {Toggled_}
     */
    function toggleValue(items) {
      if (storageKey in items) {
        return items[storageKey] ? Toggled_.TRUE : Toggled_.FALSE;
      } else {
        return Toggled_.NOT_SET;
      }
    }
  },


  /**
   * Handles the "change" event on the embedded paper-checkbox (only triggered
   * by user interation).
   *
   * @param {!Event} e Event object
   * @suppress {reportUnknownTypes}
   */
  checkboxChanged: function(e) {
    var items = {};
    items[this.storageKey] = this.$.checkbox.checked;
    chrome.storage.sync.set(items);
  },

  /**
   * Chooses the correct label to use.
   *
   * @param {string} defaultLabel The label value from common.js.
   * @param {string} overrideLabel The label value set from outer html.
   * @return {string}
   */
  computeLabel: function(defaultLabel, overrideLabel) {
    return overrideLabel || defaultLabel;
  },
});
