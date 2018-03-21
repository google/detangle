# Deploying Detangle

A Detangle installation consists of:

* The Detangle nativeMessaging helper
* The Detangle Chrome Extensions
* Managed Policy

This document will guide you through deployment of detangle in your organisation.

## The Detangle nativeMessaging helper

The Detangle [nativeMessaging](https://developer.chrome.com/extensions/nativeMessaging) helper is the component that launches
Chrome browsers when a URL is handed off.

To build a Debian/Ubuntu package of it, you can run from the Detangle workspace:

```shell
bazel build //native_messaging/deb:detanglenm_deb
```

Installation of that deb will install:

* The nativeMessaging helper binary
* A policy file allowing the Detangle extension to use the nativeMessaging binary
* A policy file requesting the pre-built extension be installed from the [Chrome Web Store](https://chrome.google.com/webstore/detail/detangle/hcmeejlfgajdddobdodhlhcolankfpli).

If you build and release your own fork of the extension, please modify `com.google.corp.detangle.json`
and rename `hcmeejlfgajdddobdodhlhcolankfpli.json` before building.

*Packages for Windows and MacOS are not currently implemented*

## The Detangle Chrome Extension

For your convenience, we have posted a build of the extension on the
[Chrome Web Store](https://chrome.google.com/webstore/detail/detangle/hcmeejlfgajdddobdodhlhcolankfpli).
If you wish to manage your own build and release process, you may build the extension by running:

```shell
bazel build //chrome_ext
```

This will create a file called `extension.zip`, which may be uploaded through the
[Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
Uploading the file will create a new extension ID, and references to the extension ID will need to be changed in both
the managed policy and the nativeMessaging package.

## Managed Policy

Policy is set through [chrome.storage.managed](https://developer.chrome.com/extensions/manifest/storage).  The procedure for setting Chrome
managed storage varies by platform.

For Linux, create the file `/etc/opt/chrome/policies/managed/detangle.json` that may look like this:

```json
{
  "3rdparty": {
    "extensions": {
      "hcmeejlfgajdddobdodhlhcolankfpli": {
        "priv_whitelist": [
          {
            "comment": "Keep Google/GSuite apps in Corporate browser",
            "type": "matchpattern",
            "value": "*://*.google.com/*"
          },
          {
            "comment": "Keep Google Australia searches in the Corporate browser.  Needed so that new tab page doesn't hand off.",
            "type": "matchpattern",
            "value": "*://www.google.com.au/*"
          },
        ],
      }
    }
  }
}
```

Most organisations will want to set at-least the `priv_whitelist` key (which is the Corporate whitelist).
