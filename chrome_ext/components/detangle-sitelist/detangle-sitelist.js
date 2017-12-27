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
 * @fileoverview Description of this file.
 */

goog.require('detangle.AclEntryTags');
goog.require('detangle.PromiseStorageArea');
goog.require('detangle.StorageKeys');
goog.require('detangle.getLocalStorage');
goog.require('detangle.getManagedStorage');
goog.require('detangle.getPrefsStorage');
goog.require('detangle.matchpatterns');


Polymer({
  is: 'detangle-sitelist',

  properties: {
    storageKey: {type: String},
    storageArea: {type: String},
    readOnly: {type: Boolean, value: false},
    patterns: {type: Array},
    calcReadOnly:
        {type: Boolean, computed: 'computeReadOnly(storageArea, readOnly)'},
  },

  observers: ['loadStorage(storageKey, storageArea)'],

  listeners: {
    'delete': 'onDelete',
  },

  /**
   * Gets a PromiseStorageArea for the named storageArea.
   *
   * Throws an Error of the supplied storageArea name is invalid.
   *
   * @param {string} storageArea One of ('managed', 'local', 'sync')
   * @return {!detangle.PromiseStorageArea}
   */
  getStorageArea_: function(storageArea) {
    switch (storageArea) {
      case 'managed':
        return detangle.getManagedStorage();
      case 'sync':
        return detangle.getPrefsStorage();
      case 'local':
        return detangle.getLocalStorage();
      default:
        throw new Error('Invalid storage area: ' + storageArea);
    }
  },

  /**
   * Loads items from the storage area.
   *
   * @suppress {reportUnknownTypes}
   * @param {detangle.StorageKeys} storageKey Key containing a list of
   *     matchpatterns.
   * @param {string} storageArea The name of the storage area (must be one of
   *     'managed', 'sync', 'local')
   * @return {!Promise}
   */
  loadStorage(storageKey, storageArea) {
    chrome.storage.onChanged.addListener(this.onStorageChanged.bind(this));

    const storage = this.getStorageArea_(storageArea);
    if (storageArea == 'managed') {
      return storage.getValue(storageKey)
          .then(managedStoragePatterns => managedStoragePatterns || [])
          .then(managedStoragePatterns => {
            return detangle.getLocalStorage()
                .getValue(detangle.StorageKeys.CACHED_WEBSERVICE_ACL)
                .then(cached => cached && cached[storageKey] || [])
                .then(
                    cachedPatterns =>
                        managedStoragePatterns.concat(cachedPatterns));
          })
          .then(allManagedPatterns => {
            this.patterns = allManagedPatterns;
          });
    }

    return storage.getValue(storageKey)
        .then(patterns => this.patterns = patterns || []);
  },

  /**
   * Handles the chrome.storage.onChanged event.
   *
   * @suppress {reportUnknownTypes}
   * @param {!Object<string, !StorageChange>} changes Keys that have changed
   * @param {string} areaName Storage area that changed
   */
  onStorageChanged(changes, areaName) {
    if (areaName == this.storageArea && this.storageKey in changes) {
      this.patterns = changes[this.storageKey].newValue || [];
    }
  },

  /**
   * Handles the delete event fired by a detangle-site element.
   *
   * @suppress {checkTypes,reportUnknownTypes}
   * @param {!Event} e The Event object
   * @return {!Promise}
   */
  onDelete(e) {
    const matchType = e.detail.matchType;
    const pattern = e.detail.pattern;
    const storage = this.getStorageArea_(this.storageArea);
    const items = {};
    items[this.storageKey] =
        this.patterns.filter(x => !(x.type == matchType && x.value == pattern));
    return storage.set(items);
  },


  /**
   * Compares ACL entries for sorting.
   *
   * @param {{type: string, value: string}} a
   * @param {{type: string, value: string}} b
   * @return {number}
   */
  compareAclEntries(a, b) {
    if (a.type == b.type) {
      if (a.type == detangle.AclEntryTags.MATCHPATTERN) {
        return detangle.matchpatterns.compareMatchPatterns(a.value, b.value);
      } else {
        return a.value.localeCompare(b.value);
      }
    } else {
      return a.type.localeCompare(b.type);
    }
  },


  /**
   * Computes whether we're read-only depending on the storage area and the
   * readOnly attribute.
   *
   * @param {string} storageArea The storage area we're using
   * @param {boolean} readOnly The readOnly setting
   * @return {boolean}
   */
  computeReadOnly: function(storageArea, readOnly) {
    return readOnly || storageArea == 'managed';
  },
});
