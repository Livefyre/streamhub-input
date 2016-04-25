'use strict';

var ModalView = require('streamhub-sdk/modal');
var packageAttribute = require('streamhub-input/javascript/package-attribute');
var PostSuccessView = require('streamhub-input/javascript/post-success-view');

/**
 * A view that can be displayed and interacted with in an otherwise generic modal.
 * @constructor
 */
function LaunchableModal() {
  this._showing = false;
}

/**
 * Displays and operates this view as a modal.
 * Modal representation of this view.
 * @param {!ModalView} modal
 */
LaunchableModal.prototype.launchModal = function (modal) {
  if (!this._modal) {
    this._modal = modal || new ModalView();
    packageAttribute.decorateModal(this._modal);
  }
  this._modal.show(this, true);  // Will .render() and stack
  this._showing = true;
};

/**
 * Called when the modal view has competed its task and can be closed/hidden.
 */
LaunchableModal.prototype.returnModal = function () {
  if (this._showing) {
    this._modal.$el.trigger('hideModal.hub', this);  // Will _modal.hide()
  }
  this._showing = false;
};

/**
 * Show the success view.
 * @param {Object} opts - Configuration options.
 * @param {function()=} closeCallback - Close callback to call when `done`
 *   button is clicked.
 */
LaunchableModal.prototype.showSuccess = function (opts, closeCallback) {
  if (!this._success) {
    this._success = new PostSuccessView(opts, closeCallback);
    this._success.render();
  }
  this._success.delegateEvents();
  this.$el.replaceWith(this._success.el);
};

module.exports = LaunchableModal;
