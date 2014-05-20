var ContentEditor = require('streamhub-input/javascript/content-editor/view');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var modalTemplate = require('hgn!streamhub-input/templates/content-editor-modal');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var $ = require('jquery');

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
ModalContentEditor.prototype.classes = {
    EDITOR_SECTION: 'lf-content-editor'
};
$.extend(ModalContentEditor.prototype.classes, ContentEditor.prototype.classes);

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

/** @override */
ModalContentEditor.prototype.render = function () {
    ContentEditor.prototype.render.call(this);
    var classes = ModalContentEditor.prototype.classes.EDITOR_SECTION;
    this.$errorContainer = this.getElementsByClass(classes);
};

module.exports = ModalContentEditor;
