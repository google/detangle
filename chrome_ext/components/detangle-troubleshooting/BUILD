# Container + logic for troubleshooting information

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-troubleshooting",
    component_deps = [
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_icons",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "@closure_compiler//:chrome_ext_externs",
        "@closure_compiler//:polymer_externs",
        "@io_bazel_rules_closure//closure/library",
    ],
)
