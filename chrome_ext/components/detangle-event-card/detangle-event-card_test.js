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

goog.setTestOnly();

goog.require('detangle.Profiles');
goog.require('goog.testing.Mock');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');

function setUp() {
  chrome = {
    runtime: {
      sendMessage: function() {},
    },
    storage: {
      managed: {
        get: function() {},
      },
      sync: {
        get: function() {},
      },
      local: {
        get: function() {},
      },
    },
  };
}

var mockControl;
var windowClose;
var sendMessage;


var getEventMessageMatcher =
    new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
      return arg.command == 'getevent' && arg.eventId == 'fakeEvent';
    });


var statusMessageMatcher =
    new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
      return arg.command == 'status';
    });


function setUp() {
  mockControl = new goog.testing.MockControl();
  chrome = {runtime: {sendMessage: function() {}}};
  sendMessage = mockControl.createMethodMock(
      chrome.runtime, 'sendMessage', goog.testing.Mock.LOOSE);
  detangle.StatusElement.instance = undefined;
}


function tearDown() {
  mockControl.$tearDown();
}


/**
 * Waits for async events to settle down, then flush the dom and resolves the
 * promise.
 *
 * @public
 * @return {!Promise}
 */
function wait() {
  return new Promise(function(resolve) {
    window.setTimeout(function() {
      Polymer.dom.flush();
      resolve();
    }, 50);
  });
}


function testSubmissionBlocked() {
  sendMessage(getEventMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({
          id: 'fakeEvent',
          url: 'http://www.example.com/',
          targetProfile: detangle.Profiles.ISOLATED,
          eventType: 'submission_blocked',
          timestamp: 1
        });
      });
  sendMessage(statusMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({running_in: detangle.Profiles.CORPORATE});
      });
  mockControl.$replayAll();

  var elem = document.createElement('detangle-event-card');
  elem.setAttribute('event-id', 'fakeEvent');

  return wait().then(function() {
    mockControl.$verifyAll();

    assertEquals('http://www.example.com/', elem.url);
    assertEquals(detangle.Profiles.ISOLATED, elem.targetProfile);
    assertEquals('submission_blocked', elem.eventType);
    assertEquals(1, elem.timestamp);
    assertFalse(elem.showDisplayHandoffPageToggle);
  });
}


function testHandoffNotInterceptedPage() {
  sendMessage(getEventMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({
          id: 'fakeEvent',
          url: 'http://www.example.com/',
          targetProfile: detangle.Profiles.ISOLATED,
          eventType: 'handoff',
          timestamp: 1
        });
      });
  sendMessage(statusMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({running_in: detangle.Profiles.CORPORATE});
      });
  mockControl.$replayAll();

  var elem = document.createElement('detangle-event-card');
  elem.setAttribute('event-id', 'fakeEvent');

  return wait().then(function() {
    mockControl.$verifyAll();

    assertEquals('http://www.example.com/', elem.url);
    assertEquals(detangle.Profiles.ISOLATED, elem.targetProfile);
    assertEquals('handoff', elem.eventType);
    assertEquals(1, elem.timestamp);
    assertFalse(elem.isInterceptedPage);
    assertFalse(elem.showDisplayHandoffPageToggle);
  });
}


function testReadyInCorporate() {
  sendMessage(getEventMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({
          id: 'fakeEvent',
          url: 'http://www.example.com/',
          targetProfile: detangle.Profiles.ISOLATED,
          eventType: 'submission_blocked',
          timestamp: 1
        });
      });
  sendMessage(statusMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({running_in: detangle.Profiles.CORPORATE});
      });
  mockControl.$replayAll();

  var element = document.createElement('detangle-event-card');
  return wait().then(function() {
    assertTrue(element.isCorporate(element.thisProfile));
  });
}


function testReadyInRegular() {
  sendMessage(getEventMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({
          id: 'fakeEvent',
          url: 'http://www.example.com/',
          targetProfile: detangle.Profiles.ISOLATED,
          eventType: 'submission_blocked',
          timestamp: 1
        });
      });
  sendMessage(statusMessageMatcher, goog.testing.mockmatchers.isFunction)
      .$does(function(msg, cb) {
        cb({running_in: detangle.Profiles.REGULAR});
      });
  mockControl.$replayAll();

  var element = document.createElement('detangle-event-card');
  return wait().then(function() {
    assertFalse(element.isCorporate(element.thisProfile));
  });
}
