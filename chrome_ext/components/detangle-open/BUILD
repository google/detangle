# Element that performs the redirect for the open page.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-open",
    component_deps = [
        "@org_polymer",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:storage_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
