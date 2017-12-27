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
 * @fileoverview Tests for background.js
 */

goog.module('detangle.BackgroundTest');

goog.setTestOnly();

const Acl = goog.require('detangle.Acl');
const Background = goog.require('detangle.Background');
const Event = goog.require('detangle.Event');
const EventType = goog.require('detangle.EventType');
const MockControl = goog.require('goog.testing.MockControl');
const Profiles = goog.require('detangle.Profiles');
const Settings = goog.require('detangle.Settings');
const StorageKeys = goog.require('detangle.StorageKeys');
const clearEventLog = goog.require('detangle.clearEventLog');
const mockmatchers = goog.require('goog.testing.mockmatchers');
const testModule = goog.require('detangle.test');
const testSuite = goog.require('goog.testing.testSuite');
const {MatchPatternEntry} = goog.require('detangle.aclentries');
goog.require('goog.testing.asserts');


/**
 * Build a stub Request so that we can test the intercept methods.
 *
 * @private
 */
class StubRequest_ {
  /**
   * @param {string} url
   * @param {?string=} opt_method
   * @param {?string=} opt_type
   * @param {number=} opt_tabId
   */
  constructor(url, opt_method, opt_type, opt_tabId) {
    this.url = url;
    this.method = opt_method || 'GET';
    this.type = opt_type || 'main_frame';
    this.tabId = opt_tabId === undefined ? 42 : opt_tabId;
  }
}


/**
 * A MockControl object.
 *
 * Setting type to unknown because MockInterface isn't callable, but all
 * instances of them are...
 *
 * @type {?}
 */
let mockControl;


/**
 * @type {!Background}
 */
let background;


/**
 * @enum {!mockmatchers.ArgumentMatcher}
 */
const matchers = {
  // The argument is the intercepted page (from chrome.runtime.getURL).
  INTERCEPTED_URL: new mockmatchers.ArgumentMatcher(
      url => url.startsWith('intercepted.html#'), 'INTERCEPTED_URL'),

  // Function was called with a Settings object.
  SETTINGS_OBJECT: new mockmatchers.ArgumentMatcher(
      settings => settings instanceof Settings, 'SETTINGS_OBJECT'),

  // Argument to chrome.tabs.update when a URL is blocked.
  INTERCEPTED_DETAILS_URL: new mockmatchers.ArgumentMatcher(
      details => details['url'].startsWith('./intercepted.html'),
      'INTERCEPTED_DETAILS_URL'),
};


/**
 * Waits for async events to settle down, then flush the dom and resolves the
 * promise.
 *
 * @return {!Promise}
 */
function wait() {
  return new Promise(function(resolve) {
    window.setTimeout(function() {
      resolve();
    }, 100);
  });
}


/**
 * Creates mocks for mainFrameRequestHandler::intercept() with fakeEvent as the
 * event ID.
 *
 * @public
 */
function mockIntercept() {
  mockControl
      .createMethodMock(chrome.runtime, 'getURL')(matchers.INTERCEPTED_URL)
      .$returns('./intercepted.html#fakeEvent');
  mockControl.createMethodMock(chrome.tabs, 'update')(
      42, matchers.INTERCEPTED_DETAILS_URL);
}


/**
 * Like logEvent, but with fixed event ID and timestamp.
 *
 * @param {!EventType} eventType type of event
 * @param {string} url URL that was handed off
 * @param {?Profiles} targetProfile profile that should've opened url
 * @return {!Event}
 */
function fakeEvent(eventType, url, targetProfile) {
  return new Event('fakeEvent', eventType, url, 42, targetProfile, 1);
}


/**
 * Creates some test whitelists.
 * @return {!Object<!Profiles, !Acl>}
 */
function createTestWhiteLists() {
  return {
    [Profiles.CORPORATE]: new Acl({
      managedEntries: [
        new MatchPatternEntry('*://testcorporate/*'),
        new MatchPatternEntry('https://accounts.google.com/*'),
      ]
    }),
    [Profiles.REGULAR]:
        new Acl({managedEntries: [new MatchPatternEntry('*://testregular/*')]}),
    [Profiles.ISOLATED]: new Acl(
        {managedEntries: [new MatchPatternEntry('*://testisolated/*')]}),
  };
}

/**
 * Creates some test blacklists.
 * @return {!Object<!Profiles, !Acl>}
 */
function createTestBlackLists() {
  return {
    [Profiles.CORPORATE]: new Acl({
      managedEntries: [new MatchPatternEntry('*://testcorporate/blacklisted')]
    }),
    [Profiles.REGULAR]: new Acl({
      managedEntries: [new MatchPatternEntry('*://testregular/blacklisted')]
    }),
    [Profiles.ISOLATED]: new Acl({
      managedEntries: [new MatchPatternEntry('*://testisolated/blacklisted')]
    }),
  };
}


testSuite({
  setUp() {
    testModule.setupChromeTests();
    mockControl = new MockControl();
    background = new Background();
    background.handoff = () => {
      fail('Handoff called');
      return Promise.reject(new Error('Stub Handoff Called'));
    };
    clearEventLog();
  },

  tearDown() {
    mockControl.$tearDown();
  },

  testMainFrameRequestHandlerNoHandoff() {
    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    const req = new StubRequest_('https://testcorporate/');
    const result = background.mainFrameRequestHandler(req);
    assertFalse(result.cancel);
  },

  testMainFrameRequestHandlerNoHandoffPost() {
    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    const req = new StubRequest_('https://testcorporate/', 'POST');
    const result = background.mainFrameRequestHandler(req);
    assertFalse(result.cancel);
  },

  testMainFrameRequestHandlerIsOAuthInProfile() {
    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    const req = new StubRequest_(
        'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=https%3A%2F%2Ftestcorporate%2F' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline');
    const result = background.mainFrameRequestHandler(req);
    assertFalse(result.cancel);
  },

  testMainFrameRequestHandlerIsOAuthOutOfProfile() {
    mockIntercept();
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    const req = new StubRequest_(
        'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=https%3A%2F%2Ftestisolated%2F' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);

    mockControl.$verifyAll();
  },

  testMainFrameRequestHandlerHandoff() {
    mockControl
        .createMethodMock(chrome.tabs, 'get')(42, mockmatchers.isFunction)
        .$does(function(tabId, callback) {
          callback({active: true, id: tabId});
        });
    mockControl
        .createMethodMock(background, 'handoff')(
            Profiles.REGULAR, 'https://testregular/', true)
        .$returns(Promise.resolve(undefined));
    mockControl.createMethodMock(background, 'tabicide');
    mockIntercept();
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      displayHandoffPage: true,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    background.canHandoff = true;
    const req = new StubRequest_('https://testregular/');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);
    // TODO(michaelsamuel): Assert stuff about event log

    return wait().then(() => {
      mockControl.$verifyAll();
    });
  },

  testMainFrameRequestHandlerHandoffNoNativeMessaging() {
    mockControl.createMethodMock(background, 'tabicide');
    mockIntercept();
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    background.canHandoff = false;
    const req = new StubRequest_('https://testregular/');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);
    // TODO(michaelsamuel): Assert stuff about event log

    return wait().then(() => {
      mockControl.$verifyAll();
    });
  },

  testMainFrameRequestHandlerHandoffIsolated() {
    mockControl
        .createMethodMock(chrome.tabs, 'get')(42, mockmatchers.isFunction)
        .$does(function(tabId, callback) {
          callback({active: true, id: tabId});
        });
    mockControl
        .createMethodMock(background, 'handoff')(
            Profiles.ISOLATED, 'https://testisolated/', true)
        .$returns(Promise.resolve(undefined));
    mockControl.createMethodMock(background, 'tabicide');
    mockIntercept();
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      displayHandoffPage: true,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    background.canHandoff = true;
    const req = new StubRequest_('https://testisolated/');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);
    // TODO(michaelsamuel): Assert stuff about event log

    return wait().then(() => {
      mockControl.$verifyAll();
    });
  },

  testMainFrameRequestHandlerPost() {
    mockIntercept();
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    const req = new StubRequest_('https://testregular/', 'POST');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);
    // TODO(michaelsamuel): Assert stuff about event log

    mockControl.$verifyAll();
  },

  testMainFrameRequestHandlerBlacklisted() {
    mockIntercept();
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    const req = new StubRequest_('https://testcorporate/blacklisted', 'GET');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);
    // TODO(michaelsamuel): Assert stuff about event log

    mockControl.$verifyAll();
  },

  /**
   * Tests that the tab is considered for tabicide when we handoff and
   * displayHandoffPage is false.
   *
   * @return {!Promise}
   */
  testMainFrameRequestHandlerHandoffTabicide() {
    const chromeTabsGet = mockControl.createMethodMock(chrome.tabs, 'get');
    chromeTabsGet(42, mockmatchers.isFunction).$does(function(tabId, callback) {
      callback({active: true, id: tabId});
    });
    mockControl
        .createMethodMock(background, 'handoff')(
            Profiles.REGULAR, 'https://testregular/', true)
        .$returns(Promise.resolve(undefined));
    mockControl.createMethodMock(background, 'tabicide')(42);
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
      displayHandoffPage: false,
    });
    background.canHandoff = true;
    const req = new StubRequest_('https://testregular/');
    const result = background.mainFrameRequestHandler(req);
    assertEquals('javascript:;', result.redirectUrl);
    // TODO(michaelsamuel): Assert stuff about event log

    return wait().then(() => {
      mockControl.$verifyAll();
    });
  },

  testTabicideNoHistory() {
    mockControl.createMethodMock(chrome.tabs, 'remove')(42);
    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.tabicide(42);

    mockControl.$verifyAll();
  },

  testTabicideHasHistory() {
    mockControl.createMethodMock(chrome.tabs, 'remove');
    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.tabsWithHistory.add(42);
    background.tabicide(42);

    mockControl.$verifyAll();
  },

  testMarkTabHistoryUndefined() {
    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.markTabHistory(42, undefined);
    assertFalse(background.tabsWithHistory.has(42));
  },

  testMarkTabHistoryEmptyString() {
    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.markTabHistory(42, '');
    assertFalse(background.tabsWithHistory.has(42));
  },

  testMarkTabHistoryRedirector() {
    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.markTabHistory(42, 'https://www.google.com/url?q=blah');
    assertFalse(background.tabsWithHistory.has(42));
  },

  testMarkTabHistoryInvalidUrl() {
    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.markTabHistory(42, 'XXXXX');
    assertFalse(background.tabsWithHistory.has(42));
  },

  testMarkTabHistoryLegit() {
    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.markTabHistory(42, 'https://www.example.com/');
    assertTrue(background.tabsWithHistory.has(42));
  },

  testCanLaunchFromCorporate() {
    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    assertFalse(background.canLaunch(Profiles.CORPORATE));
    assertTrue(background.canLaunch(Profiles.REGULAR));
    assertTrue(background.canLaunch(Profiles.ISOLATED));
  },

  testCanLaunchFromRegular() {
    background.settings = new Settings({thisProfile: Profiles.REGULAR});
    assertFalse(background.canLaunch(Profiles.CORPORATE));
    assertFalse(background.canLaunch(Profiles.REGULAR));
    assertTrue(background.canLaunch(Profiles.ISOLATED));
  },

  testCanLaunchFromIsolated() {
    background.settings = new Settings({thisProfile: Profiles.ISOLATED});
    assertFalse(background.canLaunch(Profiles.CORPORATE));
    assertFalse(background.canLaunch(Profiles.REGULAR));
    assertFalse(background.canLaunch(Profiles.ISOLATED));
  },

  testMessageHandlerStatusCorporate() {
    let response;
    const sender = /** @type {!MessageSender} */ ({});

    function sendResponse(x) {
      response = x;
    }

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    background.messageHandler({command: 'status'}, sender, sendResponse);
    assertEquals(Profiles.CORPORATE, response.running_in);
  },

  testMessageHandlerStatusRegular() {
    let response;
    const sender = /** @type {!MessageSender} */ ({});

    function sendResponse(x) {
      response = x;
    }

    background.settings = new Settings({thisProfile: Profiles.REGULAR});
    background.messageHandler({command: 'status'}, sender, sendResponse);
    assertEquals(Profiles.REGULAR, response.running_in);
  },

  testMessageHandlerStatusIsolated() {
    let response;
    const sender = /** @type {!MessageSender} */ ({});

    function sendResponse(x) {
      response = x;
    }

    background.settings = new Settings({thisProfile: Profiles.ISOLATED});
    background.messageHandler({command: 'status'}, sender, sendResponse);
    assertEquals(Profiles.ISOLATED, response.running_in);
  },

  /**
   * Tests that when storage is changed from unconfigured -> CORPORATE that sync
   * native messages are sent.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerInitialConfigure() {
    const fakeSettings = new Settings({thisProfile: Profiles.CORPORATE});
    background.settings = null;
    testModule.fakeLocalStorage[StorageKeys.THIS_PROFILE] = Profiles.CORPORATE;

    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(fakeSettings));
    mockControl
        .createMethodMock(
            background, 'syncConfigToSubordinates')(matchers.SETTINGS_OBJECT)
        .$returns(fakeSettings);
    mockControl
        .createMethodMock(
            background, 'rescheduleWebServiceUpdates')(matchers.SETTINGS_OBJECT)
        .$returns(fakeSettings);

    mockControl.$replayAll();

    const changes = {};
    changes[StorageKeys.THIS_PROFILE] = {'new_value': Profiles.CORPORATE};
    background.storageChangedHandler(changes, 'local');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that when storage is changed in a configured REGULAR profile that
   * native messages are NOT sent, but loadSettings is.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerRunningInRegular() {
    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(new Settings({thisProfile: Profiles.REGULAR})));
    mockControl.createMethodMock(chrome.runtime, 'sendNativeMessage');
    mockControl.createMethodMock(background, 'rescheduleWebServiceUpdates');
    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.REGULAR});
    const changes = {};
    background.storageChangedHandler(changes, 'sync');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that when storage is changed in a configured CORPORATE profile that
   * native messages are sent.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerRunningInCorporateResceduledNeeded() {
    const newSettings = new Settings({thisProfile: Profiles.CORPORATE});
    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(newSettings));
    mockControl
        .createMethodMock(
            background, 'syncConfigToSubordinates')(matchers.SETTINGS_OBJECT)
        .$returns(newSettings);
    mockControl
        .createMethodMock(
            background, 'rescheduleWebServiceUpdates')(matchers.SETTINGS_OBJECT)
        .$returns(newSettings);
    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    const changes = {
      [StorageKeys.MANAGED_POLICY_URL]:
          {newValue: 'https://www.example.com/managed_policy.json'},
    };
    background.storageChangedHandler(changes, 'sync');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that when storage is changed in a configured CORPORATE profile that
   * native messages are sent.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerRunningInCorporateSyncNeeded() {
    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(new Settings({thisProfile: Profiles.CORPORATE})));
    mockControl
        .createMethodMock(
            background, 'syncConfigToSubordinates')(matchers.SETTINGS_OBJECT)
        .$returns(background.settings);

    // We're not changing any keys that will reschedule web service updates
    mockControl.createMethodMock(background, 'rescheduleWebServiceUpdates');

    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    const changes = {};
    changes[StorageKeys.DISPLAY_HANDOFF_PAGE] = {newValue: false};
    background.storageChangedHandler(changes, 'sync');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that when storage is changed in a configured CORPORATE profile that
   * native messages are sent.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerRunningInCorporateSyncAndRescheduleNeeded() {
    const newSettings = new Settings({thisProfile: Profiles.CORPORATE});
    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(newSettings));
    mockControl
        .createMethodMock(
            background, 'syncConfigToSubordinates')(matchers.SETTINGS_OBJECT)
        .$returns(newSettings);
    mockControl
        .createMethodMock(
            background, 'rescheduleWebServiceUpdates')(matchers.SETTINGS_OBJECT)
        .$returns(newSettings);

    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    const changes = {
      [StorageKeys.DISPLAY_HANDOFF_PAGE]: {newValue: false},
      [StorageKeys.MANAGED_POLICY_UPDATE_VARIATION]: {newValue: 40},
    };
    background.storageChangedHandler(changes, 'sync');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that when storage is changed in a configured CORPORATE profile that
   * sync isn't performed when no relevant keys change.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerRunningInCorporateNoRelevantChanges() {
    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(new Settings({thisProfile: Profiles.CORPORATE})));

    // We're not changing any keys that will trigger a sync
    mockControl.createMethodMock(background, 'syncConfigToSubordinates');

    // We're not changing any keys that will reschedule web service updates
    mockControl.createMethodMock(background, 'rescheduleWebServiceUpdates');

    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    const changes = {};
    background.storageChangedHandler(changes, 'sync');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that sync isn't trigged when managed storage changes in a configured
   * CORPORATE profile.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerRunningInCorporateManagedChange() {
    mockControl.createMethodMock(background, 'reloadSettings')().$returns(
        Promise.resolve(new Settings({thisProfile: Profiles.CORPORATE})));
    mockControl.createMethodMock(chrome.runtime, 'sendNativeMessage');
    mockControl.createMethodMock(background, 'rescheduleWebServiceUpdates');
    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    const changes = {
      [StorageKeys.DISPLAY_HANDOFF_PAGE]: {newValue: false},
    };
    background.storageChangedHandler(changes, 'managed');

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  /**
   * Tests that when the managed policy URL is cleared reload is delayed.
   *
   * @return {!Promise}
   */
  testStorageChangedHandlerManagedPolicyUrlCleared() {
    mockControl.createMethodMock(background, 'reloadSettings');
    mockControl.createMethodMock(background, 'syncConfigToSubordinates');
    mockControl.createMethodMock(background, 'rescheduleWebServiceUpdates');
    mockControl.$replayAll();

    background.settings = new Settings({thisProfile: Profiles.CORPORATE});
    const changes = {
      [StorageKeys.MANAGED_POLICY_URL]:
          {oldValue: 'https://www.example.com/managed_policy.json'},
    };
    background.storageChangedHandler(changes, 'managed');

    assertNotNull(background.reloadTimeout);
    const t = background.reloadTimeout;
    background.storageChangedHandler(changes, 'managed');
    assertEquals(t, background.reloadTimeout);
    clearTimeout(background.reloadTimeout);

    return wait().then(function() {
      mockControl.$verifyAll();
    });
  },

  testSubFrameRequestHanderNoSettings() {
    background.settings = null;

    let details = new StubRequest_('https://www.google.com/blacklisted');
    let response = background.subFrameRequestHandler(details);
    assertFalse(response.cancel);
  },

  testSubFrameRequestHanderNotBlacklisted() {
    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    let details = new StubRequest_('https://testregular/notblacklisted');
    let response = background.subFrameRequestHandler(details);
    assertFalse(response.cancel);
  },

  testSubFrameRequestHanderBlacklisted() {
    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    mockControl.createMethodMock(chrome.tabs, 'update');
    mockControl.$replayAll();

    let details = new StubRequest_('https://testcorporate/blacklisted');
    let response = background.subFrameRequestHandler(details);
    assertTrue(response.cancel);
    // TODO(michaelsamuel): Assert stuff about event log

    mockControl.$verifyAll();
  },

  testSubFrameRequestHanderOAuth() {
    mockControl
        .createMethodMock(chrome.runtime, 'getURL')(matchers.INTERCEPTED_URL)
        .$returns('./intercepted.html#fakeEvent');
    mockControl.createMethodMock(chrome.tabs, 'update')(
        42, matchers.INTERCEPTED_DETAILS_URL);
    mockControl.$replayAll();

    background.settings = new Settings({
      thisProfile: Profiles.CORPORATE,
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });
    let details = new StubRequest_('https://accounts.google.com/o/oauth2/auth');
    let response = background.subFrameRequestHandler(details);
    assertTrue(response.cancel);
    // TODO(michaelsamuel): Assert stuff about event log

    mockControl.$verifyAll();
  },

  testSubFrameRequestHanderManagedPolicyUpdate() {
    background.settings = new Settings({
      thisProfile: Profiles.REGULAR,
      managedPolicyUrl: 'https://testregular/blacklisted',
      acls: createTestWhiteLists(),
      blackLists: createTestBlackLists(),
    });

    const details = new StubRequest_(
        'https://testregular/blacklisted', 'GET', 'xmlhttprequest', -1);
    const response = background.subFrameRequestHandler(details);
    assertFalse(response.cancel);
  },
});
