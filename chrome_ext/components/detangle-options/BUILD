# Element that displays the options page.

package(default_visibility = ["//visibility:public"])

load("//defs:defs.bzl", "detangle_component")

detangle_component(
    name = "detangle-options",
    component_deps = [
        "//chrome_ext/components/detangle-add-acl-dialog",
        "//chrome_ext/components/detangle-options-managed-policy-controls",
        "//chrome_ext/components/detangle-options-toggle",
        "//chrome_ext/components/detangle-sitelist",
        "//chrome_ext/components/detangle-status",
        "//chrome_ext/components/detangle-style",
        "//chrome_ext/components/detangle-troubleshooting",
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_icons",
        "@org_polymer_iron_pages",
        "@org_polymer_paper_button",
        "@org_polymer_paper_card",
        "@org_polymer_paper_dialog",
        "@org_polymer_paper_dialog_scrollable",
        "@org_polymer_paper_fab",
        "@org_polymer_paper_item",
        "@org_polymer_paper_listbox",
        "@org_polymer_paper_material",
        "@org_polymer_paper_radio_button",
        "@org_polymer_paper_radio_group",
        "@org_polymer_paper_tabs",
    ],
    js_deps = [
        "//chrome_ext/js:common_js",
        "//chrome_ext/js:utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)
