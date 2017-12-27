# A checkbox that toggles a boolean config option.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library", "closure_js_binary", "closure_js_test")

detangle_component(
    name = "detangle-options-toggle",
    component_deps = [
        "//chrome_ext/components/detangle-status",
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_paper_checkbox",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
