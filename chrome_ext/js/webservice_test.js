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
 * @fileoverview Tests for webservice.js
 */

'use strict';

goog.setTestOnly();


goog.require('detangle.StorageKeys');
goog.require('detangle.fetchFromWebService');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');


// No jsdoc because jscompiler gets angry at calling mocks
var mockControl;


function setUp() {
  mockControl = new goog.testing.MockControl();
}


function tearDown() {
  mockControl.$tearDown();
}


/**
 * Returns a controllable double we can use to stand in for XMLHttpRequest,
 * and react to methods in ways we specify. Cleaner than using mockControl.
 * @private
 */
class XHRDouble_ {
  constructor() {
    this.method = '';
    this.url = '';
    this.cache = false;
    this.status = 200;
    this.responseText = '';
    this.statusText = 'OK';
    this.didSend = false;
    this.eventListeners = {};
    this.responseHeaders = {};
    this.requestHeaders = {};
  }

  /**
   * Mocks opening the XHR connection.
   *
   * @param {string} method
   * @param {string} url
   */
  open(method, url) {
    this.method = method;
    this.url = url;
  }

  /**
   * Sets the response we want to pretend the server sent.
   *
   * @param {number} statusCode
   * @param {string} responseText
   * @param {string} statusText
   */
  setResponse(statusCode, responseText, statusText) {
    this.status = statusCode;
    this.responseText = responseText;
    this.statusText = statusText;
  }

  /**
   * Immitate the XMLHttpRequest send() method.
   */
  send() {
    this.didSend = true;
    this.eventListeners['load']();
  }

  /**
   * Adds an event listener.
   *
   * @param {string} event Name of the event.
   * @param {!Function} cb The callback to fire when the event is triggered.
   */
  addEventListener(event, cb) {
    this.eventListeners[event] = cb;
  }

  /**
   * Gets a specific response header.
   *
   * @param {string} header Name of the header to get.
   * @return {?string}
   */
  getResponseHeader(header) {
    return this.responseHeaders[header] || null;
  }

  /**
   * Sets a request header.
   *
   * @param {string} headerName
   * @param {string} headerValue
   */
  setRequestHeader(headerName, headerValue) {
    this.requestHeaders[headerName] = headerValue;
  }
}


/**
* Make sure JSON is parsed and passed through the promise correctly.
* Test the case where the webservice is presenting XSSI protection.
* @public
* @return {!Promise}
*/
function testFetchFromWebserviceSuccessfulDownloadWithXSSIProtection() {
  const ourXhrDouble = new XHRDouble_();
  ourXhrDouble.setResponse(200, ')]}\'\n{"priv": []}', 'OK');
  ourXhrDouble.responseHeaders['ETag'] = '"abcd"';

  return detangle.fetchFromWebService('test_url', null, ourXhrDouble)
      .then(function(data) {
        assertTrue(data['priv'] instanceof Array);
        assertEquals('"abcd"', data[detangle.StorageKeys.MANAGED_POLICY_ETAG]);
        assertEquals(
            'test_url', data[detangle.StorageKeys.MANAGED_POLICY_SOURCE]);
        assertEquals('test_url', ourXhrDouble.url);
        assertObjectEquals({}, ourXhrDouble.requestHeaders);
        assertTrue(ourXhrDouble.didSend);
      });
}

/**
 * Make sure the If-None-Match header is passed if we present an ETag.
 * @public
 * @return {!Promise}
 */
function testFetchFromWebserviceETagSupplied() {
  const ourXhrDouble = new XHRDouble_();
  ourXhrDouble.setResponse(200, ')]}\'\n{"priv": []}', 'OK');
  ourXhrDouble.responseHeaders['ETag'] = '"abcd"';

  return detangle.fetchFromWebService('test_url', '"dcba"', ourXhrDouble)
      .then(function(data) {
        assertTrue(data['priv'] instanceof Array);
        assertEquals('"abcd"', data[detangle.StorageKeys.MANAGED_POLICY_ETAG]);
        assertEquals(
            'test_url', data[detangle.StorageKeys.MANAGED_POLICY_SOURCE]);
        assertEquals('test_url', ourXhrDouble.url);
        assertEquals('"dcba"', ourXhrDouble.requestHeaders['If-None-Match']);
        assertTrue(ourXhrDouble.didSend);
      });
}

/**
* Make sure an error case on the network propergates through the promise as intended.
* @public
* @return {!Promise}
*/
function testFetchFromWebserviceUnauthorized() {
  const ourXhrDouble = new XHRDouble_();
  ourXhrDouble.setResponse(401, '', '401 Unauthorized');

  return detangle.fetchFromWebService('test_url', null, ourXhrDouble)
      .then(
          function(data) {
            fail('Fetch should have failed');
          },
          function(error) {
            assertEquals(error['status'], 401);
            assertEquals(error['statusText'], '401 Unauthorized');
            assertEquals(error['reason'], 'network');
          });
}
