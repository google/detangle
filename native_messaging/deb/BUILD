load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar", "pkg_deb")

pkg_tar(
    name = "detanglenm_bin",
    srcs = ["//native_messaging:detanglenm"],
    mode = "0755",
    package_dir = "/usr/lib/detangle",
)

pkg_tar(
    name = "detanglenm_host_json",
    srcs = ["com.google.corp.detangle.json"],
    mode = "0644",
    package_dir = "/etc/opt/chrome/native-messaging-hosts",
)

pkg_tar(
    name = "detangle_crx_json",
    srcs = ["hcmeejlfgajdddobdodhlhcolankfpli.json"],
    mode = "0644",
    package_dir = "/opt/google/chrome/extensions/",
)

pkg_tar(
    name = "detanglenm_tar",
    deps = [
        ":detangle_crx_json",
        ":detanglenm_bin",
        ":detanglenm_host_json",
    ],
)

pkg_deb(
    name = "detanglenm_deb",
    data = ":detanglenm_tar",
    depends = [
        "google-chrome-stable (>= 55)",
    ],
    description =
        "Native Messaging helper for detangle\n" +
        " The detangle chrome extension requires a " +
        "native messaging host program in order to " +
        "hand off requests to subordinate profiles.",
    maintainer = "The Detangle Team <detangle-dev@googlegroups.com>",
    package = "detanglenm",
    version = "2.0",
)
