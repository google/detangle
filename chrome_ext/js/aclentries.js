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
 * @fileoverview Data types for Acl entries.
 */

goog.module('detangle.aclentries');
goog.module.declareLegacyNamespace();

const AclEntryTags = goog.require('detangle.AclEntryTags');
const matchpatterns = goog.require('detangle.matchpatterns');


/**
 * A base class for any type of ACL entry
 * @abstract
 */
class AclEntry {
  /**
   * @param {AclEntryTags} type The type of ACL entry
   * @param {string} value The value of the acl entry
   * @param {string|undefined} networkClass The network the ACL applies to
   */
  constructor(type, value, networkClass) {
    /**
     * @type {AclEntryTags}
     * @const
     */
    this.type = type;

    /**
     * @type {string}
     * @const
     */
    this.value = value;

    /**
     * @type {string|undefined}
     * @const
     */
    this.networkClass = networkClass;
  }

  /**
   * Checks whether the entry is valid.
   *
   * @return {boolean}
   * @abstract
   */
  isValid() {}

  /**
   * Converts the entry to a JSONable (for writing to storage).
   *
   * @override
   * @return {{type: AclEntryTags, value: string, networkClass: (string|undefined)}}
   */
  toJSON() {
    return {
      type: this.type,
      value: this.value,
      networkClass: this.networkClass
    };
  }

  /**
   * Converts the entry into a string.
   *
   * @override
   * @return {string}
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}
exports.AclEntry = AclEntry;


/**
 * A match pattern ACL entry
 */
class MatchPatternEntry extends AclEntry {
  /**
   * @param {string} pattern A match pattern
   * @param {string=} opt_networkClass The network for which the pattern applies
   */
  constructor(pattern, opt_networkClass) {
    super(AclEntryTags.MATCHPATTERN, pattern, opt_networkClass);
  }

  /**
   * Checks whether the entry is valid.
   *
   * @override
   * @return {boolean}
   */
  isValid() {
    return matchpatterns.validateMatchPattern(this.value);
  }
}
exports.MatchPatternEntry = MatchPatternEntry;


/**
 * A regular expression ACL entry
 */
class RegExpEntry extends AclEntry {
  /**
   * @param {string} regExp A regular expression string
   * @param {string=} opt_networkClass The network for which the pattern applies
   */
  constructor(regExp, opt_networkClass) {
    super(AclEntryTags.REGEXP, regExp, opt_networkClass);
  }

  /**
   * Checks whether the entry is valid.
   *
   * @return {boolean}
   * @override
   */
  isValid() {
    try {
      const r = new RegExp(this.value);
      return !!r;
    } catch (e) {
      return false;
    }
  }
}
exports.RegExpEntry = RegExpEntry;


/**
 * A CIDR netblock ACL entry.
 *
 * TODO(michaelsamuel): This isn't implemented in open source due to missing dep.
 */
class NetBlockEntry extends AclEntry {
  /**
   * @param {string} regExp A regular expression string
   * @param {string=} opt_networkClass The network for which the pattern applies
   */
  constructor(regExp, opt_networkClass) {
    super(AclEntryTags.NETBLOCK, regExp, opt_networkClass);
  }

  /**
   * Checks whether the entry is valid.
   *
   * @return {boolean}
   * @override
   */
  isValid() {
    console.log('netblock ACLs are currently not implemented.');
    return true;
  }
}
exports.NetBlockEntry = NetBlockEntry;
