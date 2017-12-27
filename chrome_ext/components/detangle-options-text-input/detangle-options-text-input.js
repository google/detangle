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
 * @fileoverview A string input detangle option.
 */


Polymer({
  is: 'detangle-options-text-input',

  properties: {
    storageKey: {type: String, reflectToAttribute: true},
    readOnly: {type: Boolean, value: false},
    label: {type: String, reflectToAttribute: true},
    preferManaged: {type: Boolean, value: false},
    defaultValue: {type: String, value: ''},
    managedValue: {type: String, value: ''},
    userValue: {type: String, value: ''},
    displayValue: {
      type: String,
      computed:
          'computeValue(preferManaged, defaultValue, managedValue, userValue)'
    },
    disabled: {
      type: Boolean,
      computed: 'computeDisabled(preferManaged, managedValue, readOnly)'
    },
  },

  listeners: {'input.change': 'inputChanged'},

  observers: [
    'getValuesFromStorage(storageKey)',
  ],


  /**
   * Computes what the value of the input should be based on the current state.
   *
   * @param {boolean} preferManaged Whether the managed value is preferred over
   *     the user value
   * @param {string} defaultValue The default value, if neither user nor managed
   *     are non ''
   * @param {string} managedValue The state of the toggle in managed
   *     storage
   * @param {string} userValue The state of the toggle in sync
   *     storage
   * @return {string}
   */
  computeValue: function(preferManaged, defaultValue, managedValue, userValue) {
    if (userValue == '' && managedValue == '') {
      return defaultValue;
    } else if (preferManaged) {
      return managedValue != '' ? managedValue : userValue;
    } else {
      return userValue != '' ? userValue : managedValue;
    }
  },

  /**
   * Computes the disabled attribute based on the current state.
   *
   * @param {boolean} preferManaged Whether the managed value is preferred over
   *     the user value
   * @param {string} managedValue The state of the toggle in managed
   *     storage
   * @param {boolean} readOnly Whether the element was explictly marked
   *     read-only.
   * @return {boolean}
   */
  computeDisabled(preferManaged, managedValue, readOnly) {
    return readOnly || (preferManaged && !!managedValue);
  },

  /**
   * Sets up storage change listener.
   *
   * @override
   */
  ready() {
    /**
     * @param {!Object<string, !StorageChange>} changes
     * @param {string} areaName
     * @suppress {reportUnknownTypes}
     */
    const storageChanged = (changes, areaName) => {
      if (!this.storageKey) {
        return;
      }

      if (changes[this.storageKey]) {
        const /** string */ change = changes[this.storageKey].newValue || '';

        switch (areaName) {
          case 'sync':
            this.userValue = change;
            break;
          case 'managed':
            this.managedValue = change;
            break;
        }
      }
    };
    chrome.storage.onChanged.addListener(storageChanged);
  },

  /**
   * Gets the existing values from managed and sync storage.
   *
   * @param {!detangle.StorageKeys} storageKey Key that contains the values we
   *     want from the storage areas.
   */
  getValuesFromStorage: function(storageKey) {
    /**
     * @param {!Object<string, string>} items Retrieved items from storage.
     * @return {string}
     */
    const stringValue = items => {
      if (storageKey in items) {
        return items[storageKey];
      } else {
        return '';
      }
    };

    chrome.storage.managed.get(storageKey, items => {
      this.managedValue = stringValue(items);
    });
    chrome.storage.sync.get(storageKey, items => {
      this.userValue = stringValue(items);
    });
  },


  /**
   * Handles the "change" event on the embedded paper-input (only triggered
   * by user interation).
   * NOTE: The user has to click away from the textbox for it to be applied.
   *
   * @suppress {reportUnknownTypes}
   * @param {!Event} e Event object
   */
  inputChanged: function(e) {
    var items = {};
    items[this.storageKey] = this.$.input.value;
    chrome.storage.sync.set(items);
  },
});
