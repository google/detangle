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
 * @fileoverview Tests for oauth.js
 */

goog.module('detangle.oauthTest');

goog.setTestOnly();

const EventType = goog.require('detangle.EventType');
const OAuthRequest = goog.require('detangle.OAuthRequest');
const Profiles = goog.require('detangle.Profiles');
const Settings = goog.require('detangle.Settings');
const isOAuthEndpoint = goog.require('detangle.isOAuthEndpoint');
const oAuthEndpointHandler = goog.require('detangle.oAuthEndpointHandler');
const testSuite = goog.require('goog.testing.testSuite');
const {MatchPatternEntry} = goog.require('detangle.aclentries');


testSuite({
  getTestName() {
    return 'detangle.oauthTest';
  },

  testParseOAuthRequestServerSide() {
    const endpoint = 'https://accounts.google.com/o/oauth2/auth';
    const parameters = {
      redirect_uri: ['https://developers.google.com/oauthplayground'],
      response_type: ['code'],
      client_id: ['407408718192.apps.googleusercontent.com'],
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
      approval_prompt: ['force'],
      access_type: ['offline'],
    };

    /** @type {OAuthRequest} */
    const req = new OAuthRequest(endpoint, parameters);
    assertNotNull(req);
    assertEquals('code', req.responseType);
    assertEquals('407408718192.apps.googleusercontent.com', req.clientId);
    assertEquals('https://accounts.google.com/o/oauth2/auth', req.endpoint);
    assertEquals(
        'https://developers.google.com/oauthplayground', req.redirectUri);
    assertArrayEquals(
        ['https://www.googleapis.com/auth/userinfo.email'], req.scopes);
  },

  testParseOAuthRequestClientSide() {
    const endpoint = 'https://accounts.google.com/o/oauth2/auth';
    const parameters = {
      redirect_uri: ['https://developers.google.com/oauthplayground'],
      response_type: ['token'],
      client_id: ['407408718192.apps.googleusercontent.com'],
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
      approval_prompt: ['force'],
      access_type: ['online'],
    };
    const req = new OAuthRequest(endpoint, parameters);
    assertNotNull(req);
    assertEquals('token', req.responseType);
    assertEquals('407408718192.apps.googleusercontent.com', req.clientId);
    assertEquals('https://accounts.google.com/o/oauth2/auth', req.endpoint);
    assertEquals(
        'https://developers.google.com/oauthplayground', req.redirectUri);
    assertArrayEquals(
        ['https://www.googleapis.com/auth/userinfo.email'], req.scopes);
  },

  testParseOAuthRequestNoClientId() {
    const endpoint = 'https://accounts.google.com/o/oauth2/auth';
    const parameters = {
      redirect_uri: ['https://developers.google.com/oauthplayground'],
      response_type: ['code'],
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
      approval_prompt: ['force'],
      access_type: ['offline']
    };

    assertThrows(function() {
      new OAuthRequest(endpoint, parameters);
    });
  },

  testParseOAuthRequestNoResponseType() {
    const endpoint = 'https://accounts.google.com/o/oauth2/auth';
    const parameters = {
      redirect_uri: ['https://developers.google.com/oauthplayground'],
      client_id: ['407408718192.apps.googleusercontent.com'],
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
      approval_prompt: ['force'],
      access_type: ['offline']
    };

    assertThrows(function() {
      new OAuthRequest(endpoint, parameters);
    });
  },

  testParseOAuthRequestNoRedirectUri() {
    const endpoint = 'https://accounts.google.com/o/oauth2/auth';
    const parameters = {
      response_type: ['code'],
      client_id: ['407408718192.apps.googleusercontent.com'],
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
      approval_prompt: ['force'],
      access_type: ['offline']
    };

    assertThrows(function() {
      new OAuthRequest(endpoint, parameters);
    });
  },

  testParseOAuthRequestMultipleRedirectUri() {
    const endpoint = 'https://accounts.google.com/o/oauth2/auth';
    const parameters = {
      response_type: ['code'],
      client_id: ['407408718192.apps.googleusercontent.com'],
      redirect_uri: [
        'https://developers.google.com/oauthplayground',
        'https://developers.gaggle.com/oauthplayground'
      ],
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
      approval_prompt: ['force'],
      access_type: ['offline']
    };

    assertThrows(function() {
      new OAuthRequest(endpoint, parameters);
    });
  },

  testOAuthEndpointHandlerInProfile() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';

    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertNull(eventLogEntry);
  },

  testOAuthEndpointHandlerStorageRelayInProfile() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=storagerelay%3A%2F%2Fhttps%2Fdevelopers.google.com%3Fid%3Drandomstuff' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';

    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertNull(eventLogEntry);
  },

  testOAuthEndpointHandlerStorageRelayCrossProfile() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=storagerelay%3A%2F%2Fhttps%2Fdevelopers.example.com%3Fid%3Drandomstuff' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';

    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertEquals(Profiles.REGULAR, eventLogEntry.targetProfile);
  },

  testOAuthEndpointHandlerOOB() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';

    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertNull(eventLogEntry);
  },

  testOAuthEndpointHandlerOOBAuto() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob%3Aauto' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';

    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertNull(eventLogEntry);
  },

  testOAuthEndpointHandlerPostMessage() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=postmessage' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';

    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'sub_frame'});
    assertNull(eventLogEntry);
  },

  testOAuthEndpointHandlerInvalidRequest() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';
    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertEquals(EventType.OAUTH_INVALID, eventLogEntry.eventType);
    assertEquals(
        'No redirect_uri parameter in OAuth request',
        eventLogEntry.details.error);
  },

  testOAuthEndpointHandlerCrossProfile() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth' +
        '?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground' +
        '&response_type=code' +
        '&client_id=407408718192.apps.googleusercontent.com' +
        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email' +
        '&approval_prompt=force&access_type=offline';
    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'GET', type: 'main_frame'});
    assertEquals(EventType.OAUTH_BLOCKED, eventLogEntry.eventType);
    assertEquals(
        'https://developers.google.com/oauthplayground', eventLogEntry.url);
    assertEquals(Profiles.REGULAR, eventLogEntry.targetProfile);
  },

  testOAuthEndpointHandlerCrossProfilePost() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth';
    const eventLogEntry = oAuthEndpointHandler(settings, {
      url: requestUrl,
      method: 'POST',
      type: 'main_frame',
      requestBody: {
        formData: {
          redirect_uri: ['https://developers.google.com/oauthplayground'],
          response_type: ['token'],
          client_id: ['407408718192.apps.googleusercontent.com'],
          scope: ['https://www.googleapis.com/auth/userinfo.email'],
          approval_prompt: ['force'],
          access_type: ['online']
        }
      }
    });
    assertEquals(EventType.OAUTH_BLOCKED, eventLogEntry.eventType);
    assertEquals(
        'https://developers.google.com/oauthplayground', eventLogEntry.url);
    assertEquals(Profiles.REGULAR, eventLogEntry.targetProfile);
  },

  testOAuthEndpointHandlerInProfilePost() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth';
    const eventLogEntry = oAuthEndpointHandler(settings, {
      url: requestUrl,
      method: 'POST',
      type: 'main_frame',
      requestBody: {
        formData: {
          redirect_uri: ['https://developers.google.com/oauthplayground'],
          response_type: ['token'],
          client_id: ['407408718192.apps.googleusercontent.com'],
          scope: ['https://www.googleapis.com/auth/userinfo.email'],
          approval_prompt: ['force'],
          access_type: ['online']
        }
      }
    });
    assertNull(eventLogEntry);
  },

  testOAuthEndpointHandlerPostNoFormData() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth';
    const eventLogEntry = oAuthEndpointHandler(
        settings,
        {url: requestUrl, method: 'POST', requestBody: {}, type: 'main_frame'});
    assertEquals(EventType.OAUTH_INVALID, eventLogEntry.eventType);
  },


  testOAuthEndpointHandlerDeleteNoFormData() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    const requestUrl = 'https://accounts.google.com/o/oauth2/auth';
    const eventLogEntry = oAuthEndpointHandler(
        settings, {url: requestUrl, method: 'DELETE', type: 'main_frame'});
    assertEquals(EventType.OAUTH_INVALID, eventLogEntry.eventType);
  },

  testIsOAuthEndpointYep() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    assertTrue(
        isOAuthEndpoint(settings, 'https://accounts.google.com/o/oauth2/auth'));
    assertTrue(isOAuthEndpoint(
        settings, 'https://accounts.google.com/o/oauth2/auth?foo=bar'));
    assertTrue(isOAuthEndpoint(
        settings, 'https://accounts.google.com/o/oauth2/auth#foo=bar'));
    assertTrue(isOAuthEndpoint(
        settings, 'https://accounts.google.com:443/o/oauth2/auth'));
  },

  testIsOAuthEndpointNope() {
    const settings = new Settings({thisProfile: Profiles.CORPORATE});
    settings.acls[Profiles.CORPORATE].setUserAcl([
      new MatchPatternEntry('https://accounts.google.com/*'),
      new MatchPatternEntry('https://developers.google.com/*'),
    ]);

    assertFalse(isOAuthEndpoint(settings, 'https://www.example.com/'));
    assertFalse(isOAuthEndpoint(
        settings, 'https://accounts.google.com/o/oauth2/authen'));
  },
});
