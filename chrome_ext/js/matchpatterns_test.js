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
 * @fileoverview Tests for matchpatterns.js
 */

goog.module('matchpatterns.matchpatternsTest');

goog.setTestOnly();

const matchpatterns = goog.require('detangle.matchpatterns');
const testSuite = goog.require('goog.testing.testSuite');


testSuite({
  getTestName() {
    return 'detangle.matchpatternsTest';
  },

  testInvalidNoScheme() {
    assertThrows(function() {
      matchpatterns.matchPatternsToRegExp(['google.com/']);
    });
  },

  testInvalidNoPath() {
    assertThrows(function() {
      matchpatterns.matchPatternsToRegExp(['http://google.com']);
    });
  },

  testInvalidNothing() {
    assertThrows(function() {
      matchpatterns.matchPatternsToRegExp(['']);
    });
  },

  testInvalidOnlyScheme() {
    assertThrows(function() {
      matchpatterns.matchPatternsToRegExp(['http://']);
    });
  },

  testInvalidNoHost() {
    assertThrows(function() {
      matchpatterns.matchPatternsToRegExp(['http:///foo']);
    });
  },

  testMatchPatternGroup() {
    const regExp = matchpatterns.matchPatternsToRegExp([
      'https://www.google.com/a/example.com/*',
      '*://www.test1.example.com/',
      'https://*.test2.example.com/',
      'https://test3.example.com/foo*bar',
    ]);

    const testMatches = [
      'https://www.google.com/a/example.com/',
      'https://www.google.com/a/example.com/docs',
      'http://www.test1.example.com/',
      'https://www.test1.example.com/',
      'https://www.test2.example.com/',
      'https://www1.test2.example.com/',
      'https://www02.test2.example.com/',
      'https://www.blah.test2.example.com/',
      'https://test2.example.com/',
      'ftp://www.test1.example.com/',
      'https://test3.example.com/foobar',
      'https://test3.example.com/footybar',
    ];

    const testNotMatches = [
      'https://www.googleYcom/a/example.com/',  // Not a regexp dot
      'https://www.google.com/a/example.com',   // Missing / at end
      'file://www.test1.example.com/',  // Don't match file URIs with wildcard
      'https://www1.test2.example.com/foobar',  // No trailing * in pattern
    ];

    testMatches.forEach(function(url) {
      assertTrue(url + ' should match ' + regExp.source, regExp.test(url));
    });

    testNotMatches.forEach(function(url) {
      assertFalse(url + ' shouldn\'t match ' + regExp.source, regExp.test(url));
    });
  },

  testMatchPatternGroupWithInvalid() {
    assertThrows(function() {
      matchpatterns.matchPatternsToRegExp([
        'https://www.google.com/a/example.com/*',  // Valid
        '*://www.test1.example.com/',              // Valid
        'https://www*.test2.example.com/',         // Invalid
        'http://www.google.com',                   // Valid
      ]);
    });
  },

  testWildcardMatchesHttp() {
    const pattern =
        matchpatterns.matchPatternsToRegExp(['*://www.google.com/']);
    assertTrue(pattern.test('http://www.google.com/'));
  },

  testWildcardMatchesHttps() {
    const pattern =
        matchpatterns.matchPatternsToRegExp(['*://www.google.com/']);
    assertTrue(pattern.test('https://www.google.com/'));
  },

  testWildcardMatchesFtp() {
    const pattern =
        matchpatterns.matchPatternsToRegExp(['*://www.google.com/']);
    assertTrue(pattern.test('ftp://www.google.com/'));
  },

  testWildcardRejectsGopher() {
    const pattern =
        matchpatterns.matchPatternsToRegExp(['*://www.google.com/']);
    assertFalse(pattern.test('gopher://www.google.com/'));
  },

  testWildcardMatchesDotProperly() {
    const pattern = matchpatterns.matchPatternsToRegExp(['*://*.i/*']);
    assertTrue(pattern.test('http://foo.i/'));
    assertFalse(pattern.test('http://foo.li/'));
  },

  testValidateMatchPattern() {
    assertTrue(matchpatterns.validateMatchPattern('http://www.google.com/'));
    assertTrue(matchpatterns.validateMatchPattern('*://www.google.com/'));
    assertTrue(matchpatterns.validateMatchPattern('http://www.google.com/*'));
    assertTrue(matchpatterns.validateMatchPattern('*://*.google.com/*'));
    assertFalse(matchpatterns.validateMatchPattern('file:///etc/passwd'));
    assertFalse(matchpatterns.validateMatchPattern('http://www.google.com'));
    assertFalse(
        matchpatterns.validateMatchPattern('http://www.google.com:999/*'));
  },

  // Tests for simplified patterns (match patterns that are missing components).

  testValidateSimplifiedMatchPattern() {
    assertTrue(
        matchpatterns.validateSimplifiedMatchPattern('http://www.google.com/'));
    assertTrue(matchpatterns.validateSimplifiedMatchPattern('www.google.com/'));
    assertTrue(
        matchpatterns.validateSimplifiedMatchPattern('http://www.google.com'));
    assertTrue(matchpatterns.validateSimplifiedMatchPattern('*.google.com'));
    assertFalse(
        matchpatterns.validateSimplifiedMatchPattern('file:///etc/passwd'));
    assertFalse(matchpatterns.validateSimplifiedMatchPattern(
        'http://www.google.com:999'));
  },

  testCompleteMatchPatternAlreadyComplete() {
    assertEquals(
        'http://www.google.com/',
        matchpatterns.completeMatchPattern('http://www.google.com/'));
  },

  testCompleteMatchPatternMissingScheme() {
    assertEquals(
        '*://www.google.com/',
        matchpatterns.completeMatchPattern('www.google.com/'));
  },

  testCompleteMatchPatternMissingPath() {
    assertEquals(
        'http://www.google.com/*',
        matchpatterns.completeMatchPattern('http://www.google.com'));
  },

  testCompleteMatchPatternUpperScheme() {
    assertEquals(
        'http://www.google.com/*',
        matchpatterns.completeMatchPattern('HTTP://www.google.com/*'));
  },

  testCompleteMatchPatternUpperHost() {
    assertEquals(
        'http://www.google.com/*',
        matchpatterns.completeMatchPattern('http://www.GOOGle.com/*'));
  },

  testCompleteMatchPatternUpperPath() {
    assertEquals(
        'http://www.google.com/FooBar',
        matchpatterns.completeMatchPattern('http://www.google.com/FooBar'));
  },

  testCompleteMatchPatternMissingSchemeAndPath() {
    assertEquals(
        '*://www.google.com/*',
        matchpatterns.completeMatchPattern('www.google.com'));
  },

  testCompleteMatchPatternEmptyString() {
    assertThrows('Empty string', function() {
      matchpatterns.completeMatchPattern('');
    });
  },

  testCompleteMatchPatternInvalidScheme() {
    assertThrows('Invalid URI string', function() {
      matchpatterns.completeMatchPattern('gopher://www.blah.com/foo');
    });
  },

  // Tests for cleaning URLs prior to being matched.
  //
  // We clean the URL so that parts of it that can't be expressed in a match
  // pattern or the resulting regexp get handled sensibly.

  testCleanUrlAlreadyClean() {
    assertEquals(
        'http://www.google.com/calendar',
        matchpatterns.cleanUrlForMatch('http://www.google.com/calendar'));
  },

  testCleanUrlPort() {
    assertEquals(
        'http://www.google.com/calendar',
        matchpatterns.cleanUrlForMatch('http://www.google.com:8000/calendar'));
  },

  testCleanUrlUpperHost() {
    assertEquals(
        'http://www.google.com/calendar',
        matchpatterns.cleanUrlForMatch('http://www.GOOGle.com/calendar'));
  },

  testCleanUrlUpperScheme() {
    assertEquals(
        'http://www.google.com/calendar',
        matchpatterns.cleanUrlForMatch('HTTP://www.google.com/calendar'));
  },

  testCleanUrlExtraDot() {
    assertEquals(
        'http://www.google.com/calendar',
        matchpatterns.cleanUrlForMatch('http://.www.google.com./calendar'));
  },

  testCleanUrlExtraDots() {
    assertEquals(
        'http://www.google.com/calendar',
        matchpatterns.cleanUrlForMatch('http://..www.google.com..../calendar'));
  },

  testCleanUrlNoPath() {
    assertEquals(
        'http://www.google.com/',
        matchpatterns.cleanUrlForMatch('http://www.google.com'));
  },

  testCleanUrlEmptyString() {
    assertThrows(function() {
      matchpatterns.cleanUrlForMatch('');
    });
  },

  testCleanUrlNoScheme() {
    assertThrows(function() {
      matchpatterns.cleanUrlForMatch('www.google.com/search');
    });
  },

  testCleanUrlNoHost() {
    assertThrows(function() {
      matchpatterns.cleanUrlForMatch('http://');
    });
  },

  testCleanUrlResolvePath() {
    assertEquals(
        'http://www.google.com/foo/bar',
        matchpatterns.cleanUrlForMatch(
            'http://www.google.com/foo/bar/baz/../../bar'));
  },

  testSimplifyMatchPatternDoNothing() {
    assertEquals(
        'http://www.google.com/',
        matchpatterns.simplifyMatchPattern('http://www.google.com/'));
    assertEquals(
        'http://www.google.com/foo',
        matchpatterns.simplifyMatchPattern('http://www.google.com/foo'));
  },

  testSimplifyMatchPatternWildcardScheme() {
    assertEquals(
        'www.google.com/',
        matchpatterns.simplifyMatchPattern('*://www.google.com/'));
  },

  testSimplifyMatchPatternWildcardPath() {
    assertEquals(
        'http://www.google.com',
        matchpatterns.simplifyMatchPattern('http://www.google.com/*'));
  },

  testSimplifyMatchPatternWildcardSchemeAndPath() {
    assertEquals(
        'www.google.com',
        matchpatterns.simplifyMatchPattern('*://www.google.com/*'));
  },

  testSimplifyMatchPatternInvalid() {
    assertThrows(function() {
      matchpatterns.simplifyMatchPattern('XXX');
    });
  },

  testCompareMatchPatterns() {
    // Basic host checks
    assertEquals(
        0,
        matchpatterns.compareMatchPatterns('https://a.com/', 'https://a.com/'));
    assertEquals(
        1,
        matchpatterns.compareMatchPatterns('https://b.com/', 'https://a.com/'));
    assertEquals(
        -1,
        matchpatterns.compareMatchPatterns('https://a.com/', 'https://b.com/'));

    // Check that the last hostpart is compared before the first
    assertEquals(
        1,
        matchpatterns.compareMatchPatterns('https://a.net/', 'https://b.com/'));
    assertEquals(
        -1,
        matchpatterns.compareMatchPatterns('https://b.com/', 'https://a.net/'));

    // Check that the host part is compared before the path
    assertEquals(
        1,
        matchpatterns.compareMatchPatterns(
            'https://a.net/b', 'https://b.com/a'));

    // Check that the path is compared before the scheme
    assertEquals(
        1,
        matchpatterns.compareMatchPatterns('ftp://a.net/b', 'http://a.net/a'));

    // Check that the scheme is compared
    assertEquals(
        -1,
        matchpatterns.compareMatchPatterns('ftp://a.net/', 'http://a.net/'));
  },
});
