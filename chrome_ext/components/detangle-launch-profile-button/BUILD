package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-launch-profile-button",
    component_deps = [
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_paper_button",
    ],
    js_deps = [
        "//chrome_ext/js:utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
