# Detangle for Windows

Detangle automatically separates your browser into multiple browser profiles.

Corporate IT can specify a list of internal sites to be opened in the main
browser, and all other sites (including links) will be automatically handed off
to another profile.

## Building

To build the native messaging client for Windows, do the following from a Linux host:

```
bazel build --platforms=@io_bazel_rules_go//go/toolchain:windows_amd64_msvc native_messaging:detanglenm
```

The detanglenm.exe file will then be outputted to bazel-bin/native_messaging/windows_amd64_pure_stripped/detanglenm.exe

## Using on Windows

Create a directory named C:\Program Files (x86)\Google\Chrome\Detangle Native Messenging Client.

Copy the detanglenm.exe and this manifest.json file to that directory. If you have rebuilt the crx as well, make sure to update the allowed_origin in the manifest file.

Merge the detanglenm.reg file to register the native handler.

Install the CRX from the store. It's wisest to remove all existing Chrome profiles before doing this. Note that you will still see the package as not being installed on the Options page but otherwise the extension will work (as in, you can define rules through the UI).

