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
 * @fileoverview Tests for acl.js
 */

goog.module('detangle.aclTest');

goog.setTestOnly();

const Acl = goog.require('detangle.Acl');
const AclEntryTags = goog.require('detangle.AclEntryTags');
const testModule = goog.require('detangle.test');
const testSuite = goog.require('goog.testing.testSuite');
const {MatchPatternEntry} = goog.require('detangle.aclentries');


/**
 * Creates a match pattern entry in the format expected from storage.
 *
 * @param {string} entry
 * @return {{type: AclEntryTags, value: string}}
 */
function matchPatternEntry(entry) {
  return {type: AclEntryTags.MATCHPATTERN, value: entry};
}


/**
 * Creates a regular expression entry in the format expected from storage.
 *
 * @param {string} entry
 * @return {{type: AclEntryTags, value: string}}
 */
function regExpEntry(entry) {
  return {type: AclEntryTags.REGEXP, value: entry};
}


testSuite({
  getTestName() {
    return 'detangle.aclTest';
  },

  setUp() {
    testModule.setupChromeTests();
  },

  testAclConstructor() {
    // Default is an empty set of ACLs

    /** @type {Acl} */
    var acl = new Acl({});
    assertTrue(Array.isArray(acl.userEntries));
    assertTrue(Array.isArray(acl.managedEntries));
    assertArrayEquals([], acl.userEntries);
    assertArrayEquals([], acl.managedEntries);
  },

  testAclSetUserAcl() {
    var acl = new Acl(
        {userEntries: ['https://before.example.com/*'].map(matchPatternEntry)});
    acl.setUserAcl(['https://after.example.com/*'].map(matchPatternEntry));
    assertTrue(acl.userEntries.every(x => x.type == AclEntryTags.MATCHPATTERN));
    assertArrayEquals(
        ['https://after.example.com/*'], acl.userEntries.map(x => x.value));
  },

  testAclSetManagedAcl() {
    var acl = new Acl({
      managedEntries: ['https://before.example.com/*'].map(matchPatternEntry)
    });
    acl.setManagedAcl(['https://after.example.com/*'].map(matchPatternEntry));
    assertTrue(
        acl.managedEntries.every(x => x.type == AclEntryTags.MATCHPATTERN));
    assertArrayEquals(
        ['https://after.example.com/*'], acl.managedEntries.map(x => x.value));
  },

  testAclSetWebserviceAcl() {
    var acl = new Acl({
      webserviceEntries: ['https://before.example.com/*'].map(matchPatternEntry)
    });
    acl.setWebserviceAcl(
        ['https://after.example.com/*'].map(matchPatternEntry));
    assertTrue(
        acl.webserviceEntries.every(x => x.type == AclEntryTags.MATCHPATTERN));
    assertArrayEquals(
        ['https://after.example.com/*'],
        acl.webserviceEntries.map(x => x.value));
  },

  testAclDoesntFilterEntriesWithNetworkUnset() {
    var acl = new Acl({
      webserviceEntries: ['https://ayyy.example.com/*'].map(matchPatternEntry),
      networkClass: 'corp'
    });

    assertTrue(acl.test('https://ayyy.example.com/welp'));
  },

  testAclFiltersEntriesWithDifferentNetwork() {
    var acl = new Acl({
      webserviceEntries:
          [new MatchPatternEntry('https://ayyy.example.com/*', 'brah')],
      userEntries:
          [new MatchPatternEntry('https://yeppers.example.com/*', 'corp')],
      managedEntries: ['https://ack.test.com/*'].map(matchPatternEntry),
      networkClass: 'corp'
    });

    assertTrue(
        'Entries with no entry set are affected',
        acl.test('https://ack.test.com/nack'));
    assertTrue(
        'Entries with matching network are not applied',
        acl.test('https://yeppers.example.com/ok'));
    assertFalse(
        'Entries with network mismatch are applied',
        acl.test('https://ayyy.example.com/welp'));
  },

  testAclMatchesUserDestinations() {
    var acl = new Acl({
      userEntries: ['https://user.example.com/*'].map(matchPatternEntry),
      managedEntries: ['https://managed.example.com/*'].map(matchPatternEntry)
    });
    assertTrue(acl.test('https://user.example.com/foo/bar'));
    assertFalse(acl.test('https://nothing.example.com/foo/bar'));
  },

  testAclMatchesManagedDestinations() {
    var acl = new Acl({
      userEntries: [matchPatternEntry('https://user.example.com/*')],
      managedEntries: [matchPatternEntry('https://managed.example.com/*')]
    });
    assertTrue(acl.test('https://managed.example.com/foo/bar'));
    assertFalse(acl.test('https://nothing.example.com/foo/bar'));
  },

  testAclMatchesRegExp() {
    var acl = new Acl({userEntries: [regExpEntry('http://(ab|cd)/.*')]});
    assertTrue(acl.test('http://ab/foo/bar'));
    assertTrue(acl.test('http://cd/foo/bar'));
    assertFalse(acl.test('ahttp://cd/foo/bar'));
    assertTrue(acl.test('http://cd/'));
    assertFalse(
        acl.test('http://www.example.com/http://cd/'));  // Implicit anchor
  },

  testInvalidAclEntryTags() {
    assertThrows(function() {
      new Acl({
        userEntries: [{type: 'invalid', value: 'https://www.example.com/*'}]
      });
    });
  },

  testInvalidAclEntryStructure() {
    assertThrows(function() {
      new Acl({
        userEntries:
            [{XXXX: 'matchpattern', value: 'https://www.example.com/*'}]
      });
    });

    assertThrows(function() {
      new Acl({
        userEntries:
            [{type: 'matchpattern', XXXXX: 'https://www.example.com/*'}]
      });
    });
  },

  testSetInvalidAcl() {
    var acl = new Acl(
        {userEntries: ['https://before.example.com/*'].map(matchPatternEntry)});
    assertThrows(function() {
      acl.setUserAcl([''].map(matchPatternEntry));
    });
    assertArrayEquals(
        ['https://before.example.com/*'], acl.userEntries.map(x => x.value));
  },

  testSetInvalidRegExpAcl() {
    var acl = new Acl();
    assertThrows(function() {
      acl.setUserAcl([regExpEntry('[unclosed')]);
    });
    assertArrayEquals([], acl.userEntries);
  },

  testAclSerializeDeserialize() {
    let original = new Acl({
      userEntries: [
        matchPatternEntry('*://user.example.com/*'),
        regExpEntry('.*regexpuser.*'),
      ],
      managedEntries: [
        matchPatternEntry('*://managed.example.com/*'),
        regExpEntry('.*regexpmanaged.*'),
      ],
      webserviceEntries: [
        matchPatternEntry('*://ws.example.com/*'),
        regExpEntry('.*regexpws.*'),
      ],
    });

    let s = JSON.stringify(original);

    let deserialized = new Acl(/** @type {!Object} */ (JSON.parse(s)));

    assertTrue(deserialized.test('http://user.example.com/'));
    assertTrue(deserialized.test('http://managed.example.com/'));
    assertTrue(deserialized.test('http://ws.example.com/'));
    assertTrue(deserialized.test('http://regexpuser.example.com/'));
    assertTrue(deserialized.test('http://regexpmanaged.example.com/'));
    assertTrue(deserialized.test('http://regexpws.example.com/'));
  },
});
