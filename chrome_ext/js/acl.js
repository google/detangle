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
 * @fileoverview ACL implementation
 */

goog.module('detangle.Acl');
goog.module.declareLegacyNamespace();

const AclEntryTags = goog.require('detangle.AclEntryTags');
const matchpatterns = goog.require('detangle.matchpatterns');
const {AclEntry, MatchPatternEntry, NetBlockEntry, RegExpEntry} = goog.require('detangle.aclentries');


/**
 * Matches a destinations against supplied regexp set
 *
 * @package
 */
class Acl {
  /**
   * @param {{
   * userEntries: (!Array|undefined), 
   * managedEntries: (!Array|undefined),
   * webserviceEntries: (!Array|undefined),
   * networkClass: (string|undefined)}=} options
   *     userEntries: Entries loaded from chrome.storage.local or
   *         chrome.storage.sync.
   *     managedEntries: Entries loaded from chrome.storage.managed.
   *     webserviceEntries: Entries loaded from the webservice.
   *     networkClass: Filters entries which have a different network, if set.
   */
  constructor({
    userEntries = undefined,
    managedEntries = undefined,
    webserviceEntries = undefined,
    networkClass = undefined
  } = {}) {
    /**
     * User-defined entries (set from options)
     * @package {!Array<{type: string, value: string}>}
     */
    this.userEntries = this.validEntries_(userEntries || []);

    /**
     * Managed entries (set by enterprise policy)
     * @package {!Array<{type: string, value: string}>}
     */
    this.managedEntries = this.validEntries_(managedEntries || []);

    /**
     * entries from the webservice
     * @package {!Array<{type: string, value: string}>}
     */
    this.webserviceEntries = this.validEntries_(webserviceEntries || []);

    /**
     * if network is set on a entry, it is omitted during evaluation unless the
     * network matches.
     * @package {string}
     */
    this.networkClass = networkClass || '';

    this.recompile_();
  }

  /**
   * Make an object suitable for serialization.
   *
   * @override
   * @return {!Object<string, ?>}
   */
  toJSON() {
    return {
      userEntries: this.userEntries,
      managedEntries: this.managedEntries,
      webserviceEntries: this.webserviceEntries,
      networkClass: this.networkClass,
    };
  }

  /**
   * Recompile regexp from managed and user ACLs
   *
   * @private
   */
  recompile_() {
    /** @const {function(!AclEntry): boolean} */
    const filterByNetwork = entry => {
      if (!entry.networkClass) {
        return true;
      }
      return this.networkClass == entry.networkClass;
    };

    const /** !Array<!AclEntry> */ allEntries = this.userEntries.concat(this.managedEntries)
                           .concat(this.webserviceEntries)
                           .filter(filterByNetwork);

    const /** !Array<string> */ allMatchPatterns =
        allEntries.filter(x => x instanceof MatchPatternEntry)
            .map(x => x.value);
    const /** !Array<string> */ allRegExps =
        allEntries.filter(x => x instanceof RegExpEntry).map(x => x.value);

    /** @private {!RegExp} */
    this.compiledEntries_ =
        matchpatterns.matchPatternsToRegExp(allMatchPatterns, allRegExps);
  }

  /**
   * Checks that all entries are valid, then returns the valid set.
   * Throws an Error if bad entries are passed.
   *
   * @private
   * @param {?} unvalidatedEntries Entries that will be set
   * @return {!Array<!AclEntry>}
   */
  validEntries_(unvalidatedEntries) {
    if (!Array.isArray(unvalidatedEntries)) {
      throw new Error('ACL is not an array');
    }


    /**
     * Validates and normalizes entries.
     *
     * @param {*} entry The entry we're validating.
     * @return {!AclEntry}
     */
    function validEntryRecord(entry) {
      if (goog.isString(entry['type']) && goog.isString(entry['value'])) {
        switch (entry['type']) {
          case AclEntryTags.MATCHPATTERN:
            return new MatchPatternEntry(
                entry['value'],
                entry['networkClass'] || entry['network_class']);
          case AclEntryTags.REGEXP:
            return new RegExpEntry(
                entry['value'],
                entry['networkClass'] || entry['network_class']);
          case AclEntryTags.NETBLOCK:
            return new NetBlockEntry(
                entry['value'],
                entry['networkClass'] || entry['network_class']);
          default:
            throw new Error('Invalid ACL entry type: ' + entry.type);
        }
      }

      throw new Error('ACL is not an array of type/value records');
    }

    /** @type {!Array<!AclEntry>} */
    const entries = unvalidatedEntries.map(validEntryRecord);

    entries.forEach(function(entry) {
      if (!entry.isValid()) {
        throw new Error('Invalid ACL entry: ' + entry.toString());
      }
    });

    return entries;
  }

  /**
   * Replaces all user entries with an array of match patterns.
   *
   * @param {!Array} entries An array of ACL entries.
   * @package
   */
  setUserAcl(entries) {
    this.userEntries = this.validEntries_(entries);
    this.recompile_();
  }

  /**
   * Replaces all managed entries with an array of match patterns.
   *
   * @param {!Array} entries An array of ACL entries.
   * @package
   */
  setManagedAcl(entries) {
    this.managedEntries = this.validEntries_(entries);
    this.recompile_();
  }

  /**
   * Replaces all cached entries with an array of match patterns.
   *
   * @param {!Array} entries An array of ACL entries.
   * @package
   */
  setWebserviceAcl(entries) {
    this.webserviceEntries = this.validEntries_(entries);
    this.recompile_();
  }

  /**
   * Checks if a url matches host patterns allowed by this ACL.
   *
   * @package
   * @param {string} url to check.
   * @return {boolean} true if the destination matches, false if not.
   */
  okHostPattern(url) {
    // As soon as one of the Acl entries match it's a hit.
    return this.compiledEntries_.test(matchpatterns.cleanUrlForMatch(url));
  }

  /**
   * Matches a url against the shorname, network and host rules..
   * @package
   * @param {string} url to check.
   * @return {boolean} true if the destination matches, false if not.
   */
  test(url) {
    return this.okHostPattern(url);
  }
}
exports = Acl;
