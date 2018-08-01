# Copyright 2017 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

def _tar_dep(dep):
    return dep + "//:tar"

def _tar_deps(deps):
    return [_tar_dep(d) for d in deps]

def _quote_string(i):
    return "\"" + i.replace("\"", "\\\"") + "\""

def _join_list(l):
    return ",".join([_quote_string(i) for i in l])

def web_repo(name, srcs, path, urls, sha256, strip_prefix, deps = [], licenses = ""):
    native.new_http_archive(
        name = name,
        urls = urls,
        sha256 = sha256,
        strip_prefix = strip_prefix,
        build_file_content = """
package(default_visibility = ["//visibility:public"])

load("@io_bazel_rules_closure//closure:defs.bzl", "web_library")
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")

web_library(
    name = "%s",
    srcs = [%s],
    path = %s,
    deps = [%s],
)

pkg_tar(
    name = "src_tar",
    srcs = [%s],
    package_dir = %s,
)

pkg_tar(
    name = "tar",
    deps = [":src_tar",%s],
    package_dir = "/",
)
""" % (name, _join_list(srcs), _quote_string(path), _join_list(deps), _join_list(srcs), _quote_string(path), _join_list(_tar_deps(deps))),
    )
