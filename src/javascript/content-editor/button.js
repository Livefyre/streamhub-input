var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalContentEditor = require('streamhub-input/javascript/content-editor/modal-view');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');
var $ = require('jquery');

'use strict';

/**
 *
 * @param [opts] {Object}
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @param [opts.modal] {ModalView} Optional modal to use for launching
 * @constructor
 * @extends {InputButton}
 */
function ContentEditorButton(opts) {
    opts = opts || {};
    this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));
    var input = new ModalContentEditor({
        mediaEnabled: opts.mediaEnabled
    });
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
inherits(ContentEditorButton, InputButton);

/** @enum {string} */
ContentEditorButton.prototype._i18n = {
    POST: 'Post Your Comment'
};

/** @override */
ContentEditorButton.prototype.template = function () {
    return this._i18n.POST;
};

/**
 * @override
 * @type {string}
 */
ContentEditorButton.prototype.elClass += ' comment-btn';

module.exports = ContentEditorButton;
