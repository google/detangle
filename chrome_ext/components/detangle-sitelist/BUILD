# A list of sites in an ACL

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-sitelist",
    component_deps = [
        "//chrome_ext/components/detangle-style",
        "//chrome_ext/components/detangle-site",
        "@org_polymer",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:matchpatterns_js",
        "//chrome_ext/js:storage_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
