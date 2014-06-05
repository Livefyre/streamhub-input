var $ = require('jquery');
var AttachmentListView = require('streamhub-input/javascript/content-editor/attachment-list-view');
var Auth = require('auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var Editor = require('streamhub-editor/editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var Observer = require('observer');
var packageAttribute = require('streamhub-input/javascript/package-attribute');
var Pipeable = require('streamhub-input/javascript/pipeable');
var UploadButtonIcon = require('streamhub-input/javascript/upload/button-icon');
var View = require('streamhub-sdk/view');

'use strict';

/**
 * A view that takes text input from a user and posts it to a collection/Writable.
 * Implements Input.
 * @param [opts] {Object}
 * @param [opts.i18n] {Object.<string>} Display strng overrides
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @constructor
 * @extends {Editor}
 * @extends {Pipeable}
 */
function ContentEditor(opts) {
    opts = opts || {};
    Editor.call(this, opts);
    Pipeable.call(this, opts);
    Observer(this);

    this._postCmd = new Command(this._handlePostBtnClick.bind(this));
    this._authCmd = new AuthRequiredCommand(this._postCmd);

    this._user = Auth.get('livefyre');

    this.listenTo(Auth, 'login.livefyre', handleLogin.bind(this));
    this.listenTo(Auth, 'logout', handleLogout.bind(this));
}
inherits(ContentEditor, Editor);
inherits.parasitically(ContentEditor, Pipeable);

/**
 * Set the user and rerender
 * @param {?User} livefyreUser
 */
function handleLogin(livefyreUser) {
    this._user = livefyreUser;
    this.render();
}

/** Unset the user and rerender */
function handleLogout() {
    this._user = null;
    this.render();
}

/**
 * Render the upload button (camera icon) that launches filepicker, and
 * render the contianer where photo upload thumbnails will live.
 * @private
 */
ContentEditor.prototype._addUploadButton = function () {
    this._uploadButton = this._uploadButton || this.createUploadButton();
    this._attachmentsList = this._attachmentsList || new AttachmentListView();

    this._uploadButton.setElement(this.getElementsByClass(this.classes.EDITOR_UPLOAD));
    this._attachmentsList.setElement(this.getElementsByClass(this.classes.ATTACHMENT_LIST));
    this._uploadButton.render();
    this._attachmentsList.render();
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
    return strings;
})();

/**
 * Post failure callback.
 * @private
 */
ContentEditor.prototype._handlePostFailure = function () {
    this.showError(this._i18n.ERRORS.GENERIC);
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

/** @override */
ContentEditor.prototype._validate = function(data) {
    var valid = !!(data.body || (data.attachments && data.attachments.length));
    if (!valid) {
        this.showError(this._i18n.ERRORS.BODY);
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
    this._uploadButton && this._uploadButton.destroy();
    this._uploadButton = null;
    this._attachmentsList && this._attachmentsList.destroy();
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
        mediaEnabled: this.opts.mediaEnabled,
        strings: {
            post: this._i18n.POST,
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
        this._addUploadButton();
    }
};

/** @override */
ContentEditor.prototype.reset = function () {
    Editor.prototype.reset.call(this);
    this._attachmentsList && this._attachmentsList.clearAttachments();
};

/** @override */
ContentEditor.prototype.sendPostEvent = function (ev) {
    var newContent = new Content();
    newContent.body = ev.body;
    newContent.attachments = ev.attachments;
    this._postButton.disable();
    this.writeToDestination(newContent, function(err) {
        if (err) {
            return ev.failure(err);
        }
        ev.success();
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
