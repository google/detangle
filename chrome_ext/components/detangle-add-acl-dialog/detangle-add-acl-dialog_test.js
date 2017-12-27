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
 * @fileoverview Tests for detangle-add-acl-widget.
 */

'use strict'

goog.setTestOnly();

goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.aclentries');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');


var mockControl;


function setUp() {
  function fail_() {
    fail('Call to stub function');
  }

  chrome = {
    runtime: {},
    storage: {
      sync: {
        get: fail_,
        set: fail_,
      },
    },
    tabs: {
      create: fail_,
    },
  };
  mockControl = new goog.testing.MockControl();
}


function tearDown() {
  mockControl.$tearDown();
}


function testIsValidMatchpatternValid() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.pattern = 'https://www.google.com/*';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertTrue(elem.isValid);
}


function testIsValidMatchpatternInValid() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.pattern = 'file:///etc/passwd';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertFalse(elem.isValid);
}


function testMatchesUrlMatches() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.url = 'https://www.google.com/';
  elem.pattern = 'https://www.google.com/*';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertTrue(elem.isValid);
  assertFalse(elem.elementMatches('.bad', elem.$.urlbox));
}


function testMatchesUrlMatches() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.url = 'http://www.google.com/';
  elem.pattern = 'https://www.google.com/*';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertTrue(elem.isValid);
  assertTrue(elem.elementMatches('.bad', elem.$.urlbox));
}


function testGeneratePatternForUrlHttp() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.url = 'http://www.google.com/';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertTrue(elem.isValid);
  assertFalse(elem.elementMatches('.bad', elem.$.urlbox));
  assertEquals('*://www.google.com/*', elem.pattern);
}


function testGeneratePatternForUrlFtp() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.url = 'ftp://ftp.google.com/';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertTrue(elem.isValid);
  assertFalse(elem.elementMatches('.bad', elem.$.urlbox));
  assertEquals('ftp://ftp.google.com/*', elem.pattern);
}


function testGeneratePatternForUrlHttps() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.url = 'https://www.google.com/';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertTrue(elem.isValid);
  assertFalse(elem.elementMatches('.bad', elem.$.urlbox));
  assertEquals('https://www.google.com/*', elem.pattern);
}


function testGeneratePatternForUrlInvalidScheme() {
  var elem = document.createElement('detangle-add-acl-dialog');
  elem.url = 'chrome-extension://blah/stuff';
  Polymer.dom.flush();

  assertEquals(elem.matchType, 'matchpattern');
  assertFalse(elem.isValid);
  assertTrue(elem.elementMatches('.bad', elem.$.urlbox));
  assertEquals('', elem.pattern);
}


function testDoAddInvalid() {
  mockControl.createMethodMock(chrome.storage.sync, 'get');
  mockControl.createMethodMock(chrome.storage.sync, 'set');
  mockControl.$replayAll();

  var elem = document.createElement('detangle-add-acl-dialog');
  elem.pattern = 'chrome-extension://blah/stuff';
  Polymer.dom.flush();
  assertFalse(elem.isValid);

  return elem.doAdd().then(fail, function() {
    mockControl.$verifyAll();
  });
}


function testDoAddValidEmptyStorage() {
  mockControl
      .createMethodMock(chrome.storage.sync, 'get')(
          detangle.StorageKeys.PRIV_WHITELIST,
          goog.testing.mockmatchers.isFunction)
      .$does(function(key, cb) {
        cb({});
      });
  mockControl
      .createMethodMock(chrome.storage.sync, 'set')(
          new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
            let expected = {};
            expected[detangle.StorageKeys.PRIV_WHITELIST] = [
              new detangle.aclentries.MatchPatternEntry('*://www.example.com/*')
            ];
            assertObjectEquals(expected, arg);
            return true;
          }),
          goog.testing.mockmatchers.isFunction)
      .$does(function(items, cb) {
        cb();
      });
  mockControl.$replayAll();

  var elem = document.createElement('detangle-add-acl-dialog');
  elem.pattern = '*://www.example.com/*';
  Polymer.dom.flush();
  assertTrue(elem.isValid);

  return elem.doAdd().then(function() {
    mockControl.$verifyAll();
  });
}


function testDoAddNonEmptyStorage() {
  mockControl
      .createMethodMock(chrome.storage.sync, 'get')(
          detangle.StorageKeys.PRIV_WHITELIST,
          goog.testing.mockmatchers.isFunction)
      .$does(function(key, cb) {
        let existing = {};
        existing[detangle.StorageKeys.PRIV_WHITELIST] =
            [new detangle.aclentries.MatchPatternEntry('*://test/*')];
        cb(existing);
      });
  mockControl
      .createMethodMock(chrome.storage.sync, 'set')(
          new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
            let expected = {};
            expected[detangle.StorageKeys.PRIV_WHITELIST] = [
              '*://test/*', '*://www.example.com/*'
            ].map(x => new detangle.aclentries.MatchPatternEntry(x));
            assertObjectEquals(expected, arg);
            return true;
          }),
          goog.testing.mockmatchers.isFunction)
      .$does(function(items, cb) {
        cb();
      });
  mockControl.$replayAll();

  var elem = document.createElement('detangle-add-acl-dialog');
  elem.pattern = '*://www.example.com/*';
  Polymer.dom.flush();
  assertTrue(elem.isValid);

  return elem.doAdd().then(function() {
    mockControl.$verifyAll();
  });
}


function testDoAddRegular() {
  mockControl
      .createMethodMock(chrome.storage.sync, 'get')(
          detangle.StorageKeys.REGULAR_WHITELIST,
          goog.testing.mockmatchers.isFunction)
      .$does(function(key, cb) {
        cb({});
      });
  mockControl
      .createMethodMock(chrome.storage.sync, 'set')(
          new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
            let expected = {};
            expected[detangle.StorageKeys.REGULAR_WHITELIST] = [
              new detangle.aclentries.MatchPatternEntry('*://www.example.com/*')
            ];
            assertObjectEquals(expected, arg);
            return true;
          }),
          goog.testing.mockmatchers.isFunction)
      .$does(function(items, cb) {
        cb();
      });
  mockControl.$replayAll();

  var elem = document.createElement('detangle-add-acl-dialog');
  elem.targetProfile = detangle.Profiles.REGULAR;
  elem.pattern = '*://www.example.com/*';
  Polymer.dom.flush();
  assertTrue(elem.isValid);

  return elem.doAdd().then(function() {
    mockControl.$verifyAll();
  });
}


function testDoAddIsolated() {
  mockControl
      .createMethodMock(chrome.storage.sync, 'get')(
          detangle.StorageKeys.RISKY_WHITELIST,
          goog.testing.mockmatchers.isFunction)
      .$does(function(key, cb) {
        cb({});
      });
  mockControl
      .createMethodMock(chrome.storage.sync, 'set')(
          new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
            let expected = {};
            expected[detangle.StorageKeys.RISKY_WHITELIST] = [
              new detangle.aclentries.MatchPatternEntry('*://www.example.com/*')
            ];
            assertObjectEquals(expected, arg);
            return true;
          }),
          goog.testing.mockmatchers.isFunction)
      .$does(function(items, cb) {
        cb();
      });
  mockControl.$replayAll();

  var elem = document.createElement('detangle-add-acl-dialog');
  elem.targetProfile = detangle.Profiles.ISOLATED;
  elem.pattern = '*://www.example.com/*';
  Polymer.dom.flush();
  assertTrue(elem.isValid);

  return elem.doAdd().then(function() {
    mockControl.$verifyAll();
  });
}
