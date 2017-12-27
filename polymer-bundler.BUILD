load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

package(default_visibility = ["//visibility:public"])

nodejs_binary(
    name = "vulcanize",
    entry_point = "polymer_bundler_repo/bin/vulcanize",
    node_modules = "@vulcanize//:node_modules",
    data = [
        "bin/vulcanize",
    ],
)
