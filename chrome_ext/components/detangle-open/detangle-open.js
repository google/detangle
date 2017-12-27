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
 * @fileoverview The main component for a page that opens URLs and raises the
 * window (if the settings permit).
 */

const Profiles = goog.require('detangle.Profiles');
const StorageKeys = goog.require('detangle.StorageKeys');
const getLocalStorage = goog.require('detangle.getLocalStorage');


Polymer({
  is: 'detangle-open',

  properties: {
    /**
     * The query string of the document.
     *
     * @type {(string|undefined)}
     */
    queryString: {
      type: String,
    },

    /**
     * The target URL.
     *
     * @type {(string|undefined)}
     */
    targetUrl: {
      type: String,
      computed: 'computeTargetUrl(queryString)',
    },

    /**
     * Whether it was requested that the window be raised.
     *
     * @type {(boolean|undefined)}
     */
    shouldRaiseWindow: {
      type: Boolean,
      computed: 'computeShouldRaise(queryString)',
    },

    /**
     * An error string to display to the user.
     *
     * @type {(string|undefined)}
     */
    errorMessage: {
      type: String,
    },
  },

  observers: [
    'readyToRedirect(targetUrl, shouldRaiseWindow)',
  ],

  /**
   * Ready function - sets queryString from window.location.
   * @override
   */
  ready: function() {
    this.queryString = window.location.search.slice(1);
  },

  /**
   * Extracts the target URL from the search params
   *
   * @param {string} queryString The part of the URL after '?'
   * @return {string} the 'url' parameter
   */
  computeTargetUrl: function(queryString) {
    let searchParams = new URLSearchParams(queryString);
    return searchParams.get('url') || '';
  },

  /**
   * Extracts the raise URL parameter.
   *
   * @param {(string|undefined)} queryString The part of the URL after '?'
   * @return {(boolean|undefined)} Whether to raise the window.
   */
  computeShouldRaise: function(queryString) {
    let searchParams = new URLSearchParams(queryString || '');
    let shouldRaise = searchParams.get('raise') || 'true';
    return shouldRaise == 'true';
  },

  /**
   * Redirects the page to the requested target URL, raising the window first
   * if enabled in settings.
   *
   * @suppress {reportUnknownTypes}
   * @param {(string|undefined)} targetUrl The URL that we will redirect to
   * @param {(boolean|undefined)} shouldRaiseWindow Whether to raise the window
   * @return {!Promise}
   */
  readyToRedirect: function(targetUrl, shouldRaiseWindow) {
    /**
     * Rejects if the target URL is invalid.
     * @return {!Promise}
     */
    function checkTargetUrlIsValid() {
      if (!targetUrl) {
        return Promise.reject(new Error('No target URL'));
      }

      try {
        let urlObj = new URL(/** @type {string} */ (targetUrl));
        if (/^(https?|ftp):$/.test(urlObj.protocol)) {
          return Promise.resolve();
        } else {
          return Promise.reject(
              new Error('Unacceptable target URL: ' + targetUrl));
        }
      } catch (e) {
        return Promise.reject(new Error('Invalid target URL: ' + targetUrl));
      }
    }

    /**
     * Rejects if thisProfile is Corporate.
     * @return {!Promise}
     */
    function checkThisProfile() {
      return getLocalStorage()
          .getValue(StorageKeys.THIS_PROFILE)
          .then(profile => {
            if (profile == Profiles.CORPORATE) {
              throw new Error('Attempt to open URL in Corporate profile.');
            }
          });
    }

    /**
     * Gets the current chrome.windows.Window.
     * @return {!Promise<!ChromeWindow>}
     */
    function getCurrentWindow() {
      return new Promise(resolve => {
        chrome.windows.getCurrent(resolve);
      });
    }

    /**
     * Raises the supplied chrome.windows.Window.
     *
     * @param {!ChromeWindow} win The window that we should raise.
     * @return {!Promise<!ChromeWindow>}
     */
    function raiseWindow(win) {
      return new Promise(resolve => {
        chrome.windows.update(
            win.id, {drawAttention: true, focused: true}, resolve);
      });
    }

    return checkTargetUrlIsValid()
        .then(checkThisProfile)
        .then(() => {
          if (shouldRaiseWindow) {
            return getCurrentWindow().then(raiseWindow);
          }
        })
        .then(() => {
          this.redirectTo(/** @type {string} */ (targetUrl));
        })
        .catch(e => {
          this.errorMessage = e.message;
        });
  },

  /**
   * Redirects the page to targetUrl.
   *
   * @param {string} targetUrl The URL to redirect to.
   */
  redirectTo: function(targetUrl) {
    console.log('Redirecting to', targetUrl);
    document.location.replace(targetUrl);
  },
});
