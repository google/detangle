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
 * @fileoverview Package constants, etc.  No code.
 */

'use strict';


goog.provide('detangle.ACL_STORAGE');
goog.provide('detangle.AclEntryTags');
goog.provide('detangle.CHILD_PROFILE_TYPES');
goog.provide('detangle.EventType');
goog.provide('detangle.MANAGED_POLICY_UPDATE_ALARM');
goog.provide('detangle.NATIVE_MESSAGING_PORT');
goog.provide('detangle.ProfileIcons');
goog.provide('detangle.ProfileLabels');
goog.provide('detangle.Profiles');
goog.provide('detangle.REDIRECTORS');
goog.provide('detangle.REQUEST_FILTER');
goog.provide('detangle.StorageKeys');
goog.provide('detangle.ThemeIds');
goog.provide('detangle.ToggleSetting');
goog.provide('detangle.ToggleSettings');
goog.provide('detangle.WELL_KNOWN_OAUTH_ENDPOINTS');


/**
 * Name of port that nativeMessaging host is listening on
 * @package {string}
 * @const
 */
detangle.NATIVE_MESSAGING_PORT = 'com.google.corp.detangle';


/**
 * Key where the this_profile is stored in chrome.storage.local and/or
 * chrome.storage.managed.
 *
 * We need to update managed_storage_schema.json if we add/change any
 * keys that are valid in managed storage.
 *
 * @enum {string}
 * @const
 */
detangle.StorageKeys = {
  DEFAULT_SANDBOX: 'default_sandbox',
  DISPLAY_HANDOFF_PAGE: 'display_handoff_page',
  GLOBAL_BLACKLIST: 'global_blacklist',
  INCOGNITO_SANDBOX: 'incognito_sandbox',
  REGULAR_BLACKLIST: 'regular_blacklist',
  REGULAR_WHITELIST: 'regular_whitelist',
  PRIV_BLACKLIST: 'priv_blacklist',
  PRIV_WHITELIST: 'priv_whitelist',
  RISKY_BLACKLIST: 'risky_blacklist',
  RISKY_WHITELIST: 'risky_whitelist',
  THIS_PROFILE: 'this_profile',
  MANAGED_POLICY_URL: 'managed_policy_url',
  MANAGED_POLICY_BASE_UPDATE_PERIOD: 'managed_policy_base_update_period',
  MANAGED_POLICY_UPDATE_VARIATION: 'managed_policy_update_variation',
  MANAGED_POLICY_ETAG: 'managed_policy_etag',
  MANAGED_POLICY_SOURCE: 'managed_policy_source',
  CACHED_WEBSERVICE_ACL: 'cached_webservice_acl',
  MANAGED_POLICY_LAST_UPDATED: 'managed_policy_last_updated',
  NETWORK_CLASS: 'network_class',
};

/**
 * Profile name strings
 * @enum {string}
 * @const
 */
detangle.Profiles = {
  CORPORATE: 'CORPORATE',
  REGULAR: 'REGULAR',
  ISOLATED: 'ISOLATED'
};


/**
 * Our suggest themes for each profile.
 *
 * @type {!Object<(!detangle.Profiles|string),string>}
 */
detangle.ThemeIds = {};
detangle.ThemeIds[detangle.Profiles.CORPORATE] =
    'ebbkmbgkdagmjklbhefggnoniddjjmfb';
detangle.ThemeIds[detangle.Profiles.REGULAR] =
    'lihnhkhinlpdgngkgdnkblkkfeblnfng';
detangle.ThemeIds[detangle.Profiles.ISOLATED] =
    'enkldocjnkcnjhiophdfcbmbmcpdgajn';


/** @typedef {{label: string, preferManaged: boolean, default: boolean}} */
detangle.ToggleSetting;


/**
 * Settings for how toggles behave and appear.
 *
 * @type {!Object<detangle.StorageKeys, !detangle.ToggleSetting>}
 * @const
 */
detangle.ToggleSettings = Object.freeze({
  [detangle.StorageKeys.DEFAULT_SANDBOX]: Object.freeze({
    label: 'Send to the Isolated browser by default',
    preferManaged: true,
    default: false
  }),
  [detangle.StorageKeys.INCOGNITO_SANDBOX]: Object.freeze({
    label: 'Launch Isolated sites in incognito mode',
    preferManaged: true,
    default: false
  }),
  [detangle.StorageKeys.DISPLAY_HANDOFF_PAGE]: Object.freeze({
    label: 'Display the intercepted page for handoff events',
    preferManaged: false,
    default: true
  }),
});


/**
 * Friendly labels for profiles
 *
 * TODO(b/28027995): i18n
 * @public {!Object<detangle.Profiles, string>}
 * @const
 */
detangle.ProfileLabels = Object.freeze({
  [detangle.Profiles.CORPORATE]: 'Corporate',
  [detangle.Profiles.REGULAR]: 'Regular',
  [detangle.Profiles.ISOLATED]: 'Isolated',
});


/**
 * Friendly icons for profiles
 *
 * TODO(b/28027995): i18n
 * @public {!Object<detangle.Profiles, string>}
 */
detangle.ProfileIcons = Object.freeze({
  [detangle.Profiles.CORPORATE]: 'work',
  [detangle.Profiles.REGULAR]: 'face',
  [detangle.Profiles.ISOLATED]: 'block',
});


/**
 * Allowed profile types for children.
 *
 * This is effectively used to test set membership and validate.
 *
 * @package {!Object<detangle.Profiles, boolean>}
 * @const
 */
detangle.CHILD_PROFILE_TYPES = Object.freeze({
  [detangle.Profiles.REGULAR]: true,
  [detangle.Profiles.ISOLATED]: true,
});


/**
 * Types of events that can occour
 * @const
 * @enum {string}
 * @public
 */
detangle.EventType = {
  BLACKLISTED: 'blacklisted',
  HANDOFF: 'handoff',
  NO_HANDOFF: 'no_handoff',
  SUBMISSION_BLOCKED: 'submission_blocked',
  OAUTH_BLOCKED: 'oauth_blocked',
  OAUTH_INVALID: 'oauth_invalid',
};


/**
 * Well known OAuth authorization endpoints.
 *
 * This is a list of match patterns which are used as a webRequest filter to
 * ensure the onBeforeSendHeaders handler is only called for actual OAuth
 * endpoints.
 *
 * @const
 * @package {!Array<string>}
 */
detangle.WELL_KNOWN_OAUTH_ENDPOINTS = [
  'https://accounts.google.com/o/oauth2/auth',
  'https://accounts.google.com/o/oauth2/v2/auth',
];


/**
 * Well known redirectors.
 *
 * This is a list of match patterns which are used as a webRequest filter to
 * close handed off tabs where a redirector is the only thing that ran in the
 * tab prior to the handed off URL.
 *
 * @const
 * @package {!Array<string>}
 */
detangle.REDIRECTORS = [
  '*://www.google.com/url',
  '*://goo.gl/*',
];


/**
 * Tags for serialized Acl entries.
 *
 * @enum {string}
 */
detangle.AclEntryTags = {
  MATCHPATTERN: 'matchpattern',
  REGEXP: 'regexp',
  NETBLOCK: 'netblock',
};


/**
 * The name of the alarm that managed policy updates are scheduled on.
 *
 * @const {string}
 */
detangle.MANAGED_POLICY_UPDATE_ALARM = 'managed_policy_update';
