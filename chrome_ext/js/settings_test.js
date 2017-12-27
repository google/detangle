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
 * @fileoverview Tests for settings.js.
 */

goog.module('detangle.settingsTest');

goog.setTestOnly();

const Profiles = goog.require('detangle.Profiles');
const Settings = goog.require('detangle.Settings');
const testSuite = goog.require('goog.testing.testSuite');
const {MatchPatternEntry} = goog.require('detangle.aclentries');


testSuite({
  getTestName() {
    return 'detangle.settingsTest';
  },

  testSerializeDeserializeSettings() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.blackLists[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('*://bad.example.com/*')]);
    settings.acls[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('*://good.example.com/*')]);

    const s = JSON.stringify(settings);
    const deserialized = new Settings(/** @type {!Object} */ (JSON.parse(s)));

    assertEquals(Profiles.CORPORATE, deserialized.thisProfile);
    assertTrue(
        deserialized.acls[Profiles.CORPORATE].test('http://good.example.com/'));
    assertTrue(deserialized.blackLists[Profiles.CORPORATE].test(
        'http://bad.example.com/'));
  },
});
