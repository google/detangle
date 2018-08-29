http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "b29a8bc2cb10513c864cb1084d6f38613ef14a143797cea0af0f91cd385f5e8c",
    strip_prefix = "rules_closure-0.8.0",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_closure/archive/0.8.0.tar.gz",
        "https://github.com/bazelbuild/rules_closure/archive/0.8.0.tar.gz",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()

http_archive(
    name = "io_bazel_rules_go",
    sha256 = "90bb270d0a92ed5c83558b2797346917c46547f6f7103e648941ecdb6b9d0e72",
    url = "https://github.com/bazelbuild/rules_go/releases/download/0.8.1/rules_go-0.8.1.tar.gz",
)

load("@io_bazel_rules_go//go:def.bzl", "go_rules_dependencies", "go_register_toolchains")

go_rules_dependencies()

go_register_toolchains()

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "7550c6f7904f602b69c2a69d92f7c739db87479336554c7a31d0649519ec414e",
    strip_prefix = "rules_nodejs-0.3.1",
    urls = ["https://github.com/bazelbuild/rules_nodejs/archive/0.3.1.tar.gz"],
)

new_http_archive(
    name = "polymer_bundler_repo",
    build_file = "polymer-bundler.BUILD",
    sha256 = "906c8a2d5c47f7e43e580c120f6e636e7fb87ff82d065fa65ad8abdfafc3fc5d",
    strip_prefix = "polymer-bundler-1.16.0",
    urls = ["https://github.com/Polymer/polymer-bundler/archive/v1.16.0.tar.gz"],
)

new_http_archive(
    name = "crisper_repo",
    build_file = "crisper.BUILD",
    sha256 = "c2865c3bc50e4efa2d4be944fb7df3d18cf8f3730ca9df3fe613c03761158cd2",
    strip_prefix = "crisper-2.1.1",
    urls = ["https://github.com/PolymerLabs/crisper/archive/v2.1.1.tar.gz"],
)

load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "npm_install")

node_repositories(package_json = [
    "@polymer_bundler_repo//:package.json",
    "@crisper_repo//:package.json",
])

npm_install(
    name = "vulcanize",
    package_json = "@polymer_bundler_repo//:package.json",
)

npm_install(
    name = "crisper",
    package_json = "@crisper_repo//:package.json",
)

new_http_archive(
    name = "closure_compiler",
    build_file = "closure_compiler.BUILD",
    sha256 = "e7d5f24a9ba38b84294c8acc866a9d4ba0da03f297655d588d33d982cb6133f8",
    strip_prefix = "closure-compiler-20180101",
    urls = [
        "https://github.com/google/closure-compiler/archive/v20180101.tar.gz",
    ],
)

load("//defs:repo.bzl", "web_repo")

web_repo(
    name = "web_animations_js",
    srcs = ["web-animations-next-lite.min.js"],
    licenses = ["notice"],
    path = "/web-animations-js",
    sha256 = "ae578bfa2182983821e8292b00ac941e569b08c3ff7c3a34091996b90491b3e4",
    strip_prefix = "web-animations-js-2.3.1",
    urls = ["https://github.com/web-animations/web-animations-js/archive/2.3.1.tar.gz"],
)

web_repo(
    name = "org_polymer",
    srcs = [
        "polymer.html",
        "polymer-micro.html",
        "polymer-mini.html",
    ],
    licenses = ["notice"],
    path = "/polymer",
    sha256 = "17f4e6d0839a520738f1745ae16dc3573b695575f3f063f3b19b7b3fca98bffd",
    strip_prefix = "polymer-1.11.2",
    urls = ["https://github.com/Polymer/polymer/archive/v1.11.2.tar.gz"],
)

web_repo(
    name = "org_polymer_webcomponentsjs",
    srcs = [
        "webcomponents-lite.min.js",
    ],
    licenses = ["notice"],
    path = "/webcomponentsjs",
    sha256 = "1f58decac693deb926e6b62b5dbd459fb7c2e961f7241e6e646d1cd9a60281d2",
    strip_prefix = "webcomponentsjs-0.7.23",
    urls = ["https://github.com/webcomponents/webcomponentsjs/archive/v0.7.23.tar.gz"],
)

web_repo(
    name = "org_polymer_font_roboto",
    srcs = [
        "roboto.html",
    ],
    licenses = ["notice"],
    path = "/font-roboto",
    sha256 = "fae51429b56a4a4c15f1f0c23b733c7095940cc9c04c275fa7adb3bf055b23b3",
    strip_prefix = "font-roboto-1.0.1",
    urls = ["https://github.com/PolymerElements/font-roboto/archive/v1.0.1.tar.gz"],
)

web_repo(
    name = "org_polymer_iron_dropdown",
    srcs = [
        "iron-dropdown.html",
        "iron-dropdown-scroll-manager.html",
    ],
    licenses = ["notice"],
    path = "/iron-dropdown",
    sha256 = "db9d6598157f8b114f1be1e6ed1c74917d4c37e660b2dda1e31f6873f1a33b80",
    strip_prefix = "iron-dropdown-1.5.5",
    urls = ["https://github.com/PolymerElements/iron-dropdown/archive/v1.5.5.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_overlay_behavior",
        "@org_polymer_iron_resizable_behavior",
        "@org_polymer_neon_animation",
    ],
)

web_repo(
    name = "org_polymer_iron_image",
    srcs = [
        "iron-image.html",
    ],
    licenses = ["notice"],
    path = "/iron-image",
    sha256 = "a9615d182a1a8292e95fc6a349ba2a78f87539db0f3990a57c8d491de1ec4c35",
    strip_prefix = "iron-image-1.2.4",
    urls = ["https://github.com/PolymerElements/iron-image/archive/v1.2.4.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
    ],
)

web_repo(
    name = "org_polymer_iron_input",
    srcs = [
        "iron-input.html",
    ],
    licenses = ["notice"],
    path = "/iron-input",
    sha256 = "e26c49cfa8f013d09d6cc45f6ca76b390ebbe5baea4755d2d0900df083d5ae44",
    strip_prefix = "iron-input-1.0.11",
    urls = ["https://github.com/PolymerElements/iron-input/archive/v1.0.11.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_announcer",
        "@org_polymer_iron_validatable_behavior",
    ],
)

web_repo(
    name = "org_polymer_iron_meta",
    srcs = [
        "iron-meta.html",
    ],
    licenses = ["notice"],
    path = "/iron-meta",
    sha256 = "fb05e6031bae6b4effe5f15d44b3f548d5807f9e3b3aa2442ba17cf4b8b84361",
    strip_prefix = "iron-meta-1.1.1",
    urls = ["https://github.com/PolymerElements/iron-meta/archive/v1.1.1.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_validatable_behavior",
    srcs = [
        "iron-validatable-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-validatable-behavior",
    sha256 = "aef4901e68043824f36104799269573dd345ffaac494186e466fdc79c06fdb63",
    strip_prefix = "iron-validatable-behavior-1.1.1",
    urls = ["https://github.com/PolymerElements/iron-validatable-behavior/archive/v1.1.1.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_meta",
    ],
)

new_http_archive(
    name = "org_polymer_neon_animation",
    build_file_content = """
package(default_visibility = ["//visibility:public"])

load("@io_bazel_rules_closure//closure:defs.bzl", "web_library")
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")

web_library(
    name = "org_polymer_neon_animation",
    srcs = [
        "animations/fade-in-animation.html",
        "animations/fade-out-animation.html",
        "animations/opaque-animation.html",
        "neon-animatable-behavior.html",
        "neon-animation-behavior.html",
        "neon-animation-runner-behavior.html",
        "web-animations.html",
    ],
    path = "/neon-animation",
    deps = [
        "@org_polymer",
        "@org_polymer_iron_meta",
        "@web_animations_js",
    ],
)

pkg_tar(
    name = "animations_tar",
    srcs = glob(["animations/*.html"]),
    package_dir = "/animations",
)

pkg_tar(
    name = "src_tar",
    srcs = glob(["*.html"]),
    package_dir = "/neon-animation",
    deps = [":animations_tar"],
)

pkg_tar(
    name = "tar",
    deps = [
        ":src_tar",
        "@org_polymer//:tar",
        "@org_polymer_iron_meta//:tar",
        "@web_animations_js//:tar",
    ],
)
""",
    sha256 = "8800c314a76b2da190a2b203259c1091f6d38e0057ed37c2a3d0b734980fa9a5",
    strip_prefix = "neon-animation-1.2.2",
    urls = ["https://github.com/PolymerElements/neon-animation/archive/v1.2.2.tar.gz"],
)

web_repo(
    name = "org_polymer_paper_button",
    srcs = [
        "paper-button.html",
    ],
    licenses = ["notice"],
    path = "/paper-button",
    sha256 = "896c0a7e34bfcce63fc23c63e105ed9c4d62fa3a6385b7161e1e5cd4058820a6",
    strip_prefix = "paper-button-1.0.11",
    urls = ["https://github.com/PolymerElements/paper-button/archive/v1.0.11.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_paper_behaviors",
        "@org_polymer_paper_material",
        "@org_polymer_paper_ripple",
    ],
)

web_repo(
    name = "org_polymer_paper_card",
    srcs = [
        "paper-card.html",
    ],
    licenses = ["notice"],
    path = "/paper-card",
    sha256 = "8ec5cdc936847c218b22b883d8f22377f59876c4c0cbb15b951bfd0a74ec5486",
    strip_prefix = "paper-card-1.1.4",
    urls = ["https://github.com/PolymerElements/paper-card/archive/v1.1.4.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_image",
        "@org_polymer_paper_material",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_dialog_behavior",
    srcs = [
        "paper-dialog-behavior.html",
        "paper-dialog-shared-styles.html",
    ],
    licenses = ["notice"],
    path = "/paper-dialog-behavior",
    sha256 = "d78e4f7d008c22537a9255ccda1e919fddae5cc125ef26a66eb2c47f648c20ab",
    strip_prefix = "paper-dialog-behavior-1.2.7",
    urls = ["https://github.com/PolymerElements/paper-dialog-behavior/archive/v1.2.7.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_overlay_behavior",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_dropdown_menu",
    srcs = [
        "paper-dropdown-menu.html",
        "paper-dropdown-menu-icons.html",
        "paper-dropdown-menu-shared-styles.html",
    ],
    licenses = ["notice"],
    path = "/paper-dropdown-menu",
    sha256 = "9d88f654ec03ee9be211df9e69bede9e8a22b51bf1dbcc63b79762e4256d81ad",
    strip_prefix = "paper-dropdown-menu-1.4.0",
    urls = ["https://github.com/PolymerElements/paper-dropdown-menu/archive/v1.4.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_form_element_behavior",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_iconset_svg",
        "@org_polymer_iron_validatable_behavior",
        "@org_polymer_paper_input",
        "@org_polymer_paper_menu_button",
        "@org_polymer_paper_ripple",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_fab",
    srcs = [
        "paper-fab.html",
    ],
    licenses = ["notice"],
    path = "/paper-fab",
    sha256 = "0a8eb22ab91902b671a6bb1ebb5f65aa7655f132ea5b45169bc9a429690d417d",
    strip_prefix = "paper-fab-1.2.0",
    urls = ["https://github.com/PolymerElements/paper-fab/archive/v1.2.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_icon",
        "@org_polymer_paper_behaviors",
        "@org_polymer_paper_material",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_input",
    srcs = [
        "paper-input.html",
        "paper-input-addon-behavior.html",
        "paper-input-behavior.html",
        "paper-input-char-counter.html",
        "paper-input-container.html",
        "paper-input-error.html",
    ],
    licenses = ["notice"],
    path = "/paper-input",
    sha256 = "17c3dea9bb1c2026cc61324696c6c774214a0dc37686b91ca214a6af550994db",
    strip_prefix = "paper-input-1.1.18",
    urls = ["https://github.com/PolymerElements/paper-input/archive/v1.1.18.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_form_element_behavior",
        "@org_polymer_iron_input",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_menu_button",
    srcs = [
        "paper-menu-button.html",
        "paper-menu-button-animations.html",
    ],
    licenses = ["notice"],
    path = "/paper-menu-button",
    sha256 = "be3290c288a2bd4f9887213db22c75add99cc29ff4d088100c0bc4eb0e57997b",
    strip_prefix = "paper-menu-button-1.5.1",
    urls = ["https://github.com/PolymerElements/paper-menu-button/archive/v1.5.1.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_dropdown",
        "@org_polymer_neon_animation",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_styles",
    srcs = [
        "color.html",
        "default-theme.html",
        "shadow.html",
        "typography.html",
    ],
    licenses = ["notice"],
    path = "/paper-styles",
    sha256 = "6d26b0a4c286402098853dc7388f6b22f30dfb7a74e47b34992ac03380144bb2",
    strip_prefix = "paper-styles-1.1.4",
    urls = ["https://github.com/PolymerElements/paper-styles/archive/v1.1.4.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_font_roboto",
        "@org_polymer_iron_flex_layout",
    ],
)

web_repo(
    name = "org_polymer_paper_toolbar",
    srcs = [
        "paper-toolbar.html",
    ],
    licenses = ["notice"],
    path = "/paper-toolbar",
    sha256 = "dbddffc0654d9fb5fb48843087eebe16bf7a134902495a664c96c11bf8a2c63d",
    strip_prefix = "paper-toolbar-1.1.4",
    urls = ["https://github.com/PolymerElements/paper-toolbar/archive/v1.1.4.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_iron_a11y_announcer",
    srcs = [
        "iron-a11y-announcer.html",
    ],
    licenses = ["notice"],
    path = "/iron-a11y-announcer",
    sha256 = "53114ceb57d9f33a7a8058488cf06450e48502e5d033adf51c91330f61620353",
    strip_prefix = "iron-a11y-announcer-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-a11y-announcer/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_a11y_keys_behavior",
    srcs = [
        "iron-a11y-keys-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-a11y-keys-behavior",
    sha256 = "09274155c8d537f8bb567b3be5e747253ef760995a59ee06cb0ab38e704212fb",
    strip_prefix = "iron-a11y-keys-behavior-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-a11y-keys-behavior/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_autogrow_textarea",
    srcs = [
        "iron-autogrow-textarea.html",
    ],
    licenses = ["notice"],
    path = "/iron-autogrow-textarea",
    sha256 = "16101eae3860ef74186728ba6fb7422dcf8d0f5f32229fb9444a1e25e8dcb5cf",
    strip_prefix = "iron-autogrow-textarea-2.1.0",
    urls = ["https://github.com/PolymerElements/iron-autogrow-textarea/archive/v2.1.0.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_behaviors",
    srcs = [
        "iron-button-state.html",
        "iron-control-state.html",
    ],
    licenses = ["notice"],
    path = "/iron-behaviors",
    sha256 = "b6f65694a159f64d68918d8806b36091d5f2c66fb780f7c40df10880e57fdef3",
    strip_prefix = "iron-behaviors-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-behaviors/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
    ],
)

web_repo(
    name = "org_polymer_iron_checked_element_behavior",
    srcs = [
        "iron-checked-element-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-checked-element-behavior",
    sha256 = "1fe969aefe006506a391780da670ea5420bf9440f0fa45a7afa5740010f5eaf1",
    strip_prefix = "iron-checked-element-behavior-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-checked-element-behavior/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_form_element_behavior",
        "@org_polymer_iron_validatable_behavior",
    ],
)

web_repo(
    name = "org_polymer_iron_collapse",
    srcs = [
        "iron-collapse.html",
    ],
    licenses = ["notice"],
    path = "/iron-collapse",
    sha256 = "eb72f459a2a5adbcd922327eea02ed909e8056ad72fd8a32d04a14ce54b2e480",
    strip_prefix = "iron-collapse-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-collapse/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_resizable_behavior",
    ],
)

web_repo(
    name = "org_polymer_iron_fit_behavior",
    srcs = [
        "iron-fit-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-fit-behavior",
    sha256 = "3ddbf38afe5e0a0b4fabc2e2d01712e15c7ab4eed67ddfa5a539c99bc1c8df8f",
    strip_prefix = "iron-fit-behavior-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-fit-behavior/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_flex_layout",
    srcs = [
        "iron-flex-layout.html",
        "iron-flex-layout-classes.html",
    ],
    licenses = ["notice"],
    path = "/iron-flex-layout",
    sha256 = "eff003800e21e94b9a30ec45dfe02a7b7e174e46b61760f2f15df1acc739e305",
    strip_prefix = "iron-flex-layout-2.0.1",
    urls = ["https://github.com/PolymerElements/iron-flex-layout/archive/v2.0.1.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_form_element_behavior",
    srcs = [
        "iron-form-element-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-form-element-behavior",
    sha256 = "af58a6a019565bc050cc1c105a46db6d109a6c5365cbd35c48f8ccc7a628cd78",
    strip_prefix = "iron-form-element-behavior-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-form-element-behavior/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_icon",
    srcs = [
        "iron-icon.html",
    ],
    licenses = ["notice"],
    path = "/iron-icon",
    sha256 = "bfda4c135ce33cd7d45df8f7372d66d1279a9965ff7178ee3cada41ee11ef7f8",
    strip_prefix = "iron-icon-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-icon/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_meta",
    ],
)

web_repo(
    name = "org_polymer_iron_icons",
    srcs = [
        "device-icons.html",
        "iron-icons.html",
        "notification-icons.html",
    ],
    licenses = ["notice"],
    path = "/iron-icons",
    sha256 = "8e091b9e6f7198f6a0ac41d636cda25921c44346865d0af01e7c6629f381ddd2",
    strip_prefix = "iron-icons-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-icons/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_iconset_svg",
    ],
)

web_repo(
    name = "org_polymer_iron_iconset_svg",
    srcs = [
        "iron-iconset-svg.html",
    ],
    licenses = ["notice"],
    path = "/iron-iconset-svg",
    sha256 = "3a93fd7342e3ce3035018d6aa554d3696090024dfcf2a7c18ed2c287fe1794be",
    strip_prefix = "iron-iconset-svg-2.1.0",
    urls = ["https://github.com/PolymerElements/iron-iconset-svg/archive/v2.1.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_meta",
    ],
)

web_repo(
    name = "org_polymer_iron_menu_behavior",
    srcs = [
        "iron-menu-behavior.html",
        "iron-menubar-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-menu-behavior",
    sha256 = "35d33d1ae55c6efaa0c3744ebe8a06cc0a8b2af9286dd8d36e20726a8540a11a",
    strip_prefix = "iron-menu-behavior-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-menu-behavior/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_selector",
    ],
)

web_repo(
    name = "org_polymer_iron_overlay_behavior",
    srcs = [
        "iron-focusables-helper.html",
        "iron-overlay-backdrop.html",
        "iron-overlay-behavior.html",
        "iron-overlay-manager.html",
        "iron-scroll-manager.html",
    ],
    licenses = ["notice"],
    path = "/iron-overlay-behavior",
    sha256 = "f50fcc44b1f72a3ca7d4c6dbf2355db2df8b7a8e00120f39237ab074fbda0739",
    strip_prefix = "iron-overlay-behavior-2.2.1",
    urls = ["https://github.com/PolymerElements/iron-overlay-behavior/archive/v2.2.1.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_fit_behavior",
        "@org_polymer_iron_resizable_behavior",
    ],
)

web_repo(
    name = "org_polymer_iron_pages",
    srcs = [
        "iron-pages.html",
    ],
    licenses = ["notice"],
    path = "/iron-pages",
    sha256 = "14e88a125c617d917491678440d29de5b15fb268a00486fb5b45c226b5952445",
    strip_prefix = "iron-pages-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-pages/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_resizable_behavior",
        "@org_polymer_iron_selector",
    ],
)

web_repo(
    name = "org_polymer_iron_resizable_behavior",
    srcs = [
        "iron-resizable-behavior.html",
    ],
    licenses = ["notice"],
    path = "/iron-resizable-behavior",
    sha256 = "6dc5c52a1aba277d7572cc0cfa5fe4ee968fa97de69f68bd748ee8ef10298fc8",
    strip_prefix = "iron-resizable-behavior-2.0.0",
    urls = ["https://github.com/PolymerElements/iron-resizable-behavior/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_iron_selector",
    srcs = [
        "iron-multi-selectable.html",
        "iron-selectable.html",
        "iron-selection.html",
        "iron-selector.html",
    ],
    licenses = ["notice"],
    path = "/iron-selector",
    sha256 = "1b40e4885f509a84b61b384cb3c756583d02a28933e35304d7294b793491e5b7",
    strip_prefix = "iron-selector-2.0.1",
    urls = ["https://github.com/PolymerElements/iron-selector/archive/v2.0.1.tar.gz"],
    deps = [
        "@org_polymer",
    ],
)

web_repo(
    name = "org_polymer_paper_behaviors",
    srcs = [
        "paper-button-behavior.html",
        "paper-checked-element-behavior.html",
        "paper-inky-focus-behavior.html",
        "paper-ripple-behavior.html",
    ],
    licenses = ["notice"],
    path = "/paper-behaviors",
    sha256 = "42cee87157745d63e7f2411943adff7d237f20ed9076ac04b638e5b814777a53",
    strip_prefix = "paper-behaviors-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-behaviors/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_checked_element_behavior",
        "@org_polymer_paper_ripple",
    ],
)

web_repo(
    name = "org_polymer_paper_checkbox",
    srcs = [
        "paper-checkbox.html",
    ],
    licenses = ["notice"],
    path = "/paper-checkbox",
    sha256 = "0a291d0c64de1b6b807d66697bead9c66c0d7bc3c68b8037e6667f3d66a5904c",
    strip_prefix = "paper-checkbox-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-checkbox/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_paper_behaviors",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_dialog",
    srcs = [
        "paper-dialog.html",
    ],
    licenses = ["notice"],
    path = "/paper-dialog",
    sha256 = "b23d1e57579a2e999f1ab411b69c0a9807179ddd68960082e69575936c23f6c4",
    strip_prefix = "paper-dialog-2.0.1",
    urls = ["https://github.com/PolymerElements/paper-dialog/archive/v2.0.1.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_neon_animation",
        "@org_polymer_paper_dialog_behavior",
    ],
)

web_repo(
    name = "org_polymer_paper_dialog_scrollable",
    srcs = [
        "paper-dialog-scrollable.html",
    ],
    licenses = ["notice"],
    path = "/paper-dialog-scrollable",
    sha256 = "65e830fe6de3ecbc9482f3900b5f80b77d3268542f5b9bf89e0aea70fbb284d7",
    strip_prefix = "paper-dialog-scrollable-2.1.0",
    urls = ["https://github.com/PolymerElements/paper-dialog-scrollable/archive/v2.1.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_paper_dialog_behavior",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_icon_button",
    srcs = [
        "paper-icon-button.html",
    ],
    licenses = ["notice"],
    path = "/paper-icon-button",
    sha256 = "1bc160d536e5844ef4b288ba56ec7f3a7ffc05225dc962314a7dd3023df63ceb",
    strip_prefix = "paper-icon-button-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-icon-button/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_icon",
        "@org_polymer_paper_behaviors",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_item",
    srcs = [
        "paper-icon-item.html",
        "paper-item.html",
        "paper-item-behavior.html",
        "paper-item-body.html",
        "paper-item-shared-styles.html",
    ],
    licenses = ["notice"],
    path = "/paper-item",
    sha256 = "c0b752cacd7125d568077760c9f80a8d9cc39113c3262d6af0a2bdc0228c1293",
    strip_prefix = "paper-item-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-item/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_listbox",
    srcs = [
        "paper-listbox.html",
    ],
    licenses = ["notice"],
    path = "/paper-listbox",
    sha256 = "674992d882b18a0618fa697180f196dbc052fb2f5d9ce4e19026a918b568ffd6",
    strip_prefix = "paper-listbox-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-listbox/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_menu_behavior",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_material",
    srcs = [
        "paper-material.html",
        "paper-material-shared-styles.html",
    ],
    licenses = ["notice"],
    path = "/paper-material",
    sha256 = "913e9c63cf5c8286b0fab817079d7dc900a343d2c05809995d8d9ba0e41f8a29",
    strip_prefix = "paper-material-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-material/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_radio_button",
    srcs = [
        "paper-radio-button.html",
    ],
    licenses = ["notice"],
    path = "/paper-radio-button",
    sha256 = "160d5eb37e556837ca0164ab80bffa2b9ce77857c009e07bde69d23b729aba24",
    strip_prefix = "paper-radio-button-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-radio-button/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_paper_behaviors",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_radio_group",
    srcs = [
        "paper-radio-group.html",
    ],
    licenses = ["notice"],
    path = "/paper-radio-group",
    sha256 = "f218d57dd3e4ebab4632832efe094de4b2667a0513994f6b0477af36e149ec41",
    strip_prefix = "paper-radio-group-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-radio-group/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
        "@org_polymer_iron_menu_behavior",
        "@org_polymer_paper_radio_button",
    ],
)

web_repo(
    name = "org_polymer_paper_ripple",
    srcs = [
        "paper-ripple.html",
    ],
    licenses = ["notice"],
    path = "/paper-ripple",
    sha256 = "388cbc3817adf121eb8a41ef484c2e536c40111793be1882b48fffe7dadd54e5",
    strip_prefix = "paper-ripple-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-ripple/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_keys_behavior",
    ],
)

web_repo(
    name = "org_polymer_paper_spinner",
    srcs = [
        "paper-spinner.html",
        "paper-spinner-behavior.html",
        "paper-spinner-styles.html",
    ],
    licenses = ["notice"],
    path = "/paper-spinner",
    sha256 = "c1f581ce90acb3387bff0d26830595647ea919cd346a1694430cfeba07ea2d45",
    strip_prefix = "paper-spinner-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-spinner/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_tabs",
    srcs = [
        "paper-tab.html",
        "paper-tabs.html",
        "paper-tabs-icons.html",
    ],
    licenses = ["notice"],
    path = "/paper-tabs",
    sha256 = "2373aab7e4a2e2307a20bc90ba71f919b6e73638afc9d86238ae03770f347c5f",
    strip_prefix = "paper-tabs-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-tabs/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_behaviors",
        "@org_polymer_iron_flex_layout",
        "@org_polymer_iron_icon",
        "@org_polymer_iron_iconset_svg",
        "@org_polymer_iron_menu_behavior",
        "@org_polymer_iron_resizable_behavior",
        "@org_polymer_paper_behaviors",
        "@org_polymer_paper_icon_button",
        "@org_polymer_paper_styles",
    ],
)

web_repo(
    name = "org_polymer_paper_toast",
    srcs = [
        "paper-toast.html",
    ],
    licenses = ["notice"],
    path = "/paper-toast",
    sha256 = "b1c677e1681ef8d3f688a83da8f7b263902f757f395a9354a1c35f93b9125b60",
    strip_prefix = "paper-toast-2.0.0",
    urls = ["https://github.com/PolymerElements/paper-toast/archive/v2.0.0.tar.gz"],
    deps = [
        "@org_polymer",
        "@org_polymer_iron_a11y_announcer",
        "@org_polymer_iron_overlay_behavior",
    ],
)
