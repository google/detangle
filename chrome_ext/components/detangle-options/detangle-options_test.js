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

/**
 * @fileoverview Tests for the detangle-options component
 */

'use strict';

goog.require('detangle.Profiles');
goog.require('goog.testing.jsunit');


function setUp() {
  chrome = {
    runtime: {
      sendMessage: function() {},
      getPlatformInfo: function() {},
    },
    storage: {
      local: {get: function() {}},
      managed: {get: function() {}},
      sync: {get: function() {}},
      onChanged: {addListener: function() {}},
    },
  };
}


function testReadOnly() {
  var elem = document.createElement('detangle-options');

  assertTrue(elem.readOnly);

  elem.thisProfile = detangle.Profiles.CORPORATE;
  assertFalse(elem.readOnly);

  elem.thisProfile = detangle.Profiles.REGULAR;
  assertTrue(elem.readOnly);

  elem.thisProfile = detangle.Profiles.ISOLATED;
  assertTrue(elem.readOnly);
}
