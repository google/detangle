load("//defs:defs.bzl", "web_bin")
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary")

closure_js_binary(
    name = "background",
    compilation_level = "SIMPLE",
    dependency_mode = "STRICT",
    entry_points = ["detangle.Background"],
    language = "ECMASCRIPT_2015",
    deps = [
        "//chrome_ext/js:background_js",
    ],
)

closure_js_binary(
    name = "sync_options",
    compilation_level = "SIMPLE",
    dependency_mode = "STRICT",
    entry_points = ["detangle.doSyncOptions"],
    language = "ECMASCRIPT_2015",
    deps = [
        "//chrome_ext/js:sync_options_js",
    ],
)

closure_js_binary(
    name = "open",
    compilation_level = "SIMPLE",
    dependency_mode = "STRICT",
    entry_points = ["detangle.open"],
    language = "ECMASCRIPT_2015",
    deps = [
        "//chrome_ext/js:open_js",
    ],
)

web_bin(
    name = "intercepted",
    srcs = ["intercepted_src.html"],
    path = "/",
    deps = [
        "//chrome_ext/components/detangle-intercepted-page",
        "@org_polymer",
        "@org_polymer_webcomponentsjs",
    ],
)

web_bin(
    name = "eventlog",
    srcs = ["eventlog_src.html"],
    path = "/",
    deps = [
        "//chrome_ext/components/detangle-event-list",
        "@org_polymer",
        "@org_polymer_paper_toolbar",
        "@org_polymer_webcomponentsjs",
    ],
)

web_bin(
    name = "firstrun",
    srcs = ["firstrun_src.html"],
    path = "/",
    deps = [
        "//chrome_ext/components/detangle-status-card",
        "//chrome_ext/components/detangle-theme-card",
        "@org_polymer",
        "@org_polymer_paper_material",
        "@org_polymer_webcomponentsjs",
    ],
)

web_bin(
    name = "options",
    srcs = ["options_src.html"],
    path = "/",
    deps = [
        "//chrome_ext/components/detangle-options",
        "@org_polymer",
        "@org_polymer_paper_material",
        "@org_polymer_webcomponentsjs",
    ],
)

web_bin(
    name = "popup",
    srcs = ["popup_src.html"],
    path = "/",
    deps = [
        "//chrome_ext/components/detangle-event-list",
        "//chrome_ext/components/detangle-launch-profile-card",
        "//chrome_ext/components/detangle-status",
        "//chrome_ext/components/detangle-status-card",
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_icons",
        "@org_polymer_paper_button",
        "@org_polymer_webcomponentsjs",
    ],
)

pkg_tar(
    name = "extension_files",
    srcs = [
        "icon128.png",
        "icon16.png",
        "icon48.png",
        "managed_storage_schema.json",
        "manifest.json",
        "open.html",
        "sync_options.css",
        "sync_options.html",
        ":background",
        ":eventlog",
        ":firstrun",
        ":intercepted",
        ":open",
        ":options",
        ":popup",
        ":sync_options",
    ],
    package_dir = "/",
)

genrule(
    name = "chrome_ext",
    srcs = [
        ":extension_files",
    ],
    outs = ["extension.zip"],
    cmd = "mkdir -p @D/extension_files && \
        tar -C @D/extension_files -xf $(location extension_files) && \
        tar -tf $(location extension_files) | grep -v '/$$' | (cd @D/extension_files && zip - -@) > $@",
)
