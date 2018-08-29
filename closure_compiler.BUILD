load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

package(default_visibility = ["//visibility:public"])

closure_js_library(
    name = "polymer_externs",
    srcs = ["contrib/externs/polymer-1.0.js"],
    suppress = [
        "JSC_STRICT_INEXISTENT_PROPERTY",
    ],
)

closure_js_library(
    name = "chrome_ext_externs",
    srcs = [
      "contrib/externs/chrome.js",
      "contrib/externs/chrome_extensions.js",
    ],
    suppress = [
        "JSC_STRICT_INEXISTENT_PROPERTY",
    ],
)
