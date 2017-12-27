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
 * @fileoverview OAuth Safety Net
 *
 * The goal is to intercept oauth authorization endpoints and validate that the
 * redirectUri is handled in the current profile.  If not, block access by
 * redirecting to an internal/policy-specified page.
 */

'use strict';

goog.provide('detangle.OAuthRequest');
goog.provide('detangle.isOAuthEndpoint');
goog.provide('detangle.oAuthEndpointHandler');

goog.require('detangle.EventType');
goog.require('detangle.getProfile');
goog.require('detangle.logEvent');
goog.require('detangle.matchpatterns');


/**
 * Redirect URIs that are essentially just OOB.
 *
 * These are ok, because there not going to cause a cross-profile OAuth grant
 * (we're already on the site that's requesting them).
 *
 * @const
 * @private {!Set<string>}
 */
detangle.OOB_AUTH_REDIRECT_URIS_ = new Set([
  'urn:ietf:wg:oauth:2.0:oob', 'urn:ietf:wg:oauth:2.0:oob:auto', 'postmessage'
]);


/**
 * A deconstructed OAuth Authorization request
 *
 * @package
 */
detangle.OAuthRequest = class {
  /**
   * @param {string} endpoint The URL of an OAuth endpoint
   * @param {!Object<string, !Array<string>>} parameters Request parameters
   */
  constructor(endpoint, parameters) {
    /** @public {string} */
    this.endpoint = endpoint;

    // Ensure the mandatory parameters are present
    ['redirect_uri', 'response_type', 'client_id'].forEach(function(param) {
      if (!(param in parameters)) {
        throw new Error('No ' + param + ' parameter in OAuth request');
      }
      if (parameters[param].length != 1) {
        throw new Error(
            'The ' + param + ' was passed ' + parameters[param].length +
            ' times.');
      }
    });
    /** @public {string} */
    this.redirectUri = parameters['redirect_uri'][0];
    /** @public {string} */
    this.responseType = parameters['response_type'][0];
    /** @public {string} */
    this.clientId = parameters['client_id'][0];


    // Optional but relevant information
    /** @public {!Array<string>} */
    this.scopes = [];

    /** @public {(string|undefined)} */
    this.referer = undefined;

    if ('scope' in parameters) {
      this.scopes = parameters['scope'].join(' ').split(' ');
    }
  }

  /**
   * Returns the redirect URI after any normalisation (for example, converting
   * storagerelay:// URIs into scheme://authority/.
   *
   * @return {string}
   */
  get canonicalRedirectUri() {
    /** @type {!RegExp} */
    let storageRelayRegExp = /^storagerelay:\/\/([^/#?]+)\/([^#?]+)/;

    if (storageRelayRegExp.test(this.redirectUri)) {
      /** @type {?Array<string>} */
      let matches = storageRelayRegExp.exec(this.redirectUri);
      if (matches) {
        let scheme = matches[1];
        let authority = matches[2];
        return scheme + '://' + authority + '/';
      }
    }

    return this.redirectUri;
  }

  /**
   * Returns a JSONable object containing the details of the request.
   *
   * @return {!Object}
   */
  toJSON() {
    return {
      endpoint: this.endpoint,
      response_type: this.responseType,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scopes: [...this.scopes]
    };
  }
};


/**
 * Decodes an OAuth Request, or throws an Error if it's invalid.
 *
 * @private
 * @param {!Object} details A chrome.webRequest details object, potentially
 *     containing the message body.
 * @return {!detangle.OAuthRequest}
 */
detangle.decodeOAuthRequest_ = function(details) {
  /** @type {!Object<string, !Array<string>>} */
  var parameters = {};

  /** @type {!string} */
  var endpoint;

  if (details.method == 'GET') {
    /** @type {URL} */
    let urlObject = new URL(details.url);

    /** @type {!URLSearchParams} */
    let searchParams = new URLSearchParams(urlObject.search.substr(1));
    for (var key of searchParams.keys()) {
      parameters[key] = searchParams.getAll(key);
    }

    urlObject.hash = '';
    urlObject.search = '';
    endpoint = urlObject.toString();
  } else if (details.method == 'POST') {
    endpoint = details.url;
    if (details.requestBody && details.requestBody.formData) {
      parameters = details.requestBody.formData;
    } else {
      throw new Error('POST OAuth request with no body');
    }
  } else {
    throw new Error(details.method + ' is not supported for OAuth requests');
  }

  return new detangle.OAuthRequest(endpoint, parameters);
};


/**
 * Handles for blocking webRequest.onBeforeRequest events for OAuth
 * authorization endpoints.
 *
 * @see https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
 * @package
 * @param {?detangle.Settings} settings Current running settings
 * @param {!Object} details webRequest details object
 * @return {?detangle.Event}
 */
detangle.oAuthEndpointHandler = function(settings, details) {
  /** @type {!detangle.OAuthRequest} */
  var request;

  // Don't intercept CORS preflights - the GET or POST will come later.
  if (details.method == 'OPTIONS') {
    return null;
  }

  try {
    request = detangle.decodeOAuthRequest_(details);
  } catch (e) {
    return detangle.logEvent(
        detangle.EventType.OAUTH_INVALID, details.url, details.tabId, null,
        {error: e.message});
  }

  // OOB OAuth requests won't send a tokens across profile boundaries.
  if (detangle.OOB_AUTH_REDIRECT_URIS_.has(request.redirectUri)) {
    return null;
  }

  /** @type {!detangle.Profiles} */
  const targetProfile =
      detangle.getProfile(settings, request.canonicalRedirectUri);
  if (targetProfile == settings.thisProfile) {
    return null;
  }

  return detangle.logEvent(
      detangle.EventType.OAUTH_BLOCKED, request.redirectUri, details.tabId,
      targetProfile, request.toJSON());
};


/**
 * Determine if the URL is an OAuth endpoint
 *
 * @package
 * @param {detangle.Settings} settings Current running settings
 * @param {string} url URL that may be an oAuth endpoint
 * @return {boolean}
 */
detangle.isOAuthEndpoint = function(settings, url) {
  return settings.oAuthEndpointsRegExp.test(
      detangle.matchpatterns.cleanUrlForMatch(url));
};
