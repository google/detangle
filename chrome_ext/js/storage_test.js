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
 * @fileoverview Tests for storage.js
 */

'use strict';

goog.setTestOnly();


goog.require('detangle.PromiseStorageArea');
goog.require('detangle.test');
goog.require('goog.testing.jsunit');


/** @type {!detangle.PromiseStorageArea} */
var promiseStorageArea;


/**
 * @public
 */
function setUp() {
  detangle.test.setupChromeTests();
  promiseStorageArea = new detangle.PromiseStorageArea(chrome.storage.local);
}


/**
 * @public
 * @return {!Promise}
 */
function testGetAllEmpty() {
  return promiseStorageArea.get().then(function(items) {
    assertObjectEquals({}, items);
  });
}


/**
 * @public
 * @return {!Promise}
 */
function testGetSpecificEmpty() {
  return promiseStorageArea.get('something').then(function(items) {
    assertObjectEquals({}, items);
  });
}


/**
 * @public
 * @return {!Promise}
 */
function testGetMultipleEmpty() {
  return promiseStorageArea.get(['a', 'b', 'c']).then(function(items) {
    assertObjectEquals({}, items);
  });
}


/**
 * @public
 * @return {!Promise}
 */
function testSetAndRetrieve() {
  return promiseStorageArea.set({testkey: 'testvalue'})
      .then(function() { return promiseStorageArea.get('testkey'); })
      .then(function(items) {
        assertObjectEquals({testkey: 'testvalue'}, items);
      });
}


/**
 * @public
 * @return {!Promise}
 */
function testGetValueSpecificEmpty() {
  return promiseStorageArea.getValue('something').then(function(value) {
    assertUndefined(value);
  });
}


/**
 * @public
 * @return {!Promise}
 */
function testGetValueSpecificValue() {
  detangle.test.fakeLocalStorage['something'] = 'a thing';
  return promiseStorageArea.getValue('something').then(function(value) {
    assertEquals('a thing', value);
  });
}


/**
 * @public
 * @return {!Promise}
 */
function testSetFailed() {
  chrome.runtime.lastError = new Error('test failure');

  return promiseStorageArea.set({testkey: 'testvalue'})
      .then(fail, function(error) {
        assertEquals('test failure', error.message);
      });
}


/**
 * @public
 * @return {!Promise}
 */
function testRemove() {
  detangle.test.fakeLocalStorage['thing1'] = 'a thing';
  detangle.test.fakeLocalStorage['thing2'] = 'another thing';

  return promiseStorageArea.remove(['thing2'])
      .then(function() { return promiseStorageArea.get(); })
      .then(function(items) {
        assertEquals('a thing', items['thing1']);
        assertUndefined(items['thing2']);
      });
}
