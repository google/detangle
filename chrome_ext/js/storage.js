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
 * @fileoverview Wrapper for the chrome.storage API supporting Promises.
 */

'use strict';


goog.provide('detangle.PromiseStorageArea');
goog.provide('detangle.getLocalStorage');
goog.provide('detangle.getManagedStorage');
goog.provide('detangle.getPrefsStorage');


/**
 * A lightweight wrapper around the {StorageArea} api, but with Promises.
 *
 * https://developer.chrome.com/extensions/storage#type-StorageArea
 *
 * @final
 */
detangle.PromiseStorageArea = class {
  /**
   * @param {!StorageArea} storageArea Storage area to wrap
   */
  constructor(storageArea) {
    /** @private {!StorageArea} */
    this.storageArea_ = storageArea;
  }

  /**
   * Gets a list of items from the storage area.
   *
   * @package
   * @param {(string|!Array<!string>)=} opt_keys Keys to retrieve - if not
   *     specified all keys are retrieved.
   * @return {!Promise<!Object<string, ?>>}
   */
  get(opt_keys) {
    return new Promise(
        (resolve, reject) =>
            this.storageArea_.get(opt_keys || null, function(items) {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(items);
              }
            }));
  }


  /**
   * Retrieves the value of exactly one key from storage.
   *
   * @param {string} key A single key to retrieve
   * @return {!Promise<?>} A promise to return the value associated with key
   */
  getValue(key) {
    return this.get(key).then(function(items) { return items[key]; });
  }


  /**
   * Adds or replaces items in the storage area.
   *
   * @param {!Object<string, ?>} items Key/Value pairs to be added/replaced
   * @return {!Promise}
   */
  set(items) {
    return new Promise(
        (resolve, reject) => this.storageArea_.set(items, function() {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }));
  }


  /**
   * Removes keys and associated values from storage area.
   *
   * @param {(string|!Array<string>)} keys Keys to remove.
   * @return {!Promise}
   */
  remove(keys) {
    return new Promise(
        (resolve, reject) => this.storageArea_.remove(keys, function() {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }));
  }
};


/**
 * Gets a PromiseStorageArea wrapping chrome.storage.local.
 *
 * @return {!detangle.PromiseStorageArea}
 */
detangle.getLocalStorage = function() {
  return new detangle.PromiseStorageArea(chrome.storage.local);
};


/**
 * Gets a PromiseStorageArea wrapping chrome.storage.sync.
 *
 * @return {!detangle.PromiseStorageArea}
 */
detangle.getPrefsStorage = function() {
  return new detangle.PromiseStorageArea(chrome.storage.sync);
};


/**
 * Gets a PromiseStorageArea wrapping chrome.storage.managed.
 *
 * @return {!detangle.PromiseStorageArea}
 */
detangle.getManagedStorage = function() {
  return new detangle.PromiseStorageArea(chrome.storage.managed);
};
