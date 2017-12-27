# Container + logic for managed policy options

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-options-managed-policy-controls",
    component_deps = [
        "//chrome_ext/components/detangle-options-text-input",
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_paper_button",
        "@org_polymer_paper_spinner",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "@closure_compiler//:chrome_ext_externs",
        "@closure_compiler//:polymer_externs",
        "@io_bazel_rules_closure//closure/library",
    ],
)
