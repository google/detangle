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
 * @fileoverview Tests for the detangle-event-list component
 */

'use strict';

goog.setTestOnly();

goog.require('detangle.EventType');
goog.require('detangle.Profiles');
goog.require('goog.testing.Mock');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');


/** @type {!Array<!Object>} */
var fakeEvents;

var mockControl;
var mockSendMessage;

function setUp() {
  chrome = {
    runtime: {
      sendMessage: function() {
        fail();
      }
    }
  };

  fakeEvents = [];

  for (let i = 0; i < 10; i++) {
    fakeEvents.push({
      id: 'fakeEvent' + i,
      url: 'https://www.example.com/',
      targetProfile: detangle.Profiles.REGULAR,
      eventType: detangle.EventType.HANDOFF,
      timestamp: i
    });
  }

  mockControl = new goog.testing.MockControl();
  mockSendMessage = mockControl.createMethodMock(
      chrome.runtime, 'sendMessage', goog.testing.Mock.LOOSE);
  detangle.StatusElement.instance = undefined;
}


function tearDown() {
  mockControl.$tearDown();
}


var listEventsMatcher =
    new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
      return arg.command == 'listevents';
    }, 'listevents');


var statusMatcher =
    new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
      return arg.command == 'status';
    }, 'status');


/**
 * Waits for async events to settle down.
 *
 * @return {!Promise}
 */
function wait() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      Polymer.dom.flush();
      resolve();
    }, 50);
  });
}


/**
 * @return {!Promise}
 */
function testAllEvents() {
  mockSendMessage(statusMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(command, cb) {
        cb({running_in: detangle.Profiles.CORPORATE});
      });
  mockSendMessage(listEventsMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(command, cb) {
        cb(fakeEvents);
      });
  mockControl.$replayAll();

  let elem = document.createElement('detangle-event-list');
  return wait().then(function() {
    mockControl.$verifyAll();
    assertFalse(elem.haveMore);
    assertEquals(fakeEvents.length, elem.events.length);
    assertEquals(fakeEvents.length, elem.lastEvents.length);
  });
}


/**
 * @return {!Promise}
 */
function testLimitedToLessThanAvailableEvents() {
  mockSendMessage(statusMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(command, cb) {
        cb({running_in: detangle.Profiles.CORPORATE});
      });
  mockSendMessage(listEventsMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(command, cb) {
        cb(fakeEvents);
      });
  mockControl.$replayAll();

  let elem = document.createElement('detangle-event-list');
  elem.numEvents = 5;

  return wait().then(function() {
    mockControl.$verifyAll();
    assertTrue(elem.haveMore);
    assertEquals(fakeEvents.length, elem.events.length);
    assertEquals(5, elem.lastEvents.length);
  });
}


/**
 * @return {!Promise}
 */
function testLimitedToMoreThanAvailableEvents() {
  mockSendMessage(statusMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(command, cb) {
        cb({running_in: detangle.Profiles.CORPORATE});
      });
  mockSendMessage(listEventsMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(command, cb) {
        cb(fakeEvents);
      });
  mockControl.$replayAll();

  let elem = document.createElement('detangle-event-list');
  elem.numEvents = 50;

  return wait().then(function() {
    mockControl.$verifyAll();
    assertFalse(elem.haveMore);
    assertEquals(fakeEvents.length, elem.events.length);
    assertEquals(fakeEvents.length, elem.lastEvents.length);
  });
}
