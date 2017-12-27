# A list of sites in an ACL

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-site",
    component_deps = [
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_icon_button",
    ],
    js_deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)
