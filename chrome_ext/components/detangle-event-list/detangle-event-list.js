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
 * @fileoverview A polymer component that displays a list of event cards.
 */

Polymer({
  is: 'detangle-event-list',

  properties: {
    /**
     * All events.
     *
     * @type {(!Array<!Object>|undefined)}
     */
    events: {
      type: Array,
    },

    /**
     * The last numEvents events.
     *
     * @type {(!Array<!Object>|undefined)}
     */
    lastEvents: {
      type: Array,
      computed: 'computeLastEvents(events, numEvents)',
    },

    /**
     * How many events to display, or 0 for all.
     */
    numEvents: {
      type: Number,
      value: 0,
    },

    /**
     * Whether we have more events that aren't being displayed.
     */
    haveMore: {
      type: Boolean,
      value: false,
      computed: 'computeHaveMore(events, numEvents)'
    },
  },

  /**
   * Computes the last numEvents events to display.
   *
   * @param {!Array<string>} events List of events
   * @param {number} numEvents Number of events we're showing
   * @return {!Array<string>} The last numEvents events, in reverse order
   */
  computeLastEvents: function(events, numEvents) {
    let reversedEvents = [...events].reverse();
    return reversedEvents.slice(0, numEvents || undefined);
  },

  /**
   * Computes whether to show the More button.
   *
   * @param {!Array<string>} events List of events
   * @param {number} numEvents Number of events we're showing
   * @return {boolean}
   */
  computeHaveMore: function(events, numEvents) {
    if (numEvents && numEvents < events.length) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Requests all events from the background page.
   * @suppress {reportUnknownTypes}
   * @override
   */
  ready: function() {
    chrome.runtime.sendMessage(
        {'command': 'listevents'}, events => this.events = events);
  },


  /**
   * Shows more events.
   */
  showMore: function() {
    this.numEvents += 2;
  },
});
