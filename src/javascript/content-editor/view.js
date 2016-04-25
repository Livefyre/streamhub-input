'use strict';

var $ = require('jquery');
var AttachmentListView = require('streamhub-input/javascript/content-editor/attachment-list-view');
var Auth = require('auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var Editor = require('streamhub-editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var merge = require('mout/object/merge');
var observer = require('observer');
var packageAttribute = require('streamhub-input/javascript/package-attribute');
var Pipeable = require('streamhub-input/javascript/pipeable');
var UploadButtonIcon = require('streamhub-input/javascript/upload/button-icon');
var View = require('streamhub-sdk/view');

/**
 * A view that takes text input from a user and posts it to a collection/Writable.
 * Implements Input.
 * @param [opts] {Object}
 * @param [opts.i18n] {Object.<string>} Display strng overrides
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @param [opts.maxAttachmentsPerPost] {number} Number of media uploads a user can add.
 * @constructor
 * @extends {Editor}
 * @extends {Pipeable}
 */
function ContentEditor(opts) {
  opts = opts || {};
  Editor.call(this, opts);
  Pipeable.call(this, opts);
  observer(this);

  this._postCmd = new Command(this._handlePostBtnClick.bind(this));
  this._authCmd = new AuthRequiredCommand(this._postCmd);

  this._user = Auth.get('livefyre');

  this.listenTo(Auth, 'login.livefyre', $.proxy(function handleLogin(livefyreUser) {
    this._user = livefyreUser;
    this.render();
  }, this));

  this.listenTo(Auth, 'logout', $.proxy(function handleLogout() {
    this._user = null;
    this.render();
  }, this));
}
inherits(ContentEditor, Editor);
inherits.parasitically(ContentEditor, Pipeable);

/** @private */
ContentEditor.prototype._addAttachmentList = function () {
  var evts = AttachmentListView.EVENTS;

  this._attachmentsList = this._attachmentsList || new AttachmentListView();
  this._attachmentsList.setElement(this.getElementsByClass(this.classes.ATTACHMENT_LIST));
  this._attachmentsList.render();

  // If we don't need to keep track of the number of attachments on a post,
  // then we don't need to continue.
  if (!this.opts.maxAttachmentsPerPost || this._listeningToAttachments) {
    return;
  }
  this._listeningToAttachments = true;
  this._attachmentsList.on(evts.ADD, $.proxy(this._handleAddAttachment, this));
  this._attachmentsList.on(evts.REMOVE, $.proxy(this._handleRemoveAttachment, this));
};

/**
 * Render the upload button (camera icon) that launches filepicker, and
 * render the contianer where photo upload thumbnails will live.
 * @private
 */
ContentEditor.prototype._addUploadButton = function () {
  var uploadEl = this.getElementsByClass(this.classes.EDITOR_UPLOAD);
  if (!uploadEl.length) {
    uploadEl = $('<div />').addClass(this.classes.EDITOR_UPLOAD);
    this.getElementsByClass(this.classes.BTN_WRAPPER).prepend(uploadEl);
  }
  this._uploadButton = this._uploadButton || this.createUploadButton(merge(this.opts, {
    disableSuccessModal: true
  }));
  this._uploadButton.setElement(uploadEl);
  this._uploadButton.render();
  this._uploadButton.pipe(this._attachmentsList);
};

/**
 * Return an instance of UploadButton that will be used if
 * the contentEditor is configured to allow media uploading
 */
ContentEditor.prototype.createUploadButton = function (opts) {
  return new UploadButtonIcon(opts);
};

/** @override */
ContentEditor.prototype._i18n = (function () {
  var strings = $.extend(true, {}, Editor.prototype._i18n);
  strings.PLACEHOLDERTEXT = 'What would you like to say?';
  strings.POST = 'Post Your Comment';
  strings.POST_MODAL_TITLE = strings.POST;
  strings.POST_MODAL_BUTTON = strings.POST;
  strings.ERRORS.ATTACHMENTS_REQUIRED = 'An attachment is required';
  strings.ERRORS.TITLE_REQUIRED = 'A title is required';
  return strings;
})();

/**
 * Post failure callback.
 * @private
 */
ContentEditor.prototype._handlePostFailure = function (err) {
  var isDuplicate = err.error_type === 'DuplicateCommentError';
  var errMsg = isDuplicate ? this._i18n.ERRORS.DUPLICATE : this._i18n.ERRORS.GENERIC;
  this.showError(errMsg);
  this._postButton.enable();
};

/**
 * Post success callback.
 * @private
 */
ContentEditor.prototype._handlePostSuccess = function () {
  this.reset();
  this._postButton.enable();
};

/**
 * Handle the attachment added event from the AttachmentListView. If the current
 * number of attachments are at the limit, hide the upload button so more
 * cannot be added.
 * @param [data] {Object}
 * @param [data.count] {number}
 * @private
 */
ContentEditor.prototype._handleAddAttachment = function (data) {
  if (data.count < this.opts.maxAttachmentsPerPost) {
    return;
  }
  this._hideUploadButton = true;
  this._uploadButton.unpipe(this._attachmentsList);
  this._uploadButton.destroy();
  this._uploadButton = null;
};

/**
 * Handle the attachment removed event from the AttachmentListView. Determine
 * whether to re-show the upload button based on the number of attachments that
 * exist in the list view and how many are allowed.
 * @param [data] {Object}
 * @param [data.count] {number}
 * @private
 */
ContentEditor.prototype._handleRemoveAttachment = function (data) {
  if (data.count >= this.opts.maxAttachmentsPerPost) {
    return;
  }
  this._hideUploadButton = false;
  this._uploadButton || this._addUploadButton();
};

/** @override */
ContentEditor.prototype.validate = function (data) {
  var valid = !!(this.validateBody(data.body) || (data.attachments && data.attachments.length));
  if (!valid) {
    this.showError(this._i18n.ERRORS.BODY);
  }

  if (this.opts.titleRequired && !data.title) {
    valid = false;
    this.showError(this._i18n.ERRORS.TITLE_REQUIRED);
  }

  if (this.opts.mediaRequired && !data.attachments.length) {
    valid = false;
    this.showError(this._i18n.ERRORS.ATTACHMENTS_REQUIRED);
  }

  return valid;
};

/* @override */
ContentEditor.prototype.buildPostEventObj = function () {
  var event = Editor.prototype.buildPostEventObj.call(this);
  if (this.opts.mediaEnabled) {
    event.attachments = this._attachmentsList.getAttachments();
  }
  return event;
};

/** @enum {string} */
ContentEditor.prototype.classes = (function () {
  var classes = $.extend({}, Editor.prototype.classes);
  classes.EDITOR_UPLOAD = 'lf-editor-upload';
  classes.POST_BTN = 'lf-content-editor-post';
  classes.ATTACHMENT_LIST = 'lf-attachment-list-view';
  classes.CONTENT_EDITOR = 'lf-content-editor';
  classes.BTN_WRAPPER = 'lf-btn-wrapper';
  return classes;
})();

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
ContentEditor.prototype.elClass += ' lf-edit';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
ContentEditor.prototype.elTag = 'article';

/** @override */
ContentEditor.prototype.destroy = function () {
  View.prototype.destroy.call(this);
  this.stopListening();

  if (this._uploadButton) {
    this._uploadButton.destroy();
  }
  this._uploadButton = null;

  if (this._attachmentsList) {
    this._attachmentsList.destroy();
  }

  if (this._postButton) {
    this._postButton.destroy();
  }

  this._attachmentsList = null;
};

/**
 * Get contextual data for a template.
 * @type {function()}
 * @override
 */
ContentEditor.prototype.getTemplateContext = function () {
  var username = this._user && this._user.get('displayName') || '';
  return {
    showTitle: this._showTitle,
    attachmentViewEnabled: this.opts.mediaEnabled,
    mediaEnabled: this.opts.mediaEnabled && !this._hideUploadButton,
    strings: {
      post: this._i18n.POST_MODAL_BUTTON,
      postModalTitle: this._i18n.POST_MODAL_TITLE,
      username: username
    }
  };
};

/** @override */
ContentEditor.prototype.render = function () {
  Editor.prototype.render.call(this);
  this.$postEl = this.$('.' + this.classes.POST_BTN);
  this.$errorContainer = this.getElementsByClass(this.classes.CONTENT_EDITOR);

  this._postButton = new Button(this._authCmd, {el: this.$postEl});

  if (this.opts.mediaEnabled) {
    this._addAttachmentList();
    this._hideUploadButton || this._addUploadButton();
  }
};

/** @override */
ContentEditor.prototype.reset = function () {
  Editor.prototype.reset.call(this);
  if (this._attachmentsList) {
    this._attachmentsList.clearAttachments();
  }
  this._hideUploadButton || this._addUploadButton();
};

/** @override */
ContentEditor.prototype.sendPostEvent = function (ev) {
  var self = this;
  var newContent = new Content();
  newContent.body = ev.body;
  newContent.attachments = ev.attachments;

  if (ev.title) {
    newContent.title = ev.title;
  }

  this._postButton.disable();
  this.writeToDestination(newContent, function (err) {
    if (err) {
      return ev.failure(err);
    }
    ev.success();
    self._modal.$el.trigger('insights:local', {
      type: 'Posted',
      content: {
        type: 'Content',
        id: newContent.id,
        attachment: newContent.attachments,
        content: newContent.body,
        contentGenerator: 'livefyre.com',
        isFeatured: false
      }
    });

    self._attachmentsList && self._attachmentsList.destroy();
    self._attachmentsList = null;
    self._addAttachmentList();

    self._hideUploadButton = false;
    self._addUploadButton();
  });

  this._postButton.$el.trigger('insights:local', {
    type: 'Post',
    content: {
      type: 'PostMessage',
      id: null,
      attachment: ev.attachments,
      content: ev.body,
      contentGenerator: 'livefyre.com',
      isFeatured: false
    }
  });
};

/** @override */
ContentEditor.prototype.setElement = function (el) {
  if (this.$el) {
    this.$el.unwrap();
  }
  Editor.prototype.setElement.call(this, el);
  packageAttribute.wrapWithStylePrefix(this.$el);
};

/** @override */
ContentEditor.prototype.template = function (context) {
  return contentEditorTemplate(context, {
    editor: editorTemplate.template
  });
};

module.exports = ContentEditor;
