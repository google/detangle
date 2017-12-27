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
 * @fileoverview Main content for the intercepted page
 */

Polymer({
  is: 'detangle-intercepted-page',

  properties: {
    eventId: {
      type: String,
    },
  },

  /**
   * @override
   */
  ready: function() {
    this.eventId = window.location.hash.slice(1);
    if (!this.eventId) {
      console.log('No event ID in intercepted page');
      return;
    }
  },
});
