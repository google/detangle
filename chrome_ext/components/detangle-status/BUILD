# Element that performs a status query.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library", "closure_js_binary", "closure_js_test")

detangle_component(
    name = "detangle-status",
    component_deps = [
        "@org_polymer",
    ],
    js_deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)
