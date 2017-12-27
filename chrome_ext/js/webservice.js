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
 * @fileoverview Code related to updating ACLs from the webservice
 */

'use strict';


goog.provide('detangle.deleteCachedWebServiceAcl');
goog.provide('detangle.fetchFromWebService');
goog.provide('detangle.rescheduleWebServiceUpdates');
goog.provide('detangle.updateFromWebService');

goog.require('detangle.Settings');
goog.require('detangle.StorageKeys');
goog.require('detangle.getLocalStorage');


/**
 * Fetches the latest ACL from the given URL.
 *
 * @package
 * @param {string} url The url from which the latest ACL is requested.
 * @param {?string} eTag The E-Tag header from last fetch.
 * @param {(!XMLHttpRequest|!Object)} xhr Object to use to make HTTP requests.
 * @return {!Promise<!Object>} A promise with fetch data / error
 */
detangle.fetchFromWebService = function(url, eTag, xhr) {
  let xhrPromise = new Promise((success, reject) => {
    xhr.addEventListener('load', success);
    xhr.addEventListener('error', reject);
    xhr.open('GET', url, true);
    if (eTag) {
      xhr.setRequestHeader('If-None-Match', eTag);
    }
    xhr.send();
  });

  return xhrPromise.then(() => {
    if (xhr.status != 200) {
      throw {reason: 'network', status: xhr.status, statusText: xhr.statusText};
    }

    const response = JSON.parse(xhr.responseText.substr(5));

    // Slip the E-Tag and Source URL into the response
    response[detangle.StorageKeys.MANAGED_POLICY_ETAG] =
        xhr.getResponseHeader('ETag');
    response[detangle.StorageKeys.MANAGED_POLICY_SOURCE] = url;

    return response;
  });
};


/**
 * Fetches the latest ACL from the given URL, writing it to the cache
 * in local storage. This in turn triggers a settings reload which
 * digests the changes to the cache.
 *
 * @package
 * @param {string} url The url from which the latest ACL is requested.
 * @param {?string} eTag The E-Tag header from last fetch.
 * @return {!Promise} A promise with error
 */
detangle.updateFromWebService = function(url, eTag) {
  var xhr = new XMLHttpRequest();
  return detangle.fetchFromWebService(url, eTag, xhr)
      .then(detangle.writeCachedAclToStorage);
};


/**
 * Removes cached ACLs from local storage.
 */
detangle.deleteCachedWebServiceAcl = function() {
  detangle.getLocalStorage().remove(detangle.StorageKeys.CACHED_WEBSERVICE_ACL);
};


/**
 * Commits the given acl object to storage.
 *
 * @package
 * @param {!Object} acl acl object.
 * the last updated time.
 */
detangle.writeCachedAclToStorage = function(acl) {
  let settingsUpdate = {};
  settingsUpdate[detangle.StorageKeys.CACHED_WEBSERVICE_ACL] = acl;
  settingsUpdate[detangle.StorageKeys.MANAGED_POLICY_LAST_UPDATED] =
      new Date().getTime();
  detangle.getLocalStorage().set(settingsUpdate);
};


/**
 * Reschedules managed policy web service updates.
 *
 * @param {?detangle.Settings} settings The new detangle settings.
 * @return {?detangle.Settings} Passthrough the settings for future Promises.
 */
detangle.rescheduleWebServiceUpdates = function(settings) {
  if (settings && settings.managedPolicyUrl) {
    // Always perform an immediate update
    let alarmInfo = {when: 0};

    if (settings.managedPolicyBaseUpdatePeriod) {
      alarmInfo.periodInMinutes = settings.managedPolicyBaseUpdatePeriod +
          (Math.random() * settings.managedPolicyUpdateVariation);
    }
    chrome.alarms.create(detangle.MANAGED_POLICY_UPDATE_ALARM, alarmInfo);
  } else {
    chrome.alarms.clear(detangle.MANAGED_POLICY_UPDATE_ALARM);
  }
  return settings;
};
