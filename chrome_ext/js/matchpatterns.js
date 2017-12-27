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
 * @fileoverview An implementation of Chrome match patterns.
 * https://developer.chrome.com/extensions/match_patterns
 *
 * Note that file URIs are deliberately not supported
 *
 * For simplicity, detangle.completeMatchPattern() will add wildcard scheme
 * and/or path elements if excluded from the pattern - this is appropriate for
 * use in UI elements, even though it deviates from the specification.
 */

goog.module('detangle.matchpatterns');
goog.module.declareLegacyNamespace();

const {regExpEscape} = goog.require('goog.string');


/**
 * This matches only valid match patterns.
 *
 * @private {!RegExp}
 */
const MATCH_PATTERN_REGEXP_ =
    /^((https?|ftp|\*):\/\/)((\*\.)?[^*/:]+)(\/[^?#]*)$/;
//    12             2     134    4        35        5
// 1 - unused - 'http://'
// 2 - scheme - 'http'
// 3 - host   - '*.google.com'
// 4 - unused - '*.'
// 5 - path   - '/*'


/**
 * This matches patterns that might be missing the scheme or path, for use with
 * completeMatchPattern()
 *
 * @private {!RegExp}
 */
const SIMPLIFIED_MATCH_PATTERN_REGEXP_ =
    /^((https?|ftp|\*):\/\/)?((\*\.)?[^*/:]+)(\/[^?#]*)?$/i;
//    12             2     1 34    4        35        5
// 1 - unused - 'http://'
// 2 - scheme - 'http'
// 3 - host   - '*.google.com'
// 4 - unused - '*.'
// 5 - path   - '/*'


/**
 * @private
 * @enum {number}
 */
const MatchPatternIndex_ = {
  SCHEME: 2,
  HOST: 3,
  PATH: 5,
};


/**
 * Replaces the asterisk character with something, while regExp escaping the
 * rest.
 *
 * @private
 * @param {string} s Source string
 * @param {string} replaceWith RegExp snippet to replace wildcards with
 * @return {string}
 */
function replaceWildcards_(s, replaceWith) {
  return s.split('*').map(regExpEscape).join(replaceWith);
}


/**
 * Converts a single match pattern into an unanchored regexp fragment. Throws
 * an exception if the match pattern isn't valid.
 *
 * @private
 * @param {string} pattern The pattern that you wish to match URLs against
 * @return {string} A regular expression string.
 */
function matchPatternToRegExpString_(pattern) {
  /** @type {?Array<string>} */
  const matches = MATCH_PATTERN_REGEXP_.exec(pattern);
  if (matches == null) {
    throw new Error(pattern + ' is not a valid match pattern');
  }

  /** @type {string} */
  const scheme = matches[MatchPatternIndex_.SCHEME];
  /** @type {string} */
  const hostPattern = matches[MatchPatternIndex_.HOST];
  /** @type {string} */
  const pathPattern = matches[MatchPatternIndex_.PATH];

  /** @type {string} */
  let hostRegExp;
  if (hostPattern.startsWith('*.')) {
    // Allow anything but / or : followed by a ., or allow the bare domain.
    // eg. *.google.com would match www.x.google.com and google.com.
    hostRegExp = '([^/:]+\\.)?' + regExpEscape(hostPattern.slice(2));
  } else {
    // Otherwise, just treat the host part as a literal string.
    hostRegExp = regExpEscape(hostPattern);
  }

  return (scheme == '*' ? '(https?|ftp)' : scheme) + '://' + hostRegExp +
      replaceWildcards_(pathPattern, '[^?#]*');
}


/**
 * Converts a list of match patterns into a RegExp. Throws an exception if any
 * match patterns aren't valid (this won't happen if you run them all through
 * validateMatchPattern() first).
 *
 * @param {!Array<string>} patterns An array of match patterns
 * @param {!Array<string>=} opt_regexps An array of regular expressions
 * @return {!RegExp}
 */
function matchPatternsToRegExp(patterns, opt_regexps) {
  /** @type {!Array<string>} */
  const uniquePatterns = [...new Set(patterns)];

  return new RegExp(
      '^(' +
      uniquePatterns.map(matchPatternToRegExpString_)
          .concat(opt_regexps || [])
          .join('|') +
      ')$');
}
exports.matchPatternsToRegExp = matchPatternsToRegExp;


/**
 * Tests whether a match pattern is valid.
 *
 * @param {string} pattern A hopefully valid match pattern
 * @return {boolean}
 */
function validateMatchPattern(pattern) {
  return MATCH_PATTERN_REGEXP_.test(pattern);
}
exports.validateMatchPattern = validateMatchPattern;


/**
 * Tests whether a match pattern is valid.
 *
 * @param {string} pattern A hopefully valid match pattern
 * @return {boolean}
 */
function validateSimplifiedMatchPattern(pattern) {
  return SIMPLIFIED_MATCH_PATTERN_REGEXP_.test(pattern);
}
exports.validateSimplifiedMatchPattern = validateSimplifiedMatchPattern;


/**
 * Takes a partially entered match pattern, and completes it:
 *
 *  - If the scheme is omitted, '*://' is prepended
 *  - If the path is omitted, '/*' is appended
 *  - Coverts the scheme and host to lower-case (but not the path)
 *
 * Throws an Error if it's not a valid simplified pattern.
 *
 * @param {string} pattern An incomplete match pattern
 * @return {string} A match pattern
 */
function completeMatchPattern(pattern) {
  /** @type {?Array<string>} */
  const matches = SIMPLIFIED_MATCH_PATTERN_REGEXP_.exec(pattern);
  if (matches == null) {
    throw new Error('Invalid match pattern: ' + pattern);
  }

  const scheme = (matches[MatchPatternIndex_.SCHEME] || '*').toLowerCase();
  const host = matches[MatchPatternIndex_.HOST].toLowerCase();
  const path = matches[MatchPatternIndex_.PATH] || '/*';

  return scheme + '://' + host + path;
}
exports.completeMatchPattern = completeMatchPattern;


/**
 * Takes a well-formed match pattern and makes it incomplete/simplified.
 *
 * Calling completeMatchPattern on the output will equal the input (case
 * sensitivity issues aside).
 *
 *  - If the scheme is '*://', remove it
 *  - If the path is '/*' remove it
 *  - Converts the scheme and host to lower-case if not removed
 *
 * Throws an Error if an invalid strict match pattern is passed to it.
 *
 * @param {string} pattern A complete match pattern
 * @return {string} A simplified match pattern
 */
function simplifyMatchPattern(pattern) {
  /** @type {?Array<string>} */
  const matches = MATCH_PATTERN_REGEXP_.exec(pattern);
  if (matches == null) {
    throw new Error('Invalid match pattern: ' + pattern);
  }

  let scheme = matches[MatchPatternIndex_.SCHEME].toLowerCase() + '://';
  const host = matches[MatchPatternIndex_.HOST].toLowerCase();
  let path = matches[MatchPatternIndex_.PATH];

  if (scheme == '*://') {
    scheme = '';
  }
  if (path == '/*') {
    path = '';
  }
  return scheme + host + path;
}
exports.simplifyMatchPattern = simplifyMatchPattern;


/**
 * Cleans up a URL prior to trying to match against a match pattern.
 *
 * This:
 * - Removes trailing and leading dots on hostnames
 * - lower-cases the hostname
 * - Removes the port, query and fragment parts of the URL
 * - Resolve ../ and ./ portions of path
 *
 * Throws a DomException if the URL is invalid.
 *
 * @param {string} url URL to be cleaned up
 * @return {string} clean URL
 */
function cleanUrlForMatch(url) {
  /** @type {!URL} */
  const splitUrl = new URL(url);

  /** @type {string} */
  const host = splitUrl.hostname.replace(/^\.+/, '').replace(/\.+$/, '');

  return splitUrl.protocol + '//' + host + splitUrl.pathname;
}
exports.cleanUrlForMatch = cleanUrlForMatch;


/**
 * Compares match patterns in a manner suitable for Array.prototype.sort().
 *
 * @param {string} a A match pattern
 * @param {string} b Another match pattern
 * @return {number} A negative number to sort a before b, a positive number to
 *     sort b before a, or 0 if they're equal.
 */
function compareMatchPatterns(a, b) {
  /**
   * Compares a and b by unicode value.
   *
   * @param {string} a An entry from the array
   * @param {string} b Another entry from the array
   * @return {number}
   */
  function compare(a, b) { return +(a > b) || +(a === b) - 1; }

  /**
   * Reverses the host parts of a hostname.
   *
   * @param {string} host A FQDN
   * @return {string}
   */
  function reverseHost(host) { return host.split('.').reverse().join('.'); }

  const aMatch = MATCH_PATTERN_REGEXP_.exec(a);
  const bMatch = MATCH_PATTERN_REGEXP_.exec(b);

  const hostA = reverseHost(aMatch[3]);
  const hostB = reverseHost(bMatch[3]);

  const pathA = aMatch[5];
  const pathB = bMatch[5];

  const schemeA = aMatch[2];
  const schemeB = bMatch[2];

  return compare(hostA, hostB) || compare(pathA, pathB) ||
      compare(schemeA, schemeB);
}
exports.compareMatchPatterns = compareMatchPatterns;
