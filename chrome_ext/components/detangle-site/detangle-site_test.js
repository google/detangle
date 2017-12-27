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
 * @fileoverview tests for the detangle-site element
 */

'use strict';

goog.require('goog.testing.jsunit');


function testComputeHideDelete() {
  var elem = document.createElement('detangle-site');

  assertTrue(elem.computeHideDelete(true, true));
  assertTrue(elem.computeHideDelete(false, true));
  assertTrue(elem.computeHideDelete(false, false));
  assertFalse(elem.computeHideDelete(true, false));
}


function testHover() {
  var elem = document.createElement('detangle-site');
  elem.onMouseOver();
  assertTrue(elem.hover);
  assertFalse(elem.hideDelete);
  assertContains('hover', elem.$.row.classList);

  elem.onMouseLeave();
  assertFalse(elem.hover);
  assertTrue(elem.hideDelete);
  assertNotContains('hover', elem.$.row.classList);
}
