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

goog.require('detangle.Profiles');
goog.require('detangle.utils');


/** @private {string} */
const CORPORATE_MESSAGE_ =
    'Use this browser whenever you sign in to your Corporate account';
/** @private {string} */
const REGULAR_MESSAGE_ =
    'Use this browser for regular web browsing. Do not use your Corporate credentials here.';
/** @private {string} */
const ISOLATED_MESSAGE_ =
    'Use this browser whenever you browse untrustworthy sites.';
/** @private {string} */
const UNCONFIGURED_MESSAGE_ =
    'Detangle isn\'t configured yet.  Go to options to get started.';

/** @private {string} */
const UNCONFIGURED_LABEL_ = 'Get Started';



Polymer({
  is: 'detangle-status-card',

  properties: {
    /**
     * Current profile, as reported by detangle-status.
     *
     * @type {(string|undefined)}
     */
    thisProfile: {
      type: String,
      notify: true,
    },

    /**
     * Friendly label for the profile.
     *
     * @type {string}
     */
    profileLabel: {
      type: String,
      value: UNCONFIGURED_LABEL_,
      computed: 'computeProfileLabel(thisProfile)',
    },

    /**
     * A long description of the profile and what you should do with it.
     *
     * @type {string}
     */
    profileInformation: {
      type: String,
      value: UNCONFIGURED_MESSAGE_,
      computed: 'computeProfileInformation(thisProfile)',
    },

    /**
     * Current network class, as reported by detangle-status.
     *
     * @type {(string|undefined)}
     */
    networkClass: {
      type: String,
    },
  },


  /**
   * Opens the options page.
   */
  options: function() {
    chrome.runtime.openOptionsPage();
  },


  /**
   * Computes the friendly label of the profile.
   *
   * @param {(string|undefined)} profile The value of the profile attribute
   * @return {string} The user-friendly representation of the profile
   */
  computeProfileLabel: function(profile) {
    // We don't want undefined to come out as empty string
    if (!profile) {
      return UNCONFIGURED_LABEL_;
    }

    return detangle.utils.computeProfileLabel(profile);
  },


  /**
   * Provides some information about the current profile.
   *
   * @param {string} profile The current profile
   * @return {string}
   */
  computeProfileInformation: function(profile) {
    /** @type {(!detangle.Profiles|undefined)} */
    var validatedProfile;
    try {
      validatedProfile = detangle.utils.validateProfile(profile);
    } catch (e) {
    }

    switch (validatedProfile) {
      case detangle.Profiles.CORPORATE:
        return CORPORATE_MESSAGE_;
        break;
      case detangle.Profiles.REGULAR:
        return REGULAR_MESSAGE_;
        break;
      case detangle.Profiles.ISOLATED:
        return ISOLATED_MESSAGE_;
        break;
      default:
        return UNCONFIGURED_MESSAGE_;
    }
  }
});
