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
 * @fileoverview Common code for tests.
 */

'use strict';

// Make checking chrome.runtime.lastError not crash when we're not an crext
goog.provide('detangle.test');

goog.require('goog.async.nextTick');
goog.require('goog.object');


/**
 * @package
 * @suppress {checkTypes,const}
 */
detangle.test.setupChromeTests = function() {
  detangle.test.fakeLocalStorage = {};
  detangle.test.fakeManagedStorage = {};
  detangle.test.fakeSyncStorage = {};
  detangle.test.changedEventListeners_ = [];

  function stub(name) {
    var ns = goog.global;
    var nameComponents = name.split('.');
    var functionName = nameComponents.pop();

    // Crawl and create object heirachy
    nameComponents.forEach(function(component) {
      if (!(component in ns)) {
        ns[component] = {};
      }
      ns = ns[component];
    });

    // Stub the function with a fail() call - override with mocks to prevent
    // failure.
    ns[functionName] = function(var_args) { fail('Call to stub ' + name); };
  }

  goog.global.chrome = {
    storage: {
      local: new detangle.test.ObjectBackedStorageArea(
          detangle.test.fakeLocalStorage, 'local'),
      managed: new detangle.test.ObjectBackedStorageArea(
          detangle.test.fakeManagedStorage, 'managed', true),
      sync: new detangle.test.ObjectBackedStorageArea(
          detangle.test.fakeSyncStorage, 'sync'),
      onChanged: {
        addEventListener: function(cb) {
          detangle.test.changedEventListeners_.push(cb);
        }
      },
    },
  };

  stub('chrome.notifications.create');
  stub('chrome.runtime.getURL');
  stub('chrome.runtime.sendMessage');
  stub('chrome.runtime.sendNativeMessage');
  stub('chrome.tabs.create');
  stub('chrome.tabs.executeScript');
  stub('chrome.tabs.get');
  stub('chrome.tabs.remove');
  stub('chrome.tabs.update');
  stub('chrome.webRequest.handlerBehaviorChanged');
  stub('chrome.windows.update');
  stub('chrome.windows.getCurrent');
};


/**
 * Like chrome.storage.local, but backed by a mutable Object.
 *
 * You can modify and inspect the object in the background (if you pass one to
 * the constructor).  It is expected that if you do so that you'll also take
 * responsibility for firing the onChanged listeners.
 *
 * TODO(michaelsamuel): Move this to test code once we no longer need it in
 * extension code (likely to be once we're using chrome.storage.managed).
 *
 * @final
 * @package
 */
detangle.test.ObjectBackedStorageArea = class {
  /**
   * @param {!Object} contents Object to be used as backing store
   * @param {string} unused_name Name of the faked space (local|managed|sync)
   * @param {boolean=} opt_readonly If true, set will be readonly
   */
  constructor(contents, unused_name, opt_readonly) {
    /**
     * @type {!Object}
     * @private
     */
    this.storage_ = contents;

    /**
     * @type {string}
     * @private
     */
    // this.name_ = name;

    /**
     * @type {boolean}
     * @private
     */
    this.readonly_ = !!opt_readonly;
  }

  /**
   * Get some items from the StorageArea.
   *
   * Note that type annotations are wrong because the parent class's type
   * annotations are wrong.
   *
   * @param {?(string|Array<string>)} keys key {string}, keys {Array} to be
   *     retrieved from storage. {null} to retrieve all.
   * @param {!function(!Object)} callback Function to receive data
   */
  get(keys, callback) {
    /** @type {!Object<string,?>} */
    var ret;

    if (keys == null) {
      ret = goog.object.clone(this.storage_);
    } else {
      ret = {};

      if (goog.isString(keys)) {
        keys = [keys];
      }

      keys.forEach(function(key) {
        if (key in this.storage_) {
          ret[key] = this.storage_[key];
        }
      }, this);
    }

    if (callback) {
      setTimeout(() => callback(ret), 0);
    }
  }

  /**
   * @param {!Object<string,?>} items key/value pairs to be set
   * @param {function()=} opt_callback Function to be called when done
   */
  set(items, opt_callback) {
    if (this.readonly_) {
      chrome.runtime.lastError =
          new Error('Attempt to write to read-only storage');
      try {
        opt_callback();
      } finally {
        delete chrome.runtime.lastError;
      }
    } else {
      goog.object.extend(this.storage_, items);
      if (opt_callback) {
        goog.async.nextTick(opt_callback);
      }
    }
    // TODO(michaelsamuel): fire onChanged listeners
  }

  /**
   * @param {(string|!Array<string>)} keys key {string}, keys {Array} to be
   *     removed from storage.
   * @param {function()=} opt_callback Callback fired when keys removed.
   */
  remove(keys, opt_callback) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    if (this.readonly_) {
      chrome.runtime.lastError =
          new Error('Attempt to remove items from read-only storage');
      try {
        opt_callback();
      } finally {
        delete chrome.runtime.lastError;
      }
    } else {
      for (let k in keys) {
        delete this.storage_[k];
      }
      if (opt_callback) {
        goog.async.nextTick(opt_callback);
      }
    }
  }
};
