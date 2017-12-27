load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

package(default_visibility = ["//visibility:public"])

nodejs_binary(
    name = "crisper",
    entry_point = "crisper_repo/bin/crisper",
    node_modules = "@crisper//:node_modules",
    data = [
        "bin/crisper",
    ],
)
