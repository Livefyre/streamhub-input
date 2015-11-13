'use strict';

var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalContentEditor = require('streamhub-input/javascript/content-editor/modal-view');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');
var $ = require('jquery');

/**
 *
 * @param [opts] {Object}
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @param [opts.modal] {ModalView} Optional modal to use for launching
 * @param [opts.input] {Input} Input view to show in the modal
 * @param [opts.maxAttachmentsPerPost] {number} Number of media uploads a user can add.
 * @constructor
 * @extends {InputButton}
 */
function ContentEditorButton(opts) {
    opts = opts || {};
    this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));

    opts.input = opts.input || this.createInput(opts);

    var command = new ModalInputCommand(opts.input, {
        modal: opts.modal
    });

    InputButton.call(this, command, opts);
}
inherits(ContentEditorButton, InputButton);

/** @enum {string} */
ContentEditorButton.prototype._i18n = {
    POST: "What's on your mind?"
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

/**
 * Create the editor that will appear in the modal
 * when the button is clicked
 */
ContentEditorButton.prototype.createInput = function (opts) {
    var input = new ModalContentEditor({
        mediaEnabled: opts.mediaEnabled,
        mimetypes: opts.mimetypes,
        maxAttachmentsPerPost: opts.maxAttachmentsPerPost,
        showTitle: opts.showTitle,
        _i18n: opts._i18n
    });
    return input;
};

module.exports = ContentEditorButton;
