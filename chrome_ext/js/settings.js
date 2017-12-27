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
 * @fileoverview The global settings for the extension.
 */

goog.module('detangle.Settings');
goog.module.declareLegacyNamespace();

const Acl = goog.require('detangle.Acl');
const Profiles = goog.require('detangle.Profiles');
const REDIRECTORS = goog.require('detangle.REDIRECTORS');
const WELL_KNOWN_OAUTH_ENDPOINTS = goog.require('detangle.WELL_KNOWN_OAUTH_ENDPOINTS');
const {matchPatternsToRegExp} = goog.require('detangle.matchpatterns');
const {validateProfile} = goog.require('detangle.utils');

/**
 * The running state for the extension.  This is mostly used as a global
 * variable in the background page, although other pages may use
 * detangle.loadSettings() to get a copy of it too.
 *
 * Note that loading from storage is inherently asynchronous, so if you need a
 * Settings object in a synchronous context, you will need to load them
 * beforehand.
 *
 * @package
 * @final
 */
class Settings {
  /**
   * @param {{thisProfile: (Profiles|undefined), defaultIsolated:
   * (boolean|undefined),
   * incognitoIsolated: (boolean|undefined), displayHandoffPage:
   * (boolean|undefined), requireManagedPolicy: (boolean|undefined),
   * managedPolicyUrl: (string|undefined), managedPolicyBaseUpdatePeriod:
   * (number|undefined),
   * managedPolicyUpdateVariation: (number|undefined),
   * managedPolicyETag: (?string|undefined),
   * networkClass: (string|undefined),
   * acls: (!Object<Profiles,!Acl>|undefined),
   * blackLists: (!Object<Profiles,!Acl>|undefined),
   * globalBlacklist: (!Acl|undefined)}} options
   *     thisProfile: The profile we're currently operating in
   *     defaultIsolated: Whether to send to the Isolated browser if no ACL
   *         matches. If false, URLs will be set to Regular by default.
   *     incognitoIsolated: Whether to launch Isolated URLs in incognito mode.
   *     displayHandoffPage: Whether to display the intercepted page on handoff
   *         events.
   *     managedPolicyUrl: URL to update webservice Acls.
   *     managedPolicyBaseUpdatePeriod: Minimum number of minutes between ACL
   *         webservice updates.
   *     managedPolicyUpdateVariation: Maximum random deviation in the update
   *         period in minutes.
   *     managedPolicyETag: The E-Tag from the last managed policy update.
   *     acls: Sites that will be handled by the targeted profiles.
   *     blackLists: Sites that will be blocked in the targeted profiles.
   *     globalBlacklist: A blacklist that applies to all browsers.
   */
  constructor({
    thisProfile = undefined,
    defaultIsolated = false,
    incognitoIsolated = false,
    displayHandoffPage = true,
    requireManagedPolicy = true,
    managedPolicyUrl = '',
    managedPolicyBaseUpdatePeriod = 0,
    managedPolicyUpdateVariation = 0,
    managedPolicyETag = null,
    networkClass = '',
    acls = {},
    blackLists = {},
    globalBlacklist = undefined,
  }) {
    /**
     * @package {!Profiles}
     * @const
     */
    this.thisProfile = validateProfile(thisProfile || '');

    /**
     * @package {boolean}
     * @const
     */
    this.defaultIsolated = defaultIsolated;

    /**
     * @package {boolean}
     * @const
     */
    this.incognitoIsolated = incognitoIsolated;

    /**
     * @package {boolean}
     * @const
     */
    this.displayHandoffPage = displayHandoffPage;

    /**
     * @package {boolean}
     * @const
     */
    this.requireManagedPolicy = requireManagedPolicy;

    /**
     * @package {string}
     */
    this.managedPolicyUrl = managedPolicyUrl;

    /**
     * @package {number}
     */
    this.managedPolicyBaseUpdatePeriod = managedPolicyBaseUpdatePeriod;

    /**
     * @package {number}
     */
    this.managedPolicyUpdateVariation = managedPolicyUpdateVariation;

    /**
     * @package {?string}
     */
    this.managedPolicyETag = managedPolicyETag;

    /**
     * @package {string}
     */
    this.networkClass = networkClass;

    /**
     * A mapping of profiles to ACLs.
     *
     * @package {!Object<!Profiles, !Acl>}
     * @const
     */
    this.acls = {};

    /**
     * A mapping of profiles to blacklists.
     *
     * @package {!Object<!Profiles, !Acl>}
     * @const
     */
    this.blackLists = {};

    // Ensure that acls and blackLists is populated with the built-in profiles.
    const /** !Array<!Profiles> */ allProfiles = [Profiles.CORPORATE, Profiles.REGULAR, Profiles.ISOLATED];
    for (let /** !Profiles */ profile of allProfiles) {
      // See if the ACL for each profile was passed, or create an empty one.
      let /** !Acl */ acl = acls[profile] || new Acl();
      let /** !Acl */ blackList = blackLists[profile] || new Acl();

      // If we're deserializing, the ACL will be a structure, not an Acl object.
      this.acls[profile] = acl instanceof Acl ? acl : new Acl(acl);
      this.blackLists[profile] =
          blackList instanceof Acl ? blackList : new Acl(blackList);
    }

    /**
     * A blacklist that applies to all browsers.
     *
     * @type {!Acl}
     * @const
     */
    this.globalBlacklist = globalBlacklist instanceof Acl ? globalBlacklist : new Acl();

    /**
     * A list of match patterns that find URLs known to be OAuth authorization
     * endpoints.
     *
     * @package {!Array<string>}
     * @const
     */
    this.oAuthEndpoints = WELL_KNOWN_OAUTH_ENDPOINTS;

    /**
     * Compiled regexp of OAuth Endpoints
     *
     * Make sure to detangle.cleanUrlForMatch and URLs you match against this.
     * We keep this cached for fast access from the webRequest handler.
     *
     * @package {!RegExp}
     * @const
     */
    this.oAuthEndpointsRegExp = matchPatternsToRegExp(this.oAuthEndpoints);

    /**
     * A list of match patterns that find URLs known to be redirectors.
     *
     * @package {!Array<string>}
     * @const
     */
    this.redirectors = REDIRECTORS;

    /**
     * Compiled regexp of redirectors.
     *
     * Make sure to detangle.cleanUrlForMatch and URLs you match against this.
     * We keep this cached for fast access from the webRequest handler.
     *
     * @package {!RegExp}
     * @const
     */
    this.redirectorsRegExp = matchPatternsToRegExp(this.redirectors);
  }
}

exports = Settings;
