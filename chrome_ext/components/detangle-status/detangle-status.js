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
 * @fileoverview An element that performs a status query and binds the
 * result.
 *
 * @suppress {reportUnknownTypes}
 */


let StatusElement = Polymer({
  is: 'detangle-status',

  properties: {
    /**
     * The profile we're operating in.
     *
     * @type {(string|undefined)}
     */
    thisProfile: {
      type: String,
      notify: true,
      readOnly: true,
    },

    /**
     * The networkClass as set in managed policy.
     *
     * @type {(string|undefined)}
     */
    networkClass: {
      type: String,
      notify: true,
      readOnly: true,
    },
  },

  /**
   * If we're not the singleton instance, bind to it's properties.  If we are
   * then poll the background page for status every 500ms until we get a
   * response.
   *
   * @override
   */
  ready: function() {
    const handleResponse = msg => {
      // We use setters here because the variables are read only to prevent
      // parent objects from overwriting values.
      this._setThisProfile(msg && msg.running_in);
      this._setNetworkClass(msg && msg.network_class);
    };

    const pollStatus = () => {
      if (this.thisProfile) {
        return;
      }

      // This is fairly aggressive polling, but it should only be on visible
      // pages like the popup or options page, which should only remain in this
      // state for a relatively short period.
      setTimeout(pollStatus, 500);
      chrome.runtime.sendMessage({'command': 'status'}, handleResponse);
    };

    if (!StatusElement.instance) {
      StatusElement.instance = this;
      pollStatus();
      return;
    }

    StatusElement.instance.addEventListener('this-profile-changed', () => {
      this._setThisProfile(StatusElement.instance.thisProfile);
    });
    StatusElement.instance.addEventListener('network-class-changed', () => {
      this._setNetworkClass(StatusElement.instance.networkClass);
    });
    this._setThisProfile(StatusElement.instance.thisProfile);
    this._setNetworkClass(StatusElement.instance.networkClass);
  },
});
