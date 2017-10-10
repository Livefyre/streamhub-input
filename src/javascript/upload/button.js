'use strict';

var $ = require('jquery');
var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');
var Upload = require('streamhub-input/javascript/upload/view');

/**
 * @param [opts] {Object}
 * @constructor
 * @extends {InputButton}
 */
function UploadButton(opts) {
  opts = opts || {};
  this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));

  var inputOpts = opts.mimetypes ? {pick: {mimetypes: opts.mimetypes}} : {};
  inputOpts._i18n = this._i18n;
  inputOpts.disableSuccessModal = opts.disableSuccessModal;

  if (opts.maxSize) {
    inputOpts = $.extend(true, {}, inputOpts, {pick: {maxSize: opts.maxSize}});
  }

  var input = new Upload(inputOpts);
  var command = new ModalInputCommand(input, {
    modal: opts.modal
  });

  InputButton.call(this, command, {
    authRequired: opts.authRequired,
    destination: opts.destination,
    el: opts.el,
    input: opts.input || input,
    stylePrefix: opts.stylePrefix,
    styles: opts.styles
  });
}
inherits(UploadButton, InputButton);

/** @enum {string} */
UploadButton.prototype._i18n = {
  POST_PHOTO: 'What\'s on your mind?'
};

/** @override */
UploadButton.prototype.getTemplateContext = function () {
  return {
    strings: {
      post: this._i18n.POST_PHOTO
    }
  };
};

/** @override */
UploadButton.prototype.template = require('hgn!streamhub-input/templates/upload-button');

/**
 * @override
 * @type {string}
 */
UploadButton.prototype.elClass += ' hub-upload-btn';

/** @override */
UploadButton.prototype.destroy = function () {
  InputButton.prototype.destroy.call(this);

  if (this.opts.modal) {
    this.opts.modal.destroy();
  }

  if (this.opts.input) {
    this.opts.input.destroy();
  }
};

module.exports = UploadButton;
