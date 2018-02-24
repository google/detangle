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
 * @fileoverview Polymer script for launch-button element
 */

goog.require('detangle.EventType');
goog.require('detangle.Profiles');
goog.require('detangle.utils');


Polymer({
  is: 'detangle-event-card',

  properties: {
    /**
     * The event ID.
     */
    eventId: {
      type: String,
    },

    /**
     * The content of the event.
     *
     * @type {?Object}
     */
    eventData: {
      type: Object,
      value: null,
    },

    url: {
      type: String,
    },

    tabId: {
      type: Number,
    },

    targetProfile: {
      type: String,
    },

    eventType: {
      type: String,
    },

    timestamp: {
      type: Number,
    },

    targetProfileLabel: {
      type: String,
      computed: 'computeProfileLabel(targetProfile)',
    },

    timeString: {
      type: String,
      computed: 'computeTimeString(timestamp)',
    },

    thisProfile: {
      type: String,
    },

    isInterceptedPage: {
      type: Boolean,
      value: false,
    },

    extraDetails: {
      type: String,
    },

    showExtraDetails: {
      type: Boolean,
      value: false,
    },

    showAddDialog: {
      type: Boolean,
      value: false,
    },

    showClipboard: {
      type: Boolean,
      computed: 'computeShowClipboard(eventType)',
    },

    showDisplayHandoffPageToggle: {
      type: Boolean,
      computed:
          'computeShowDisplayHandoffPageToggle(isInterceptedPage, eventType)',
    },
  },

  listeners: {
    'addDialog.dialog-closed': 'hideAddDialog',
  },

  observers: [
    'retrieveEvent(eventId, eventData)',
    'eventDataChanged(eventData)',
  ],

  /**
   * Retreives an event using the chrome.runtime.sendMessage API.
   *
   * @param {string} eventId ID of the event to retrieve
   * @param {?Object} eventData The event data.
   * @suppress {reportUnknownTypes}
   */
  retrieveEvent: function(eventId, eventData) {
    if (eventData) {
      return;
    }


    chrome.runtime.sendMessage(
        {'command': 'getevent', 'eventId': eventId}, ev => {
          if (!ev) {
            console.log('Unable to retrieve event', eventId);
            return;
          }
          this.eventData = /** @type {!Object} */ (ev);
        });
  },

  /**
   * Update fields when we have event data.
   *
   * @param {?Object} eventData The event data.
   * @suppress {reportUnknownTypes}
   */
  eventDataChanged: function(eventData) {
    if (!eventData) {
      return;
    }

    this.eventId = eventData.id;
    this.url = eventData.url;
    this.tabId = eventData.tabId;
    this.targetProfile = eventData.targetProfile;
    this.eventType = eventData.eventType;
    this.timestamp = eventData.timestamp;
    if (eventData.details) {
      this.extraDetails = JSON.stringify(eventData.details, null, 2);
    }
  },

  /**
   * Computes the friendly label of the profile.
   *
   * @param {string} profile The value of the profile attribute
   * @return {string} The user-friendly representation of the profile
   */
  computeProfileLabel: function(profile) {
    return detangle.utils.computeProfileLabel(profile);
  },

  /**
   * Converts a timestamp to a friendly string.
   *
   * @param {number} timestamp Time in ms since 1970-01-01 UTC
   * @return {string}
   */
  computeTimeString: function(timestamp) {
    return new Date(timestamp).toLocaleString();
  },


  /**
   * Decides whether to show the copy to clipboard button.
   *
   * @param {detangle.EventType} eventType Type of event that occured
   * @return {boolean}
   */
  computeShowClipboard: function(eventType) {
    return eventType == detangle.EventType.NO_HANDOFF;
  },


  /**
   * Decides whether to show the "Always show this page" toggle.
   *
   * @param {boolean} isInterceptedPage Whether we're slapped on the intercepted
   *     page.
   * @param {detangle.EventType} eventType The type of event we're displaying.
   * @return {boolean}
   */
  computeShowDisplayHandoffPageToggle: function(isInterceptedPage, eventType) {
    return isInterceptedPage && eventType == detangle.EventType.HANDOFF;
  },

  /**
   * Calculates whether the provided profile is the Corporate profile.
   *
   * @param {detangle.Profiles} profile Profile that may be Corporate.
   * @return {boolean}
   */
  isCorporate: function(profile) {
    return profile == detangle.Profiles.CORPORATE;
  },

  /**
   * Determines whether to show the add button.
   *
   * @param {!detangle.Profiles} thisProfile The profile that we're operating in
   * @param {string} eventType The type of event that we're displaying.
   * @return {boolean}
   */
  shouldShowAdd: function(thisProfile, eventType) {
    return this.isCorporate(thisProfile) &&
        eventType != detangle.EventType.BLACKLISTED;
  },

  /**
   * Converts an eventType into a paper-card heading.
   *
   * @param {string} eventType Type of event
   * @param {string} targetProfileLabel Friendly label of target profile
   * @return {string}
   */
  makeHeading: function(eventType, targetProfileLabel) {
    switch (eventType) {
      case detangle.EventType.BLACKLISTED:
        return 'Request for blacklisted resource';
        break;
      case detangle.EventType.HANDOFF:
        return 'Request Sent To ' + targetProfileLabel;
        break;
      case detangle.EventType.NO_HANDOFF:
        return 'Request for ' + targetProfileLabel + ' stopped';
        break;
      case detangle.EventType.SUBMISSION_BLOCKED:
        return 'Cross-Browser Form Submission Blocked';
        break;
      case detangle.EventType.OAUTH_BLOCKED:
        return 'Cross-Browser OAuth Grant Blocked';
        break;
      case detangle.EventType.OAUTH_INVALID:
        return 'Invalid OAuth Grant Blocked';
        break;
      default:
        return 'Request blocked';
    }
  },

  /**
   * Closes the window.
   */
  close: function() {
    window.close();
  },

  /**
   * Opens the add acl dialog.
   */
  add: function() {
    this.showAddDialog = true;
  },

  /**
   * Hides the add acl dialog.
   */
  hideAddDialog: function() {
    this.showAddDialog = false;
  },

  /**
   * Handles the tap event for the URL when it's a link.
   *
   * @param {!Event} e The Event that we want to cancel
   */
  urlClicked: function(e) {
    e.preventDefault();
    if (this.showClipboard) {
      this.copyToClipboard();
    }
  },

  /**
   * Copies the URL to the clipboard.
   *
   * @suppress {reportUnknownTypes}
   */
  copyToClipboard: function() {
    let selection = window.getSelection();
    selection.selectAllChildren(this.$$('span.url'));
    document.execCommand('copy');
    selection.removeAllRanges();
    this.$.clipboardToast.show();
  },

  /**
   * Launches the URL in an incognito window.
   */
  launchIncognito: function() {
    chrome.windows.getAll({windowTypes: ['normal']}, windows => {
      chrome.windows.create(
          {
            url: this.url,
            incognito: true,
            type: 'normal',
            focused: true,
          },
          () => {
            window.close();
          });
    });
  },
});
