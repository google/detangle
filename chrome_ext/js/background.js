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
 * @fileoverview The main execution flow of the extension
 */

goog.module('detangle.Background');

const CHILD_PROFILE_TYPES = goog.require('detangle.CHILD_PROFILE_TYPES');
const Event = goog.require('detangle.Event');
const EventType = goog.require('detangle.EventType');
const LocalStorageSyncKeys = goog.require('detangle.LocalStorageSyncKeys');
const MANAGED_POLICY_UPDATE_ALARM = goog.require('detangle.MANAGED_POLICY_UPDATE_ALARM');
const NATIVE_MESSAGING_PORT = goog.require('detangle.NATIVE_MESSAGING_PORT');
const ProfileLabels = goog.require('detangle.ProfileLabels');
const Profiles = goog.require('detangle.Profiles');
const Settings = goog.require('detangle.Settings');
const StorageKeys = goog.require('detangle.StorageKeys');
const SyncStorageSyncKeys = goog.require('detangle.SyncStorageSyncKeys');
const fetchSyncData = goog.require('detangle.fetchSyncData');
const getAllEvents = goog.require('detangle.getAllEvents');
const getEvent = goog.require('detangle.getEvent');
const getProfile = goog.require('detangle.getProfile');
const isBlocked = goog.require('detangle.isBlocked');
const isOAuthEndpoint = goog.require('detangle.isOAuthEndpoint');
const loadSettings = goog.require('detangle.loadSettings');
const logEvent = goog.require('detangle.logEvent');
const oAuthEndpointHandler = goog.require('detangle.oAuthEndpointHandler');
const rescheduleWebServiceUpdates = goog.require('detangle.rescheduleWebServiceUpdates');
const updateFromWebService = goog.require('detangle.updateFromWebService');
const {cleanUrlForMatch} = goog.require('detangle.matchpatterns');
const {validateProfile} = goog.require('detangle.utils');


/**
 * WebRequest filter for onBeforeRequest events
 *
 * @private {!RequestFilter}
 */
const MAIN_FRAME_REQUEST_FILTER_ = /** @type {!RequestFilter} */ (
    {urls: ['http://*/*', 'https://*/*', 'ftp://*/*'], types: ['main_frame']});


/**
 * A request filter for requests that occur anywhere other than the main frame.
 *
 * @private {!RequestFilter}
 */
const SUB_FRAME_REQUEST_FILTER_ = /** @type {!RequestFilter} */ ({
  urls: ['http://*/*', 'https://*/*', 'ftp://*/*'],
  types: [
    'sub_frame', 'stylesheet', 'script', 'image', 'object', 'xmlhttprequest',
    'other'
  ]
});


/**
 * Storage keys that affect managed policy refresh.
 *
 * @private {!Array<StorageKeys>}
 */
const REMOTE_MANAGED_POLICY_KEYS_ = [
  StorageKeys.MANAGED_POLICY_URL,
  StorageKeys.MANAGED_POLICY_BASE_UPDATE_PERIOD,
  StorageKeys.MANAGED_POLICY_UPDATE_VARIATION,
];


/**
 * Unique IDs for context menu entries.
 *
 * @private
 * @enum {string}
 */
const ContextMenuIds_ = {
  STATUS: 'status',
  LAUNCH_REGULAR: 'launch_regular',
  LAUNCH_ISOLATED: 'launch_isolated',
  OPEN_IN_REGULAR: 'open_in_regular',
  OPEN_IN_ISOLATED: 'open_in_isolated',
};


/**
 * The background class represents the running state of the background page.
 */
class Background {
  constructor() {
    /**
     * The active settings.
     *
     * @type {?Settings}
     */
    this.settings = null;

    /**
     * Function that hands off URLs to other profiles.
     *
     * @type {function(!Profiles, (string|undefined), boolean=)}
     */
    this.handoff = this.nativeMessagingHandoff_;

    /**
     * Whether we can handoff.
     * @type {boolean}
     */
    this.canHandoff = true;

    /**
     * Function that reschdules webservice updates.
     *
     * We assign this imported symbol so that we can do concise unit tests.
     * @type {function(!Settings)}
     */
    this.rescheduleWebServiceUpdates = rescheduleWebServiceUpdates;

    /**
     * A set of tabIds that have visited a site that a user may want to go back
     * to.
     *
     * This is used for tabicide, so it doesn't count known redirectors etc.
     *
     * @const {!Set<number>}
     */
    this.tabsWithHistory = new Set();

    /**
     * A timeoutID for when a reload of settings is delayed.
     *
     * @type {?number}
     */
    this.reloadTimeout = null;
  }

  /**
   * Reloads the extensions settings and updates the extension state
   * accordingly.
   *
   * @this {!Background}
   * @return {!Promise<!Settings>}
   */
  reloadSettings() {
    return loadSettings()
        .then(settings => {
          this.settings = settings;
          this.reclassifyTabs();
          return settings;
        })
        .then(this.updateContextMenus.bind(this));
  }

  /**
   * Event handler for chrome.storage.onChanged.
   *
   * @this {!Background}
   * @param {!Object<string,StorageChange>} changes Changes that were made
   * @param {string} areaName Name of the area that was change
   */
  storageChangedHandler(changes, areaName) {
    /**
     * Decides whether we should sync to subordinate profiles.
     * @param {?Settings} settings
     * @return {boolean}
     */
    function shouldSync(settings) {
      if (!settings) {
        return false;
      }

      if (areaName == 'local' && StorageKeys.THIS_PROFILE in changes) {
        // If we changed THIS_PROFILE, always resync - this triggers firstRun.
        return true;
      }

      switch (areaName) {
        case 'sync':
          return SyncStorageSyncKeys.some(x => changes.hasOwnProperty(x));
        case 'local':
          return LocalStorageSyncKeys.some(x => changes.hasOwnProperty(x));
        default:
          return false;
      }
    }

    /**
     * Decides whether we should reschedule webservice updates.
     * @return {boolean}
     */
    function shouldReschedule() {
      if (areaName == 'local' && StorageKeys.THIS_PROFILE in changes) {
        return true;  // If we changed THIS_PROFILE, always reschedule.
      }

      return REMOTE_MANAGED_POLICY_KEYS_.some(
          key => changes.hasOwnProperty(key));
    }

    const /** function() */ reload = () => {
      this.reloadTimeout = null;
      this.reloadSettings()
          .then(
              settings => shouldSync(settings) ?
                  this.syncConfigToSubordinates(settings) :
                  settings)
          .then(
              settings => shouldReschedule() ?
                  this.rescheduleWebServiceUpdates(settings) :
                  settings)
          .catch(function(e) {
            console.warn('Settings reload failed: ' + e);
          });
    };

    if (this.reloadTimeout) {
      return;
    }

    if (areaName == 'managed' && changes[StorageKeys.MANAGED_POLICY_URL] &&
        !changes[StorageKeys.MANAGED_POLICY_URL].newValue) {
      console.log('Managed policy URL cleared, delaying reload for 45 seconds');
      this.reloadTimeout = setTimeout(reload, 45000);
      return;
    }

    reload();
  }

  /**
   * Synchronises configuration with subordinate browsers.
   *
   * @param {?Settings} settings The current global settings.
   * @return {!Promise<?Settings>}
   */
  syncConfigToSubordinates(settings) {
    if (!settings) {
      return Promise.reject(
          new Error('Attempt to sync config in unconfigured browser'));
    }

    if (settings.thisProfile != Profiles.CORPORATE) {
      return Promise.reject(
          new Error('Only the Corporate profile is allowed to sync'));
    }

    /** @type {!Array<!Promise>} */
    const promises =
        Object.keys(CHILD_PROFILE_TYPES)
            .map(
                targetProfile => fetchSyncData(
                                     /** @type {Profiles} */ (targetProfile))
                                     .then(syncData => {
                                       chrome.runtime.sendNativeMessage(
                                           NATIVE_MESSAGING_PORT, {
                                             command: 'sync',
                                             sync_data: syncData,
                                             profile: targetProfile
                                           });
                                     }));

    return Promise.all(promises).then(() => settings);
  }


  /**
   * Perform one-off steps that should be run on install or update.
   *
   * @suppress {checkTypes} chrome.privacy API doesn't have externs
   * @this {!Background}
   * @param {!Object} details Details object provided by
   *     chrome.runtime.onInstalled API.
   */
  installedHandler(details) {
    switch (details['reason']) {
      case 'install':
        this.cleanupFirstRun_();
        break;
      case 'update':
        this.onUpdate_(details['previousVersion']);
        break;
    }

    // Disable network prediction, since it will cause handoffs of random pages
    // you never clicked.
    chrome.privacy.network.networkPredictionEnabled.get({}, function(details) {
      if (details.levelOfControl === 'controllable_by_this_extension') {
        chrome.privacy.network.networkPredictionEnabled.set({value: false});
      }
    });

    this.reloadSettings().catch(e => {
      console.warn('Unable to reload settings:', e);
    });
  }

  /**
   * Updates the state of various extension pieces, such as context menus
   *
   * @param {!Settings} settings The runtime settings of the extension.
   * @return {!Settings} Pass through the Settings object
   */
  updateContextMenus(settings) {
    let regularEnabled = settings.thisProfile == Profiles.CORPORATE;
    let isolatedEnabled = settings.thisProfile == Profiles.CORPORATE ||
        settings.thisProfile == Profiles.REGULAR;

    chrome.contextMenus.removeAll(() => {
      // Show the detangle status
      chrome.contextMenus.create({
        id: ContextMenuIds_.STATUS,
        title: 'Running In: ' + ProfileLabels[settings.thisProfile],
        contexts: ['browser_action'],
      });
      chrome.contextMenus.create({
        id: 'browser_action_separator_1',
        type: 'separator',
        contexts: ['browser_action'],
      });

      // BrowserAction badge items to launch the browsers (no URL).
      chrome.contextMenus.create({
        id: ContextMenuIds_.LAUNCH_REGULAR,
        title: 'Launch ' + ProfileLabels[Profiles.REGULAR],
        contexts: ['browser_action'],
        enabled: regularEnabled,
      });
      chrome.contextMenus.create({
        id: ContextMenuIds_.LAUNCH_ISOLATED,
        title: 'Launch ' + ProfileLabels[Profiles.ISOLATED],
        contexts: ['browser_action'],
        enabled: isolatedEnabled,
      });

      // Link contextMenu items to open the URL in a specific browser,
      // regardless of policy.
      chrome.contextMenus.create({
        id: ContextMenuIds_.OPEN_IN_REGULAR,
        title: 'Open in ' + ProfileLabels[Profiles.REGULAR],
        contexts: ['link'],
        enabled: regularEnabled,
      });
      chrome.contextMenus.create({
        id: ContextMenuIds_.OPEN_IN_ISOLATED,
        title: 'Open in ' + ProfileLabels[Profiles.ISOLATED],
        contexts: ['link'],
        enabled: isolatedEnabled,
      });
    });

    return settings;
  }

  /**
   * Handles webRequest onBeforeRequest events for requests other than
   * main_frame requests (iframe, img, etc).
   *
   * @this {!Background}
   * @param {!Object} details webRequest.onBeforeRequest details object
   * @return {!BlockingResponse}
   */
  subFrameRequestHandler(details) {
    if (!this.settings) {
      return /** @type {!BlockingResponse} */ ({cancel: false});
    }

    // Don't block our own managed policy updates
    if (details.tabId == -1 && details.method == 'GET' &&
        details.type == 'xmlhttprequest' &&
        details.url == this.settings.managedPolicyUrl) {
      return /** @type {!BlockingResponse} */ ({cancel: false});
    }

    // typecast to non-null type
    const settings = /** @type {!Settings} */ (this.settings);

    if (isBlocked(settings, details.url)) {
      // TODO(michaelsamuel): When we either can test for the initiator or
      // (better) tell BeyondCorp extension to switch to "Off: Direct" in
      // Regular and Isolated browsers this should be removed.
      if (details.tabId == -1 && details.type == 'other' &&
          details.method == 'GET') {
        console.info('Not blocking background GET:', details);
        return /** @type {!BlockingResponse} */ ({cancel: false});
      }
      logEvent(
          EventType.BLACKLISTED, details.url, details.tabId,
          settings.thisProfile, {details});
      return /** @type {!BlockingResponse} */ ({cancel: true});
    } else if (isOAuthEndpoint(settings, details.url)) {
      const /** ?Event */ eventLogEntry =
          oAuthEndpointHandler(settings, details);
      if (eventLogEntry) {
        // Navigate the entire page away, not just the iframe
        chrome.tabs.update(
            details.tabId, {url: eventLogEntry.getInterceptedPage()});

        // Cancel the request - this doesn't cause a navigation because it's not
        // a main_frame request, so we don't need to do the javascript hack.
        return /** @type {!BlockingResponse} */ ({cancel: true});
      }
    }

    return /** @type {!BlockingResponse} */ ({cancel: false});
  }

  /**
   * Handles webRequest onBeforeRequest events for main_frame requests.
   *
   * @public
   * @this {!Background}
   * @param {!Object} details chrome.WebRequest details callback
   * @return {!BlockingResponse}
   */
  mainFrameRequestHandler(details) {
    if (!this.settings) {
      return /** @type {!BlockingResponse} */ ({cancel: false});
    }

    /** @type {string} */
    const url = details.url;

    // Cast to non-null type
    const settings = /** @type {!Settings} */ (this.settings);

    /**
     * Redirects the browser to the intercepted page.
     *
     * @param {!Event} eventLogEntry
     * @return {!BlockingResponse}
     */
    const intercept = eventLogEntry => {
      /** @type {boolean} */
      const displayInterceptedPage = settings.displayHandoffPage ||
          eventLogEntry.eventType != EventType.HANDOFF;

      if (displayInterceptedPage) {
        chrome.tabs.update(
            details.tabId, {url: eventLogEntry.getInterceptedPage()});
      } else {
        this.tabicide(details.tabId);
      }

      // An empty javascript URI won't add any history
      return /** @type {!BlockingResponse} */ ({redirectUrl: 'javascript:;'});
    };

    /**
     * Allows the webRequest to continue unmodified.
     *
     * Convenience function - just `return accept()`
     *
     * @return {!BlockingResponse}
     */
    const accept = () => /** @type {!BlockingResponse} */ ({cancel: false});

    // Guard: is the URL blocked?
    if (isBlocked(settings, url)) {
      return intercept(logEvent(
          EventType.BLACKLISTED, url, details.tabId, settings.thisProfile));
    }

    /** @type {!Profiles} */
    const targetProfile = getProfile(settings, url);
    if (targetProfile == settings.thisProfile) {
      // The URL would be handled by the current profile, just a couple of final
      // checks...

      // Guard: is the URL an OAuth endpoint?
      if (isOAuthEndpoint(settings, url)) {
        const eventLogEntry = oAuthEndpointHandler(settings, details);
        if (eventLogEntry) {
          return intercept(eventLogEntry);
        }
      }

      return accept();
    }

    if (details.method != 'GET') {
      return intercept(logEvent(
          EventType.SUBMISSION_BLOCKED, url, details.tabId, targetProfile));
    }

    // This is the workaround for devices that don't have the nativeMessaging
    // helper.
    if (!this.canHandoff) {
      return intercept(
          logEvent(EventType.NO_HANDOFF, url, details.tabId, targetProfile));
    }

    chrome.tabs.get(details.tabId, tab => {
      if (chrome.runtime.lastError) {
        console.warn(
            'Unable to get information about tab:', chrome.runtime.lastError,
            details);
        return;
      }
      this.handoff(targetProfile, url, tab.active);
    });
    return intercept(
        logEvent(EventType.HANDOFF, url, details.tabId, targetProfile));
  }

  /**
   * Removes tabs that never contained any useful history.
   *
   * @this {!Background}
   * @param {number} tabId
   */
  tabicide(tabId) {
    if (!this.tabsWithHistory.has(tabId)) {
      chrome.tabs.remove(tabId);
    }
  }

  /**
   * Tests whether we can launch URLs in the target profile.
   *
   * @this {!Background}
   * @param {Profiles} targetProfile profile we wish to launch
   * @return {boolean} Whether we should allow launching
   */
  canLaunch(targetProfile) {
    /** @type {boolean} */
    let canLaunch;
    switch (this.settings.thisProfile) {
      case Profiles.CORPORATE:
        canLaunch = targetProfile == Profiles.REGULAR ||
            targetProfile == Profiles.ISOLATED;
        break;
      case Profiles.REGULAR:
        canLaunch = targetProfile == Profiles.ISOLATED;
        break;
      default:
        canLaunch = false;
        break;
    }

    if (!canLaunch) {
      /** @type {string} */
      const targetLabel = ProfileLabels[targetProfile];
      /** @type {string} */
      const thisLabel = ProfileLabels[this.settings.thisProfile];
      console.warn('Cannot launch', targetLabel, 'from', thisLabel);
    }

    return canLaunch;
  }

  /**
   * Tests whether we should handoff in incognito mode
   *
   * @private
   * @this {!Background}
   * @param {Profiles} targetProfile profile we wish to launch
   * @return {boolean} Whether we should hand off in incognito mode
   */
  shouldLaunchIncognito_(targetProfile) {
    return (targetProfile == Profiles.ISOLATED) &&
        this.settings.incognitoIsolated;
  }

  /**
   * Hand off url to profile
   * @private
   * @this {!Background}
   * @param {!Profiles} profile Name of remote profile to hand off to
   * @param {(string|undefined)} url URL to be launched in remote profile
   * @param {boolean=} opt_raiseWindow Whether to raise the window of the target
   *     browser.
   */
  nativeMessagingHandoff_(profile, url, opt_raiseWindow) {
    if (!this.canLaunch(profile)) {
      console.warn('Not allowed to launch ' + ProfileLabels[profile]);
      return;
    }

    chrome.runtime.sendNativeMessage(NATIVE_MESSAGING_PORT, {
      command: 'launch',
      profile: profile,
      url: url,
      incognito: this.shouldLaunchIncognito_(profile),
      raise: !!opt_raiseWindow
    });
  }

  /**
   * Finds tabs that have sync_options.html running in them and reload
   * See b/28157940
   *
   * @private
   */
  cleanupFirstRun_() {
    let query = {url: chrome.runtime.getURL('sync_options.html') + '*'};
    chrome.tabs.query(query, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.create({url: tab.url}, () => {
          chrome.tabs.remove(tab.id);
        });
      });
    });
  }

  /**
   * Handles any changes for extension updates.
   * @private
   * @param {(string|undefined)} previousVersion Version that we're upgrading from
   */
  onUpdate_(previousVersion) {
    const promise = Promise.resolve();

    // TODO(michaelsamuel@): visual cue that the update failed
    promise.then(
        () => console.log('Detangle update complete'),
        (e) => console.warn('Detangle update failed:', e));
  }

  /**
   * Handles context menus item clicks.
   *
   * @this {!Background}
   * @param {!Object} info click info
   * @param {!Tab=} tab The tab that the click occurred on.
   */
  contextMenuHandler(info, tab) {
    switch (info.menuItemId) {
      case ContextMenuIds_.STATUS:
        chrome.runtime.openOptionsPage();
        break;
      case ContextMenuIds_.LAUNCH_REGULAR:
        this.handoff(Profiles.REGULAR, undefined, true);
        break;
      case ContextMenuIds_.LAUNCH_ISOLATED:
        this.handoff(Profiles.ISOLATED, undefined, true);
        break;
      case ContextMenuIds_.OPEN_IN_REGULAR:
        this.handoff(Profiles.REGULAR, info.linkUrl, true);
        break;
      case ContextMenuIds_.OPEN_IN_ISOLATED:
        this.handoff(Profiles.ISOLATED, info.linkUrl, true);
        break;
    }
  }

  /**
   * Handles commands via the chrome.commands API.
   *
   * @this {!Background}
   * @param {string} command ID of the command that executed.
   */
  commandHandler(command) {
    switch (command) {
      case 'launch_regular':
        this.handoff(Profiles.REGULAR, undefined, true);
        break;
      case 'launch_isolated':
        this.handoff(Profiles.ISOLATED, undefined, true);
        break;
    }
  }

  /**
   * Handles alarms.
   *
   * @this {!Background}
   * @param {!chrome.alarms.Alarm} alarm The alarm that was fired.
   */
  alarmHandler(alarm) {
    if (alarm.name == MANAGED_POLICY_UPDATE_ALARM) {
      updateFromWebService(
          this.settings.managedPolicyUrl, this.settings.managedPolicyETag)
          .then(
              () => {
                console.log(
                    'New managed policy retrieved from',
                    this.settings.managedPolicyUrl);
              },
              e => {
                if (e.status == 304) {
                  // File is unchanged (ETag matched).
                  return;
                }
                console.warn(
                    'Update of managed policy from web service failed:', e);
              });
    }
  }

  /**
   * Handles for chrome.runtime.onMessage events.
   *
   * @this {!Background}
   * @param {?} message The message.
   * @param {!MessageSender} sender Information about the sender of the message
   * @param {function(?)} sendResponse Send a response
   * @return {(boolean|undefined)}
   */
  messageHandler(message, sender, sendResponse) {
    if (!this.settings) {
      return;
    }

    /**
     * Refreshes the ACL from the managed policy web service.
     *
     * @return {!Promise<{success: boolean, error}>}
     */
    const refreshWebServiceAcl = () =>
        updateFromWebService(this.settings.managedPolicyUrl, null)
            .then(
                () => ({'success': true}),
                (err) => ({'success': false, 'error': err}));

    /**
     * Synchronizes config to subordinate profiles.
     *
     * @return {!Promise<{success: boolean, error}>}
     */
    const resync = () => this.syncConfigToSubordinates(this.settings)
                             .then(() => ({'success': true}))
                             .catch(e => ({'success': false, 'error': e.message}));

    /**
     * Launches a URL in the specified profile.
     */
    const launch = () => {
      const /** !Profiles */ targetProfile = validateProfile(message['profile']);
      this.handoff(targetProfile, message['url']);
    };

    /**
     * Retrieves the runtime status.
     *
     * @return {{running_in: !Profiles}}
     */
    const status = () => {
      return {
        'running_in': this.settings.thisProfile,
        'network_class': this.settings.networkClass || undefined,
      };
    };

    /**
     * Retrieves the event specified in the message.
     *
     * @return {(?Event|undefined)}
     */
    const getEventDetails = () => {
      if (message.eventId) {
        return getEvent(message['eventId']);
      } else {
        console.warn('Received getevent command with no eventId:', message);
      }
    };

    /**
     * Retrieves all event IDs.
     *
     * @return {!Array<!Event>}
     */
    const listEvents = () => getAllEvents();

    /**
     * Command
     * @const {!Object<string, function(): ?>}
     */
    const commands = {
      'launch': launch,
      'status': status,
      'getevent': getEventDetails,
      'refresh_webservice_acl': refreshWebServiceAcl,
      'listevents': listEvents,
      'resync': resync,
    };

    const /** string */ command = message['command'] || '';
    if (!command) {
      console.warn('messageHandler: No command in message from', sender, message);
      return;
    }

    if (!commands.hasOwnProperty(command)) {
      console.warn(
          'messageHandler: Invalid/unsupported command:', command,
          'in message from', sender);
      return;
    }

    const response = commands[command]();
    if (response) {
      sendResponse(response);
    }
  }

  /**
   * Tests the OS/platform that we're running on and sets appropriate variables.
   *
   * @this {!Background}
   */
  testPlatform() {
    // TODO(michaelsamuel): Our nativeMessaging host doesn't reply, but when we
    // fix that, this belongs in the .then()
    this.canHandoff = true;

    chrome.runtime.sendNativeMessage(
        NATIVE_MESSAGING_PORT, {command: 'noop'}, () => {
          if (chrome.runtime.lastError) {
            console.info(
                'Native messaging handoff not available:',
                chrome.runtime.lastError.message);
            this.canHandoff = false;
          }
        });
  }

  /**
   * Marks whether the tab has history.
   *
   * @this {!Background}
   * @param {number} tabId
   * @param {(string|undefined)} url The URL the tab is currently viewing.
   */
  markTabHistory(tabId, url) {
    if (!url) {
      return;
    }

    try {
      const cleanUrl = cleanUrlForMatch(url);
      if (!this.settings.redirectorsRegExp.test(cleanUrl)) {
        this.tabsWithHistory.add(tabId);
      }
    } catch (e) {
      console.warn('Unable to decode URL for tab', tabId, url, e);
    }
  }

  /**
   * Handles the chrome.tabs.onUpdate event.
   *
   * @this {!Background}
   * @param {number} tabId
   * @param {!Object} changeInfo
   * @param {!Tab} tab
   */
  onTabUpdated(tabId, changeInfo, tab) {
    this.markTabHistory(tabId, changeInfo.url);
  }

  /**
   * Handles the chrome.tabs.onCreate event.
   *
   * @this {!Background}
   * @param {!Tab} tab
   */
  onTabCreated(tab) {
    this.markTabHistory(tab.id, tab.url);
  }

  /**
   * Handles the chrome.tabs.onRemoved event.
   *
   * @this {!Background}
   * @param {number} tabId
   * @param {!Object} removeInfo
   */
  onTabRemoved(tabId, removeInfo) {
    this.tabsWithHistory.delete(tabId);
  }

  /**
   * Reclassifies tabs.
   *
   * This is done on settings reload to ensure consistent behaviour - eg. if
   * the list of redirectors changes.
   *
   * @this {!Background}
   */
  reclassifyTabs() {
    if (!this.settings) {
      return;
    }

    chrome.tabs.query({}, tabs => {
      this.tabsWithHistory.clear();
      for (const tab of tabs) {
        this.markTabHistory(tab.id, tab.url);
      }
    });
  }

  /**
   * Adds all event listeners, loads settings, and starts webservice-based
   * managed configuration polling.
   */
  start() {
    // Add all event listeners
    chrome.alarms.onAlarm.addListener(this.alarmHandler.bind(this));
    chrome.commands.onCommand.addListener(this.commandHandler.bind(this));
    chrome.contextMenus.onClicked.addListener(
        this.contextMenuHandler.bind(this));
    chrome.runtime.onInstalled.addListener(this.installedHandler.bind(this));
    chrome.runtime.onMessage.addListener(this.messageHandler.bind(this));
    chrome.storage.onChanged.addListener(this.storageChangedHandler.bind(this));
    chrome.tabs.onCreated.addListener(this.onTabCreated.bind(this));
    chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));
    chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
    chrome.webRequest.onBeforeRequest.addListener(
        this.mainFrameRequestHandler.bind(this), MAIN_FRAME_REQUEST_FILTER_,
        ['blocking', 'requestBody']);
    chrome.webRequest.onBeforeRequest.addListener(
        this.subFrameRequestHandler.bind(this), SUB_FRAME_REQUEST_FILTER_,
        ['blocking', 'requestBody']);

    // Asynchronously test for platform features.  This has a data race, but is
    // the best we can do until nativeMessaging returns something.
    this.testPlatform();

    this.reloadSettings()
        .then(this.rescheduleWebServiceUpdates)
        .then(_ => {
          console.log('Settings loaded.');
        })
        .catch(e => {
          console.warn('Failed to load settings:', e);
          chrome.contextMenus.create({
            id: ContextMenuIds_.STATUS,
            title: 'Please Configure Detangle',
            contexts: ['browser_action'],
          });
        });
  }
}
exports = Background;

if (chrome && chrome.runtime && chrome.runtime.id) {
  const background = new Background();
  background.start();
}
