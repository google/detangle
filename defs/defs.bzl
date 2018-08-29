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

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary", "closure_js_library", "web_library")
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")

def _tar_dep(dep):
    if dep.startswith("@"):
        return dep + "//:tar"
    else:
        return dep + ":" + dep.split("/")[-1].split(":")[-1] + "_tar"

def _tar_deps(deps):
    return [_tar_dep(d) for d in deps]

def web_lib(name, srcs, path, deps = []):
    web_library(
        name = name,
        srcs = srcs,
        path = path,
        deps = deps,
    )

    pkg_tar(
        name = name + "_src_tar",
        srcs = srcs,
        package_dir = path,
    )

    pkg_tar(
        name = name + "_tar",
        deps = [":" + name + "_src_tar"] + _tar_deps(deps),
        package_dir = "/",
    )

def web_bin(name, srcs, path, deps = []):
    web_lib(
        name = name + "_lib",
        srcs = srcs,
        path = path,
        deps = deps,
    )

    native.genrule(
        name = name,
        srcs = [":" + name + "_lib_tar"],
        outs = [
            name + ".html",
            name + ".js",
        ],
        cmd = "mkdir $(@D)/tar && \
        tar -C $(@D)/tar -xf $< && \
        $(location @polymer_bundler_repo//:vulcanize) --inline-scripts --inline-css $(@D)/tar/%s_src.html |\
        $(location @crisper_repo//:crisper) --script-in-head false -h $(location %s.html) -j $(location %s.js)" % (name, name, name),
        tools = [
            "@crisper_repo//:crisper",
            "@polymer_bundler_repo//:vulcanize",
        ],
    )

def detangle_component(name, js_deps = [], component_deps = [], suppress = []):
    closure_js_binary(
        name = "%s-compiled" % name,
        compilation_level = "SIMPLE",
        defs = [
            "--isolation_mode=IIFE",
            "--polymer_version=1",
            "--polymer_pass",
        ],
        dependency_mode = "LOOSE",
        language = "ECMASCRIPT5",
        deps = [
            ":%s_js" % name,
            "@closure_compiler//:chrome_ext_externs",
            "@closure_compiler//:polymer_externs",
        ],
    )

    closure_js_library(
        name = "%s_js" % name,
        srcs = ["%s.js" % name],
        convention = "GOOGLE",
        deps = js_deps,
        suppress = suppress,
    )

    web_lib(
        name = "%s" % name,
        srcs = [
            "%s.html" % name,
            ":%s-compiled" % name,
        ],
        path = "/%s" % name,
        deps = component_deps,
    )
