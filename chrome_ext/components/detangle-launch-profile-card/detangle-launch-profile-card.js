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


Polymer({
  is: 'detangle-launch-profile-card',

  properties: {
    thisProfile: {type: String},
    childProfiles: {
      type: Array,
      computed: 'computeChildProfiles(thisProfile)',
      value: [],
    },
    hasChildProfiles: {
      type: Boolean,
      value: false,
      computed: 'computeHasChildProfiles(thisProfile, childProfiles)'
    }
  },


  /**
   * @param {string} profile Profile that we're running in
   * @return {!Array<!detangle.Profiles>}
   */
  computeChildProfiles: function(profile) {
    /** @type {(!detangle.Profiles|undefined)} */
    var validatedProfile;

    try {
      validatedProfile = detangle.utils.validateProfile(profile);
    } catch (e) {
    }

    switch (validatedProfile) {
      case detangle.Profiles.CORPORATE:
        return [detangle.Profiles.REGULAR, detangle.Profiles.ISOLATED];
        break;
      case detangle.Profiles.REGULAR:
        return [detangle.Profiles.ISOLATED];
        break;
      default:
        return [];
    }
  },


  /**
   * @param {string} unused_thisProfile Profile we're running in
   * @param {!Array} childProfiles list of child profiles
   * @return {boolean}
   */
  computeHasChildProfiles: function(unused_thisProfile, childProfiles) {
    return childProfiles.length > 0;
  }
});
