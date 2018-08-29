# Card that displays a single detangle event.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-event-card",
    component_deps = [
        "//chrome_ext/components/detangle-add-acl-dialog",
        "//chrome_ext/components/detangle-options-toggle",
        "//chrome_ext/components/detangle-status",
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_button",
        "@org_polymer_paper_card",
        "@org_polymer_paper_item",
        "@org_polymer_paper_material",
        "@org_polymer_paper_styles",
        "@org_polymer_paper_toast",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:utils_js",
        "@closure_compiler//:chrome_ext_externs",
        "@closure_compiler//:polymer_externs",
        "@io_bazel_rules_closure//closure/library",
    ],
    suppress = [
        "JSC_STRICT_INEXISTENT_PROPERTY",
    ],
)
