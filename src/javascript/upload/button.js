var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');
var Upload = require('streamhub-input/javascript/upload/view');
var $ = require('jquery');

'use strict';

/**
 * @param [opts] {Object}
 * @constructor
 * @extends {InputButton}
 */
function UploadButton(opts) {
    opts = opts || {};
    this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));
    var input = new Upload();
    var command = new ModalInputCommand(input, {
        modal: opts.modal
    });

    InputButton.call(this, command, {
        el: opts.el,
        input: opts.input || input,
        destination: opts.destination,
        authRequired: opts.authRequired
    });
}
inherits(UploadButton, InputButton);

/** @enum {string} */
UploadButton.prototype._i18n = {
    POST_PHOTO: 'Post Your Photo'
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

module.exports = UploadButton;
