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
 * @fileoverview Tests for eventlog.js
 */


'use strict';

goog.setTestOnly();


goog.require('detangle.Event');
goog.require('detangle.EventType');
goog.require('detangle.Profiles');
goog.require('detangle.clearEventLog');
goog.require('detangle.getAllEvents');
goog.require('detangle.getEvent');
goog.require('detangle.logEvent');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');


var mockControl;


/** @type {number} */
var randomCounter;


function setUp() {
  detangle.clearEventLog();
  randomCounter = 0;
  mockControl = new goog.testing.MockControl();
}


function tearDown() {
  mockControl.$tearDown();
}


/**
 * Fake Crypto.getRandomValues that returns deterministic non-random data.
 *
 * @private
 * @param {!Uint8Array} arr Array that will be overwritten with randomishness
 */
function badRandom_(arr) {
  for (let r = 0; r < 16; r++) {
    arr[r] = randomCounter;
    randomCounter = (randomCounter + 1) % 251;
  }
}


function testLogEvent() {
  var isUint8Array = new goog.testing.mockmatchers.ArgumentMatcher(function(
      arg) { return arg instanceof Uint8Array && arg.length == 16; });
  mockControl.createMethodMock(window.crypto, 'getRandomValues')(isUint8Array)
      .$does(badRandom_);
  mockControl.createMethodMock(Date, 'now')().$returns(42);
  mockControl.$replayAll();

  detangle.logEvent(
      detangle.EventType.HANDOFF, 'http://www.example.com/', 1,
      detangle.Profiles.REGULAR);
  assertEquals(detangle.getAllEvents().length, 1);
  const ev = detangle.getAllEvents()[0];
  assertEquals('000102030405060708090a0b0c0d0e0f', ev.id);
  assertEquals(detangle.EventType.HANDOFF, ev.eventType);
  assertEquals('http://www.example.com/', ev.url);
  assertEquals(1, ev.tabId);
  assertEquals(detangle.Profiles.REGULAR, ev.targetProfile);
  assertEquals(42, ev.timestamp);
  mockControl.$verifyAll();
}


function testLogLotsOfEvents() {
  var isUint8Array = new goog.testing.mockmatchers.ArgumentMatcher(function(
      arg) { return arg instanceof Uint8Array && arg.length == 16; });
  var mockRandom =
      mockControl.createMethodMock(window.crypto, 'getRandomValues');
  var mockDate = mockControl.createMethodMock(Date, 'now');

  // Ensure that we go over 25 events (MAX_EVENTLOG_ENTRIES)
  for (let i = 0; i < 42; i++) {
    mockRandom(isUint8Array).$does(badRandom_);
    mockDate().$returns(i + 42);
  }
  mockControl.$replayAll();

  for (let i = 0; i < 42; i++) {
    detangle.logEvent(
        detangle.EventType.HANDOFF, 'http://www.example.com/', 1,
        detangle.Profiles.REGULAR);
  }

  assertEquals(detangle.MAX_EVENTLOG_ENTRIES, detangle.getAllEvents().length);
  var lastEv = detangle.getAllEvents().pop();
  assertEquals(83, lastEv.timestamp);
  mockControl.$verifyAll();
}


function testGetEvent() {
  var isUint8Array = new goog.testing.mockmatchers.ArgumentMatcher(function(
      arg) { return arg instanceof Uint8Array && arg.length == 16; });
  var mockRandom =
      mockControl.createMethodMock(window.crypto, 'getRandomValues');
  var mockDate = mockControl.createMethodMock(Date, 'now');

  for (let i = 0; i < 10; i++) {
    mockRandom(isUint8Array).$does(badRandom_);
    mockDate().$returns(i + 42);
  }
  mockControl.$replayAll();

  for (let i = 0; i < 10; i++) {
    detangle.logEvent(
        detangle.EventType.HANDOFF, 'http://www.example.com/', 1,
        detangle.Profiles.REGULAR);
  }

  assertEquals(10, detangle.getAllEvents().length);

  assertUndefined(detangle.getEvent('notarealid'));

  // The 6th event
  var ev = detangle.getEvent('505152535455565758595a5b5c5d5e5f');
  assertEquals(47, ev.timestamp);

  mockControl.$verifyAll();
}


function testToJSON() {
  var ev = new detangle.Event(
      'IDIDID', detangle.EventType.HANDOFF, 'http://www.example.com/', 1,
      detangle.Profiles.ISOLATED, 42);
  var msg = ev.toJSON();
  assertEquals('IDIDID', msg.id);
  assertEquals('handoff', msg.eventType);
  assertEquals('http://www.example.com/', msg.url);
  assertEquals(1, msg.tabId);
  assertEquals(detangle.Profiles.ISOLATED, msg.targetProfile);
  assertEquals(42, msg.timestamp);
}
