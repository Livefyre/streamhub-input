var ContentEditor = require('streamhub-input/content-editor/view');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var modalTemplate = require('hgn!streamhub-input/templates/content-editor-modal');
var LaunchableModal = require('streamhub-input/modal/launchable-modal');

'use strict';

/**
 * @constructor
 * @extends {ContentEditor}
 * @extends {LaunchableModal}
 */
function ModalContentEditor(opts) {
    opts = opts || {};
    ContentEditor.call(this, opts);
    LaunchableModal.call(this);
}
inherits(ModalContentEditor, ContentEditor);
inherits.parasitically(ContentEditor, LaunchableModal);

/** @override */
ModalContentEditor.prototype.template = function (context) {
    return modalTemplate(context, {
        contentEditor: contentEditorTemplate.template,
        editor: editorTemplate.template
    });
};

/** @override */
ModalContentEditor.prototype._handlePostSuccess = function () {
    ContentEditor.prototype._handlePostSuccess.call(this);
    this.returnModal();
};

module.exports = ModalContentEditor;
