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

/**
 * @fileoverview A table row for detangle-sitelist
 */


Polymer({
  is: 'detangle-site',

  properties: {
    matchType: {type: String},
    pattern: {type: String},
    hover: {
      type: Boolean,
      value: false,
      observer: 'setHoverClass',
      reflectToAttribute: true,
    },
    readOnly: {
      type: Boolean,
      value: false,
    },
    hideDelete: {
      type: Boolean,
      computed: 'computeHideDelete(hover, readOnly)',
    },
  },

  listeners: {
    'mouseover': 'onMouseOver',
    'mouseleave': 'onMouseLeave',
    'delete.tap': 'fireDelete',
  },

  /**
   * Computes whether to show the delete icon.
   *
   * @param {boolean} hover Whether the mouse is hovering over the row.
   * @param {boolean} readOnly Whether the sitelist is read-only
   * @return {boolean}
   */
  computeHideDelete(hover, readOnly) {
    return readOnly || !hover;
  },

  /**
   * Sets the hover class on the row to the value of the hover attribute.
   *
   * @param {boolean} hover Value of the hover attribute
   */
  setHoverClass(hover) {
    this.toggleClass('hover', hover, this.$.row);
  },

  /**
   * Handles the mouseover event.
   *
   * @param {!InputEvent} e
   */
  onMouseOver(e) {
    this.hover = true;
  },

  /**
   * Handles the mouseleave event.
   *
   * @param {!InputEvent} e
   */
  onMouseLeave(e) {
    this.hover = false;
  },

  /**
   * Fires the delete event.
   *
   * @param {!Event} e
   */
  fireDelete(e) {
    this.fire('delete', {matchType: this.matchType, pattern: this.pattern});
  },
});
