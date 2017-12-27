// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.

goog.setTestOnly();

goog.require('detangle.Profiles');
goog.require('detangle.ThemeIds');
goog.require('goog.testing.jsunit');


function setUp() {
  goog.global.chrome = {
    runtime: {sendMessage: function() {}},
  };
}


function testRecommendedTheme() {
  var element = document.createElement('detangle-theme-card');
  element.thisProfile = detangle.Profiles.CORPORATE;
  assertEquals(detangle.ThemeIds[detangle.Profiles.CORPORATE], element.themeId);
}
