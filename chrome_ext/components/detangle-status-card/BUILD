# Card that displays the browser profile, options button, and launch buttons.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-status-card",
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
