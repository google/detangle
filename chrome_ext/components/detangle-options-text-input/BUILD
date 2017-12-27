# Paper input backed by chrome.storage item

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-options-text-input",
    component_deps = [
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_paper_input",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
