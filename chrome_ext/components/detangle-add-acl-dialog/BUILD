# Paper button that launches a detangle child profile

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-add-acl-dialog",
    component_deps = [
        "//chrome_ext/components/detangle-style",
        "@org_polymer",
        "@org_polymer_iron_collapse",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_button",
        "@org_polymer_paper_checkbox",
        "@org_polymer_paper_dialog_behavior",
        "@org_polymer_paper_dropdown_menu",
        "@org_polymer_paper_input",
        "@org_polymer_paper_item",
        "@org_polymer_paper_listbox",
        "@org_polymer_paper_styles",
    ],
    js_deps = [
        "//chrome_ext/js:aclentries_js",
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:matchpatterns_js",
        "//chrome_ext/js:storage_js",
        "//chrome_ext/js:utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
