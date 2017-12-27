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
 * @fileoverview Tests for the detangle-sitelist element
 */

'use strict';

goog.setTestOnly();

goog.require('detangle.AclEntryTags');
goog.require('goog.testing.jsunit');


/**
 * Tests that if the hostname and path are the same it sorts by scheme.
 */
function testSortPatternsScheme() {
  var elem = document.createElement('detangle-sitelist');
  elem.patterns = [
    'https://www.google.com/*',
    '*://www.google.com/*',
    'http://www.google.com/*',
    'ftp://www.google.com/*',
  ].map(x => ({type: detangle.AclEntryTags.MATCHPATTERN, value: x}));
  assertArrayEquals(
      [
        '*://www.google.com/*',
        'ftp://www.google.com/*',
        'http://www.google.com/*',
        'https://www.google.com/*',
      ],
      elem.patterns.sort(elem.compareAclEntries).map(x => x.value));
}


/**
 * Tests that if the hostname is the same it sorts by path, regardless of
 * scheme.
 */
function testSortPatternsPath() {
  var elem = document.createElement('detangle-sitelist');

  elem.patterns = [
    'ftp://www.google.com/url',
    '*://www.google.com/*',
    '*://www.google.com/q',
    'https://www.google.com/',
  ].map(x => ({type: detangle.AclEntryTags.MATCHPATTERN, value: x}));
  assertArrayEquals(
      [
        'https://www.google.com/',
        '*://www.google.com/*',
        '*://www.google.com/q',
        'ftp://www.google.com/url',
      ],
      elem.patterns.sort(elem.compareAclEntries).map(x => x.value));
}


/**
 * Tests that it sorts by reversed-parts hostname, regardless of path and
 * scheme.
 */
function testSortPatternsReverseHostname() {
  var elem = document.createElement('detangle-sitelist');

  elem.patterns = [
    '*://www.google.com/url',
    '*://www.example.com/*',
    'ftp://ftp.example.com/q',
    '*://www.example.aaa/a',
    'https://ftp.google.com/zzz',
  ].map(x => ({type: detangle.AclEntryTags.MATCHPATTERN, value: x}));
  assertArrayEquals(
      [
        '*://www.example.aaa/a',
        'ftp://ftp.example.com/q',
        '*://www.example.com/*',
        'https://ftp.google.com/zzz',
        '*://www.google.com/url',
      ],
      elem.patterns.sort(elem.compareAclEntries).map(x => x.value));
}
