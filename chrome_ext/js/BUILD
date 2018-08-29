load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library", "closure_js_test")

package(default_visibility = ["//visibility:public"])

closure_js_library(
    name = "acl_js",
    srcs = ["acl.js"],
    convention = "GOOGLE",
    suppress = ["reportUnknownTypes"],
    deps = [
        ":aclentries_js",
        ":common_js",
        ":matchpatterns_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "aclentries_js",
    srcs = ["aclentries.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        ":matchpatterns_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "common_js",
    srcs = ["common.js"],
    convention = "GOOGLE",
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "eventlog_js",
    srcs = ["eventlog.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "firstrun_js",
    srcs = ["firstrun.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        ":storage_js",
        ":utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "matchpatterns_js",
    srcs = ["matchpatterns.js"],
    convention = "GOOGLE",
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "route_js",
    srcs = ["route.js"],
    convention = "GOOGLE",
    deps = [
        ":acl_js",
        ":common_js",
        ":settings_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "oauth_js",
    srcs = ["oauth.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        ":eventlog_js",
        ":matchpatterns_js",
        ":route_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "open_js",
    srcs = ["open.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        ":storage_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "settings_js",
    srcs = ["settings.js"],
    convention = "GOOGLE",
    suppress = ["reportUnknownTypes"],
    deps = [
        ":acl_js",
        ":common_js",
        ":matchpatterns_js",
        ":utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "loadsettings_js",
    srcs = ["loadsettings.js"],
    convention = "GOOGLE",
    deps = [
        ":acl_js",
        ":common_js",
        ":settings_js",
        ":storage_js",
        ":utils_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "storage_js",
    srcs = ["storage.js"],
    convention = "GOOGLE",
    suppress = [
        "JSC_MISSING_CONST_PROPERTY",
    ],
    deps = [
        ":common_js",
        "@closure_compiler//:chrome_ext_externs",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "sync_js",
    srcs = ["sync.js"],
    convention = "GOOGLE",
    suppress = ["reportUnknownTypes"],
    deps = [
        ":common_js",
        ":storage_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "background_js",
    srcs = ["background.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        ":eventlog_js",
        ":loadsettings_js",
        ":matchpatterns_js",
        ":oauth_js",
        ":route_js",
        ":settings_js",
        ":storage_js",
        ":sync_js",
        ":utils_js",
        ":webservice_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "utils_js",
    srcs = ["utils.js"],
    convention = "GOOGLE",
    deps = [
        ":common_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "sync_options_js",
    srcs = ["sync_options.js"],
    convention = "GOOGLE",
    suppress = ["reportUnknownTypes"],
    deps = [
        ":common_js",
        ":firstrun_js",
        ":storage_js",
        ":sync_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "webservice_js",
    srcs = ["webservice.js"],
    convention = "GOOGLE",
    suppress = ["reportUnknownTypes"],
    deps = [
        ":common_js",
        ":settings_js",
        ":storage_js",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "test_common_js",
    testonly = 1,
    srcs = ["test_common.js"],
    convention = "GOOGLE",
    suppress = ["reportUnknownTypes"],
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_test(
    name = "js_tests",
    testonly = 1,
    srcs = glob([
        "*_test.js",
        "*_test.html",
    ]),
    suppress = ["reportUnknownTypes"],
    deps = [
        ":acl_js",
        ":aclentries_js",
        ":background_js",
        ":common_js",
        ":eventlog_js",
        ":firstrun_js",
        ":loadsettings_js",
        ":matchpatterns_js",
        ":oauth_js",
        ":route_js",
        ":settings_js",
        ":storage_js",
        ":sync_js",
        ":sync_options_js",
        ":test_common_js",
        ":utils_js",
        ":webservice_js",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/library:testing",
    ],
)
