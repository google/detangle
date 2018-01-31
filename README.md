# Detangle

This is not an official Google product.

Detangle automatically separates your browser into multiple browser profiles.

Corporate IT can specify a list of internal sites to be opened in the main
browser, and all other sites (including links) will be automatically handed off
to another profile.

## Building

Bazel is required for building. The native messaging component can be built by
running:

```
bazel build native_messaging:detanglenm
```

Or build the package for Debian/Ubuntu by running:

```
bazel build native_messaging/deb:detanglenm_deb
```

The Chrome extension component can be built by running:

```
bazel build chrome_ext
```

