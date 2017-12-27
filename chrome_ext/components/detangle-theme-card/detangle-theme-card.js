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

goog.require('detangle.ThemeIds');
goog.require('detangle.utils');



/**
 * Storage key for sync storage themeChosen boolean
 *
 * @private {string}
 */
const THEME_CHOSEN_STORAGEKEY_ = 'themeChosen';


Polymer({
  is: 'detangle-theme-card',

  properties: {
    /** @type {(string|undefined)} */
    thisProfile: {
      type: String,
    },

    /** @type {(string|undefined)} */
    themeId: {
      type: String,
      computed: 'getThemeId(thisProfile)',
    },
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
   * Gets the suggested theme for the current profile.
   *
   * @param {string} thisProfile Profile that we're running in
   * @return {(string|undefined)} ID of the theme we suggest
   */
  getThemeId: function(thisProfile) {
    return detangle.ThemeIds[thisProfile];
  },

  /**
   * Returns a webstore URL for the supplied theme.
   *
   * @param {string} themeId Theme ID to get a webstore URL for.
   * @return {string}
   */
  computeRecommendedThemeUrl: function(themeId) {
    return 'https://chrome.google.com/webstore/detail/' + themeId;
  },

});
