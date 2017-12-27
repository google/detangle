# Paper button that launches a detangle child profile

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-launch-profile-card",
    component_deps = [
        "//chrome_ext/components/detangle-launch-profile-button",
        "//chrome_ext/components/detangle-status",
        "@org_polymer",
        "@org_polymer_paper_card",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
