'use strict';

var ContentEditor = require('streamhub-input/javascript/content-editor/view');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var modalTemplate = require('hgn!streamhub-input/templates/content-editor-modal');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var $ = require('jquery');

/**
 * @constructor
 * @extends {ContentEditor}
 * @extends {LaunchableModal}
 */
function ModalContentEditor(opts) {
  opts = opts || {};
  this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));
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

  this.opts.disableSuccessModal ?
    this.returnModal() :
    this.showSuccess(this.opts, $.proxy(this.returnModal, this));
};

/** @override */
ModalContentEditor.prototype.launchModal = function (modal) {
  LaunchableModal.prototype.launchModal.call(this, modal);

  // Listen for the hidden event on the modal and save the contents of the
  // editor for later. This fixes a bug in IE where the contents of the body
  // are gone when trying to add it back.
  this._modal.$el.on('hidden', $.proxy(function () {
    this._savedBody = this.$textareaEl && this.$textareaEl.val();
    this._savedTitle = this.$titleEl && this.$titleEl.val();
  }, this));
};

/** @override */
ModalContentEditor.prototype.render = function () {
  ContentEditor.prototype.render.call(this);
  this.$errorContainer = this.getElementsByClass(this.classes.EDITOR_SECTION);

  // Use the saved body and title values. This is the other half of the bug
  // fix for IE where we take the saved values of the body and title elements
  // and put it back into the element values.
  this._savedBody && this.$textareaEl.val(this._savedBody);
  this._savedTitle && this.$titleEl.val(this._savedTitle);
};

module.exports = ModalContentEditor;
