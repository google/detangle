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
 * @fileoverview Tests for loadsettings.js.
 */

goog.module('detangle.loadSettingsTest');

goog.setTestOnly();

const AclEntryTags = goog.require('detangle.AclEntryTags');
const Profiles = goog.require('detangle.Profiles');
const StorageKeys = goog.require('detangle.StorageKeys');
const loadSettings = goog.require('detangle.loadSettings');
const testModule = goog.require('detangle.test');
const testSuite = goog.require('goog.testing.testSuite');
const {MatchPatternEntry} = goog.require('detangle.aclentries');


testSuite({
  getTestName() {
    return 'detangle.loadSettingsTest';
  },

  setUp() {
    testModule.setupChromeTests();
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsUnconfigured() {
    return loadSettings().then(fail, function(e) {
      assertEquals('Current profile not yet configured', e.message);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsInvalidProfile() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = 'INVALID';

    return loadSettings().then(fail, function(e) {
      assertEquals('Invalid Profile', e.message);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsCorporate() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertFalse(settings.defaultIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsNonCorporate() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.REGULAR;
    testModule.fakeLocalStorage[StorageKeys.DEFAULT_SANDBOX] = true;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.REGULAR, settings.thisProfile);
      assertTrue(settings.defaultIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsIsolated() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.ISOLATED;
    testModule.fakeLocalStorage[StorageKeys.DEFAULT_SANDBOX] = true;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.ISOLATED, settings.thisProfile);
      assertTrue(settings.defaultIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsCorporateDefaultIsolated() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.DEFAULT_SANDBOX] = true;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertTrue(settings.defaultIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsCorporateManagedDefaultIsolatedTrue() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeManagedStorage[StorageKeys.DEFAULT_SANDBOX] = true;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertTrue(settings.defaultIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsCorporateManagedDefaultIsolatedFalse() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.DEFAULT_SANDBOX] = true;
    testModule.fakeManagedStorage[StorageKeys.DEFAULT_SANDBOX] = false;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertFalse(settings.defaultIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsCorporateManagedIncognitoIsolatedFalse() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.INCOGNITO_SANDBOX] = true;
    testModule.fakeManagedStorage[StorageKeys.INCOGNITO_SANDBOX] = false;

    return loadSettings().then(function(settings) {
      assertFalse(settings.incognitoIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsCorporateManagedIncognitoIsolatedTrue() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.INCOGNITO_SANDBOX] = false;
    testModule.fakeManagedStorage[StorageKeys.INCOGNITO_SANDBOX] = true;

    return loadSettings().then(function(settings) {
      assertTrue(settings.incognitoIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsIncognitoIsolatedTrue() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.INCOGNITO_SANDBOX] = true;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertTrue(settings.incognitoIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsPreferUserPickUser() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.DISPLAY_HANDOFF_PAGE] = false;
    testModule.fakeManagedStorage[StorageKeys.DISPLAY_HANDOFF_PAGE] = true;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertFalse(settings.displayHandoffPage);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsPreferUserPickManaged() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeManagedStorage[StorageKeys.DISPLAY_HANDOFF_PAGE] = false;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertFalse(settings.displayHandoffPage);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsPreferUserPickDefault() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertTrue(settings.displayHandoffPage);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsManagedPolicyUrl() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.MANAGED_POLICY_URL] = 'mp_url';
    testModule.fakeSyncStorage[StorageKeys.MANAGED_POLICY_BASE_UPDATE_PERIOD] =
        42;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertEquals('mp_url', settings.managedPolicyUrl);
      assertEquals(42, settings.managedPolicyBaseUpdatePeriod);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsIncognitoIsolatedFalse() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.INCOGNITO_SANDBOX] = false;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertFalse(settings.incognitoIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsIncognitoIsolatedUnset() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;

    return loadSettings().then(function(settings) {
      assertEquals(Profiles.CORPORATE, settings.thisProfile);
      assertFalse(settings.incognitoIsolated);
    });
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsBadAclNotAnArray() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.PRIV_WHITELIST] = {test: true};

    return loadSettings().then(fail, function(e) {});
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsBadAclNotAnArrayOfTypeValuePairs() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.PRIV_WHITELIST] =
        [{type: AclEntryTags.MATCHPATTERN, value: '*://example.com/*'}, true];

    return loadSettings().then(fail, function(e) {});
  },


  /**
   * @return {!Promise}
   */
  testLoadSettingsGoodAcl() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.PRIV_WHITELIST] =
        ['https://aaa/*'].map(x => new MatchPatternEntry(x));

    return loadSettings().then(function(settings) {
      assertTrue(settings.acls[Profiles.CORPORATE].test('https://aaa/blah'));
    });
  },

  /**
   * @return {!Promise}
   */
  testLoadSettingsGlobalBlacklist() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeSyncStorage[StorageKeys.GLOBAL_BLACKLIST] =
        ['https://aaa/*'].map(x => new MatchPatternEntry(x));

    return loadSettings().then(function(settings) {
      assertTrue(settings.globalBlacklist.test('https://aaa/blah'));
    });
  },

  /**
   * @return {!Promise}
   */
  testLoadSettingsHaveManagedPolicyUrlNoCache() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeManagedStorage[StorageKeys.MANAGED_POLICY_URL] =
        'https://testmanagedpolicy/';
    return loadSettings().then(function(settings) {
      assertEquals('https://testmanagedpolicy/', settings.managedPolicyUrl);
      assertFalse(settings.globalBlacklist.test('http://global/'));
    });
  },

  /**
   * @return {!Promise}
   */
  testLoadSettingsHaveManagedPolicyUrlHaveCacheNoUrl() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeLocalStorage[StorageKeys.CACHED_WEBSERVICE_ACL] = {
      [StorageKeys.GLOBAL_BLACKLIST]: [new MatchPatternEntry('*://global/*')],
    };
    testModule.fakeManagedStorage[StorageKeys.MANAGED_POLICY_URL] =
        'https://testmanagedpolicy/';
    return loadSettings().then(function(settings) {
      assertEquals('https://testmanagedpolicy/', settings.managedPolicyUrl);
      assertTrue(settings.globalBlacklist.test('http://global/'));
    });
  },

  /**
   * @return {!Promise}
   */
  testLoadSettingsHaveManagedPolicyUrlHaveCacheSameUrl() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeLocalStorage[StorageKeys.CACHED_WEBSERVICE_ACL] = {
      [StorageKeys.MANAGED_POLICY_SOURCE]: 'https://testmanagedpolicy/',
      [StorageKeys.GLOBAL_BLACKLIST]: [new MatchPatternEntry('*://global/*')],
    };
    testModule.fakeManagedStorage[StorageKeys.MANAGED_POLICY_URL] =
        'https://testmanagedpolicy/';
    return loadSettings().then(function(settings) {
      assertEquals('https://testmanagedpolicy/', settings.managedPolicyUrl);
      assertTrue(settings.globalBlacklist.test('http://global/'));
    });
  },

  /**
   * @return {!Promise}
   */
  testLoadSettingsHaveManagedPolicyUrlHaveCacheDifferentUrl() {
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;
    testModule.fakeLocalStorage[StorageKeys.CACHED_WEBSERVICE_ACL] = {
      [StorageKeys.MANAGED_POLICY_SOURCE]: 'https://testmanagedpolicy2/',
      [StorageKeys.GLOBAL_BLACKLIST]: [new MatchPatternEntry('*://global/*')],
    };
    testModule.fakeManagedStorage[StorageKeys.MANAGED_POLICY_URL] =
        'https://testmanagedpolicy/';
    return loadSettings().then(function(settings) {
      assertEquals('https://testmanagedpolicy/', settings.managedPolicyUrl);
      assertFalse(settings.globalBlacklist.test('http://global/'));
    });
  },
});
