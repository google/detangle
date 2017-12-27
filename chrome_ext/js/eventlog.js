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
 * @fileoverview Event logging
 *
 * Logs events in a ring buffer.  Events are stored until a browser restart
 * or background page reload.  Events are identified by random UUID to avoid
 * using identifiers that could leak navigation history.
 */

goog.provide('detangle.Event');
goog.provide('detangle.clearEventLog');
goog.provide('detangle.getAllEvents');
goog.provide('detangle.getEvent');
goog.provide('detangle.logEvent');

goog.require('detangle.EventType');
goog.require('detangle.Profiles');


/**
 * @const
 * @type {number}
 * @package
 */
detangle.MAX_EVENTLOG_ENTRIES = 25;


/**
 * Generate a unique ID (128-bit integer as a hex string)
 *
 * @private
 * @return {string}
 */
detangle.uniqueId_ = function() {
  var r = new Uint8Array(16);
  window.crypto.getRandomValues(r);
  return Array.from(r).map(hex).join('');

  /**
   * @param {number} num A number in the range 0,255
   * @return {string}
   */
  function hex(num) {
    return ((num >> 4) & 0xf).toString(16) + (num & 0xf).toString(16);
  }
};


/**
 * An eventLog entry
 */
detangle.Event = class {
  /**
   * @param {string} id Unique event identifier
   * @param {!detangle.EventType} eventType Type/cause of event
   * @param {string} url URL that was intercept/blocked
   * @param {number} tabId Tab identifier that the event happened in
   * @param {?detangle.Profiles} targetProfile Profile that the URL was/would've
   *     been handed off to.
   * @param {number} timestamp Time that the event occured at
   * @param {!Object=} opt_details Optional extra details
   */
  constructor(
      id, eventType, url, tabId, targetProfile, timestamp, opt_details) {
    /**
     * Unique event identifier.
     *
     * @public {string}
     */
    this.id = id;

    /**
     * Type/cause of event.
     *
     * @public {!detangle.EventType}
     */
    this.eventType = eventType;

    /**
     * URL that was intercept/blocked.
     *
     * @public {string}
     */
    this.url = url;

    /**
     * Tab identifier that the event happened in (chrome.tabs API).
     *
     * @public {number}
     */
    this.tabId = tabId;

    /**
     * Profile that the URL was/would've been handed off to.
     *
     * @public {?detangle.Profiles}
     */
    this.targetProfile = targetProfile;

    /**
     * Time that the event occured at.
     *
     * @public {number}
     */
    this.timestamp = timestamp;


    /**
     * Extra details about the event.
     *
     * @public {(!Object|undefined)}
     */
    this.details = opt_details;
  }


  /**
   * Creates a serializable object with all fields.
   *
   * @override
   * @return {!Object<string,(string|number|boolean|null)>}
   */
  toJSON() {
    return {
      id: this.id,
      eventType: this.eventType,
      url: this.url,
      tabId: this.tabId,
      targetProfile: this.targetProfile,
      timestamp: this.timestamp,
      details: this.details
    };
  }


  /**
   * Gets the URL to redirect to if the event was intercepted.
   *
   * @public
   * @return {string}
   */
  getInterceptedPage() {
    return chrome.runtime.getURL(
        'intercepted.html#' + encodeURIComponent(this.id));
  }
};


/**
 * An array of events, in order of earliest to latest.
 *
 * @private
 * @type {!Array<!detangle.Event>}
 */
detangle.eventLog_ = [];


/**
 * Logs an event to a ring buffer.
 *
 * This should only be used in the background page - each page that includes
 * this will get a separate copy of the detangle.eventLog_ global, but only the
 * background page will respond to chrome.runtime.sendMessage() requests.
 *
 * @package
 * @param {!detangle.EventType} eventType Type of event that occured.
 * @param {string} url URL that was blocked/handed off.
 * @param {number} tabId Identifier of the tab that the event happened in.
 * @param {?detangle.Profiles} targetProfile Profile that should've handled
 *     the request.
 * @param {!Object=} opt_details Optional extra details
 * @return {!detangle.Event}
 */
detangle.logEvent = function(
    eventType, url, tabId, targetProfile, opt_details) {
  /** @type {!detangle.Event} */
  var entry = new detangle.Event(
      detangle.uniqueId_(), eventType, url, tabId, targetProfile, Date.now(),
      opt_details);

  detangle.eventLog_.push(entry);

  while (detangle.eventLog_.length > detangle.MAX_EVENTLOG_ENTRIES) {
    detangle.eventLog_.shift();
  }

  return entry;
};


/**
 * Gets an event with a specific ID.
 *
 * @param {string} id ID of the event you want to retrieve
 * @return {(!detangle.Event|undefined)}
 */
detangle.getEvent = function(id) {
  return detangle.eventLog_.find(x => x.id == id);
};

/**
 * Gets a shallow copy of the event log.
 *
 * @return {!Array<!detangle.Event>}
 */
detangle.getAllEvents = function() {
  return [...detangle.eventLog_];
};

/**
 * Clears the event log.
 */
detangle.clearEventLog = function() {
  detangle.eventLog_ = [];
};
