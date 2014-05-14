var $ = require('jquery');
var AttachmentListView = require('streamhub-input/content-editor/attachment-list-view');
var Auth = require('auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var Editor = require('streamhub-editor/editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/modal/launchable-modal');
var modalTemplate = require('hgn!streamhub-input/templates/content-editor-modal');
var Pipeable = require('streamhub-input/pipeable');
var UploadButtonIcon = require('streamhub-input/upload/button-icon');
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
 * @extends {LaunchableModal}
 */
function ContentEditor(opts) {
    opts = opts || {};
    Editor.call(this, opts);
    LaunchableModal.call(this);
    Pipeable.call(this, opts);

    this._postCmd = new Command(this._handlePostBtnClick.bind(this));
    this._authCmd = new AuthRequiredCommand(this._postCmd);

    this._user = Auth.get('livefyre');
    Auth.on('login.livefyre', handleLogin.bind(this));
    Auth.on('logout', handleLogout.bind(this));
}
inherits(ContentEditor, Editor);
inherits.parasitically(ContentEditor, LaunchableModal);
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
ContentEditor.prototype._addUploadButton = function   () {
    this._uploadButton = new UploadButtonIcon();
    this._uploadButton.render();
    this._attachmentsList = new AttachmentListView();
    this._attachmentsList.render();
    this._uploadButton.pipe(this._attachmentsList);
    var $buttonWrapper = this.$('.' + this.classes.BTN_WRAPPER);
    var $containerWrapper = this.$('.' + this.classes.UPLOAD_CONTAINER);
    $buttonWrapper.prepend(this._uploadButton.$el);
    $containerWrapper.append(this._attachmentsList.$el);
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
    this._postCmd.enable();
};

/**
 * Post success callback.
 * @private
 */
ContentEditor.prototype._handlePostSuccess = function () {
    this.reset();
    this.returnModal();
    this._postCmd.enable();
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
    classes.BTN_WRAPPER = 'lf-btn-wrapper';
    classes.POST_BTN = 'lf-content-editor-post';
    classes.UPLOAD_CONTAINER = 'lf-upload-container';
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
    Auth.removeListener('login.livefyre', handleLogin.bind(this));
    Auth.removeListener('logout', handleLogout.bind(this));
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
        strings: {
            post: this._i18n.POST,
            username: username
        }
    };
};

/**
 * Template for el when .launchModal()
 * @param [context] {Object}
 * @returns {!string}
 */
ContentEditor.prototype.modalTemplate = function (context) {
    return modalTemplate(context, {
        contentEditor: contentEditorTemplate.template,
        editor: editorTemplate.template
    });
};

/** @override */
ContentEditor.prototype.render = function () {
    this.$el.html(this.template(this.getTemplateContext(), {
        editor: editorTemplate.template,
    }));

    // this is called in the base render, unfortunate duplication
    this.$resizeEl = this.$('.' + this.classes.RESIZE);
    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this._processPlaceholders();

    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this.$postEl = this.$('.' + this.classes.POST_BTN);

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
ContentEditor.prototype.returnModal = function () {
    LaunchableModal.prototype.returnModal.apply(this, arguments);
};

/** @override */
ContentEditor.prototype.sendPostEvent = function (ev) {
    var newContent = new Content();
    newContent.body = ev.body;
    newContent.attachments = ev.attachments;
    this._postCmd.disable();
    this.writeToDestination(newContent, function(err) {
        if (err) {
            ev.failure(err);
        }
        ev.success(newContent);
    });
};

/**@override */
ContentEditor.prototype.template = contentEditorTemplate;

module.exports = ContentEditor;
