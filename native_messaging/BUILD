# Description:
#   Detangle nativeMessaging host

load("@io_bazel_rules_go//go:def.bzl", "go_binary", "go_library", "go_test")

go_binary(
    name = "detanglenm",
    srcs = ["detanglenm.go"],
    importpath = "github.com/google/detangle/native_messaging",
    visibility = ["//visibility:public"],
    deps = [
        ":detangle",
        ":nativemessaging",
    ],
)

go_library(
    name = "nativemessaging",
    srcs = [
        "nativemessaging.go",
        "nativemessaging_le.go",
    ],
    importpath = "github.com/google/detangle/native_messaging/nativemessaging",
)

go_library(
    name = "detangle",
    srcs = [
        "detangle.go",
        "detangle_darwin.go",
        "detangle_linux.go",
        "detangle_windows.go",
    ],
    importpath = "github.com/google/detangle/native_messaging/detangle",
)
