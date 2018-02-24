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

goog.require('detangle.utils');

Polymer({
  is: 'detangle-launch-profile-button',

  properties: {
    profile: {
      type: String,
    },
    label: {
      type: String,
      computed: 'computeProfileLabel(profile)',
    },
  },

  listeners: {
    tap: 'launch',
  },


  /**
   * Sends a message to the background page requesting launch of the profile.
   */
  launch: function() {
    chrome.runtime.sendMessage({
      'command': 'launch',
      'profile': this.profile,
    });
  },


  /**
   * Computes the friendly label of the profile.
   *
   * @param {string} profile The value of the profile attribute
   * @return {string} The user-friendly representation of the profile
   */
  computeProfileLabel: function(profile) {
    return detangle.utils.computeProfileLabel(profile);
  }
});
