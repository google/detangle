# Card that offers an appropriate theme for the current browser.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-theme-card",
    component_deps = [
        "//chrome_ext/components/detangle-status",
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_button",
        "@org_polymer_paper_card",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
