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
 * @fileoverview A widget that prompts to add an ACL.
 */

goog.require('detangle.AclEntryTags');
goog.require('detangle.Profiles');
goog.require('detangle.StorageKeys');
goog.require('detangle.aclentries');
goog.require('detangle.getPrefsStorage');
goog.require('detangle.matchpatterns');
goog.require('detangle.utils');


Polymer({
  is: 'detangle-add-acl-dialog',

  properties: {
    pattern: {
      type: String,
    },
    targetProfile: {
      type: String,
      value: detangle.Profiles.CORPORATE,
      notify: true,
    },
    storageKey: {
      type: String,
      computed: 'computeStorageKey(targetProfile)',
    },
    url: {
      type: String,
    },
    cleanUrl: {
      type: String,
      computed: 'computeCleanUrl(url)',
    },
    matchType: {
      type: String,
      value: detangle.AclEntryTags.MATCHPATTERN,
    },
    bugUrl: {
      type: String,
      value: '',  // TODO(michaelsamuel): Fetch from managed storage.
    },
    createBug: {
      type: Boolean,
      value: false,
    },
    isValid: {
      type: Boolean,
      computed: 'computeValid(matchType, pattern)',
      value: false,
    },
    advancedConfig: {
      type: Boolean,
      value: false,
    },
    availableProfiles: {
      type: Array,
      value: [
        detangle.Profiles.CORPORATE,
        detangle.Profiles.REGULAR,
        detangle.Profiles.ISOLATED,
      ],
    },
  },

  observers: [
    'generatePatternForUrl(cleanUrl)',
    'matchesUrl(cleanUrl, matchType, pattern)',
  ],


  listeners: {
    'add.tap': 'doAdd',
  },

  /**
   * Creates a detangle.aclentries.AclEntry subtype for the given matchType and
   * pattern.
   *
   * @param {string} matchType The type of match requested.
   * @param {string} pattern The pattern.
   * @return {!detangle.aclentries.AclEntry}
   */
  asAclEntry_: function(matchType, pattern) {
    switch (matchType) {
      case detangle.AclEntryTags.MATCHPATTERN:
        return new detangle.aclentries.MatchPatternEntry(
            detangle.matchpatterns.completeMatchPattern(pattern));
        break;
      case detangle.AclEntryTags.REGEXP:
        return new detangle.aclentries.RegExpEntry(pattern);
        break;
      default:
        throw new Error('Invalid match type');
    }
  },

  /**
   * Fires the add-pattern event if the pattern is valid
   *
   * @param {!Event} e An event object
   * @return {!Promise} A promise that fires when the entry is saved
   */
  doAdd: function(e) {
    if (!this.isValid) {
      return Promise.reject(new Error('Invalid pattern'));
    }
    if (!this.storageKey) {
      return Promise.reject(
          new Error('No storage key provided for detangle-add-acl-dialog'));
    }

    let storageArea = detangle.getPrefsStorage();
    let storageKey = this.storageKey;
    var newEntry = this.asAclEntry_(this.matchType, this.pattern);

    if (this.bugUrl && this.createBug) {
      // TODO(michaelsamuel): Allow addition of pattern, matchType, etc to URL.
      chrome.tabs.create({url: this.bugUrl});
    }

    /**
     * Appends an entry to the existing ACL then saves it back.
     *
     * @param {*} value Result of storageArea.getValue().
     * @return {!Promise}
     */
    function appendEntry(value) {
      const /** !Array */ newValue = Array.isArray(value) ? value : [];
      newValue.push(newEntry);
      return storageArea.set({[storageKey]: newValue});
    }

    return storageArea.getValue(storageKey).then(appendEntry);
  },

  /**
   * Cleans up a URL (lower-case hostname & scheme, removes port, etc).
   *
   * @param {string} url The possibly-unclean URL
   * @return {string}
   */
  computeCleanUrl: function(url) {
    return detangle.matchpatterns.cleanUrlForMatch(url);
  },

  /**
   * Tests that the pattern is valid.
   *
   * @param {string} matchType The type of match requested
   * @param {string} pattern The pattern that the user entered
   * @return {boolean}
   */
  computeValid: function(matchType, pattern) {
    // Because we use 'loose' match patterns, validation is annoying
    if (matchType == detangle.AclEntryTags.MATCHPATTERN) {
      return detangle.matchpatterns.validateSimplifiedMatchPattern(pattern);
    } else {
      return this.asAclEntry_(matchType, pattern).isValid();
    }
  },

  /**
   * Computes the label for the provided profile.
   *
   * @param {detangle.Profiles} profile Profile that we want the label for
   * @return {string}
   */
  computeProfileLabel: function(profile) {
    return detangle.utils.computeProfileLabel(profile);
  },

  /**
   * Computes the icon for the provided profile.
   *
   * @param {detangle.Profiles} profile Profile that we want the icon for
   * @return {string}
   */
  computeProfileIcon: function(profile) {
    return detangle.utils.computeProfileIcon(profile);
  },

  /**
   * Computes the storage key to write the ACL for the selected config to.
   *
   * @param {detangle.Profiles} profile Profile that we want to add to
   * @return {detangle.StorageKeys}
   */
  computeStorageKey: function(profile) {
    return detangle.utils.computeAclStorageKey(profile);
  },

  /**
   * Computes the help message, specific to the target profile slected.
   *
   * @param {detangle.Profiles} profile Profile that we want to add to
   * @return {string}
   */
  computeHelpMessage: function(profile) {
    switch (profile) {
      case detangle.Profiles.CORPORATE:
        return 'For sites that use your corporate account.';
      case detangle.Profiles.REGULAR:
        return 'For sites where you sign in with non-corporate credentials.';
      case detangle.Profiles.ISOLATED:
        return 'For sites where you don\'t sign in or enter private information.';
    }
    return '';
  },

  /**
   * Generates a matchpattern for the URL if the pattern field is empty and
   * the
   * matchType is matchpattern
   *
   * @param {string} url URL to generate the match pattern for
   */
  generatePatternForUrl: function(url) {
    if (this.matchType != detangle.AclEntryTags.MATCHPATTERN || this.pattern) {
      return;
    }

    /** @type {!URL} */
    const urlObj = new URL(url);
    /** @type {string} */
    var scheme;

    switch (urlObj.protocol) {
      case 'http:':
        scheme = '*://';
        break;
      case 'ftp:':
        scheme = 'ftp://';
        break;
      case 'https:':
        scheme = 'https://';
        break;
      default:
        console.log('Invalid URI scheme: ' + urlObj.protocol);
        return;
    }

    this.pattern = scheme + urlObj.hostname + '/*';
  },

  /**
   * Sets the 'good' class on the url element in the DOM depending on
   * whether
   * the pattern matches the url.
   *
   * @param {string} url The URL to match against
   * @param {string} matchType The type of pattern
   * @param {string} pattern The pattern
   */
  matchesUrl: function(url, matchType, pattern) {
    if (!this.isValid) {
      this.toggleClass('bad', true, this.$.urlbox);
      return;
    }

    /** @type {!RegExp} */
    var regexp;

    switch (matchType) {
      case detangle.AclEntryTags.MATCHPATTERN:
        let completePattern =
            detangle.matchpatterns.completeMatchPattern(pattern);
        regexp =
            detangle.matchpatterns.matchPatternsToRegExp([completePattern]);
        break;
      case detangle.AclEntryTags.REGEXP:
        regexp = detangle.matchpatterns.matchPatternsToRegExp([], [pattern]);
        break;
      default:
        this.toggleClass('bad', true, this.$.urlbox);
        return;
    }
    this.toggleClass('bad', !regexp.test(url), this.$.urlbox);
  },

  /**
   * Fires a custom dialog-closed event so custom embeds will know to close.
   */
  fireClosedEvent: function() {
    this.fire('dialog-closed', null, {bubbles: false});
  },
});
