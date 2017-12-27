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
 * @fileoverview Tests for route.js
 */

goog.module('detangle.routeTest');

goog.setTestOnly();

const Profiles = goog.require('detangle.Profiles');
const Settings = goog.require('detangle.Settings');
const getProfile = goog.require('detangle.getProfile');
const isBlocked = goog.require('detangle.isBlocked');
const testSuite = goog.require('goog.testing.testSuite');
const {MatchPatternEntry} = goog.require('detangle.aclentries');


testSuite({
  testLookupUrlFromCorporate() {
    const settings = new Settings({
      thisProfile: Profiles.CORPORATE,
    });
    settings.acls[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('https://*.corp.example.com/*')]);
    settings.acls[Profiles.ISOLATED].setUserAcl(
        [new MatchPatternEntry('*://*.corn/*')]);

    // Nav to login.corp is a null action.
    assertEquals(
        'login.corp', Profiles.CORPORATE,
        getProfile(settings, 'https://login.corp.example.com/'));
    // Nav to ebay.com returns REGULAR.
    assertEquals(
        'ebay.com', Profiles.REGULAR,
        getProfile(settings, 'https://ebay.com/'));
    // Nav to the coRn domain returns ISOLATED.
    assertEquals(
        'login.coRn', Profiles.ISOLATED,
        getProfile(settings, 'http://login.corp.example.corn/'));
  },

  testLookupUrlFromRegular() {
    const settings = new Settings({
      thisProfile: Profiles.REGULAR,
    });
    settings.acls[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('https://*.corp.example.com/*')]);
    settings.acls[Profiles.ISOLATED].setUserAcl(
        [new MatchPatternEntry('*://*.corn/*')]);

    // Nav to login.corp returns REGULAR, even though in CORPORATE acl.
    assertEquals(
        'login.corp', Profiles.REGULAR,
        getProfile(settings, 'https://login.corp.example.com/'));
    // Nav to ebay.com returns REGULAR.
    assertEquals(
        'ebay.com', Profiles.REGULAR,
        getProfile(settings, 'https://ebay.com/'));
    // Nav to the coRn domain returns ISOLATED.
    assertEquals(
        'login.coRn', Profiles.ISOLATED,
        getProfile(settings, 'ftp://login.corp.example.corn/'));
  },

  testLookupUrlFromCorporateDefaultIsolated() {
    const settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      defaultIsolated: true,
    });
    settings.acls[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('https://*.corp.example.com/*')]);
    settings.acls[Profiles.REGULAR].setUserAcl(
        [new MatchPatternEntry('*://example.com/*')]);

    // Nav to login.corp goes to CORPORATE
    assertEquals(
        'login.corp', Profiles.CORPORATE,
        getProfile(settings, 'https://login.corp.example.com/'));
    // Nav to ebay.com returns ISOLATED.
    assertEquals(
        'ebay.com', Profiles.ISOLATED,
        getProfile(settings, 'https://ebay.com/'));
    // Nav to the example.com returns REGULAR.
    assertEquals(
        'example.com', Profiles.REGULAR,
        getProfile(settings, 'http://example.com/'));
  },

  testLookupUrlFromRegularDefaultIsolated() {
    const settings = new Settings({
      thisProfile: Profiles.REGULAR,
      defaultIsolated: true,
    });
    settings.acls[Profiles.REGULAR].setUserAcl(
        [new MatchPatternEntry('*://example.com/*')]);

    // Nav to ebay.com returns Regular.
    assertEquals(
        'example.com', Profiles.REGULAR,
        getProfile(settings, 'https://example.com/'));
    assertEquals(
        'ebay.com', Profiles.ISOLATED,
        getProfile(settings, 'ftp://ftp.ebay.com/'));
  },

  testLookupUrlFromIsolated() {
    const settings = new Settings({thisProfile: Profiles.ISOLATED});

    assertEquals(
        Profiles.ISOLATED, getProfile(settings, 'https://example.com/'));
  },

  testLookupUrlNoSettings() {
    assertThrows(function() {
      getProfile(null, 'https://example.com/');
    });
  },

  testIsBlockedFromCorporate() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.blackLists[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('*://corporateblocked/*')]);
    settings.blackLists[Profiles.REGULAR].setUserAcl(
        [new MatchPatternEntry('*://regularblocked/*')]);
    settings.blackLists[Profiles.ISOLATED].setUserAcl(
        [new MatchPatternEntry('*://isolatedblocked/*')]);
    settings.globalBlacklist.setUserAcl(
        [new MatchPatternEntry('*://globalblocked/*')]);

    assertTrue(isBlocked(settings, 'http://corporateblocked/'));
    assertFalse(isBlocked(settings, 'http://regularblocked/'));
    assertFalse(isBlocked(settings, 'http://isolatedblocked/'));
    assertTrue(isBlocked(settings, 'http://globalblocked/'));
  },

  testIsBlockedFromRegular() {
    const settings = new Settings({thisProfile: Profiles.REGULAR});
    settings.blackLists[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('*://corporateblocked/*')]);
    settings.blackLists[Profiles.REGULAR].setUserAcl(
        [new MatchPatternEntry('*://regularblocked/*')]);
    settings.blackLists[Profiles.ISOLATED].setUserAcl(
        [new MatchPatternEntry('*://isolatedblocked/*')]);
    settings.globalBlacklist.setUserAcl(
        [new MatchPatternEntry('*://globalblocked/*')]);

    assertFalse(isBlocked(settings, 'http://corporateblocked/'));
    assertTrue(isBlocked(settings, 'http://regularblocked/'));
    assertFalse(isBlocked(settings, 'http://isolatedblocked/'));
    assertTrue(isBlocked(settings, 'http://globalblocked/'));
  },

  testIsBlockedFromIsolated() {
    const settings = new Settings({thisProfile: Profiles.ISOLATED});
    settings.blackLists[Profiles.CORPORATE].setUserAcl(
        [new MatchPatternEntry('*://corporateblocked/*')]);
    settings.blackLists[Profiles.REGULAR].setUserAcl(
        [new MatchPatternEntry('*://regularblocked/*')]);
    settings.blackLists[Profiles.ISOLATED].setUserAcl(
        [new MatchPatternEntry('*://isolatedblocked/*')]);
    settings.globalBlacklist.setUserAcl(
        [new MatchPatternEntry('*://globalblocked/*')]);

    assertFalse(isBlocked(settings, 'http://corporateblocked/'));
    assertFalse(isBlocked(settings, 'http://regularblocked/'));
    assertTrue(isBlocked(settings, 'http://isolatedblocked/'));
    assertTrue(isBlocked(settings, 'http://globalblocked/'));
  },
});
