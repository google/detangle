# Component that lists recent events.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-event-list",
    component_deps = [
        "//chrome_ext/components/detangle-event-card",
        "//chrome_ext/components/detangle-status",
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_paper_button",
    ],
    js_deps = [
        "@closure_compiler//:chrome_ext_externs",
        "@closure_compiler//:polymer_externs",
        "@io_bazel_rules_closure//closure/library",
    ],
)
