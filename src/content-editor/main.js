var $ = require('jquery');
var AttachmentListView = require('streamhub-input/content-editor/attachment-list-view');
var Auth = require('auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var Editor = require('streamhub-editor/editor');
var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/modal/launchable-modal');
var log = require('streamhub-sdk/debug')('streamhub-input/content-editor');
var ModalView = require('streamhub-sdk/modal');
var Readable = require('stream/readable');
var UploadButtonIcon = require('streamhub-input/upload/button-icon');
var Util = require('streamhub-sdk/util');
var View = require('streamhub-sdk/view');

'use strict';

/**
 * A view that takes text input from a user and posts it to a collection/Writable.
 * Implements Input.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @param [opts.i8n.emptyText] {string} Suggestive text to display in an empty editor.
 * @constructor
 * @extends {Editor}
 */
function ContentEditor(opts) {
    opts = opts || {};
    opts.mediaEnabled = true;
    Editor.call(this, opts);
    LaunchableModal.call(this);
    Readable.call(this);

    opts.destination && this.pipe(opts.destination);

    this._postCmd = new Command(function () {});
    this._authCmd = new AuthRequiredCommand(this._postCmd);

    this._user = Auth.get('livefyre');
    Auth.on('login.livefyre', handleLogin.bind(this));
    Auth.on('logout.livefyre', handleLogout.bind(this));
};
inherits(ContentEditor, Editor);
inherits.parasitically(ContentEditor, LaunchableModal);
inherits.parasitically(ContentEditor, Readable);

function handleLogin(self, livefyreUser) {
    self._user = livefyreUser;
    self.render();
}

function handleLogout(self) {
    self._user = null;
    self.render();
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
ContentEditor.prototype._handlePostSuccess = function (newContent) {
    this.reset();
    this.returnModal(null);
    this._postCmd.enable();
};

/** @override */
ContentEditor.prototype._read = function () {
    return null;
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
    classes.POST_BTN = 'lf-editor-post-btn';
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
    Auth.removeListener('logout.livefyre', handleLogout.bind(this));
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
 * This probably doesn't
 * Template for el when .launchModal()
 * @param [context] {Object}
 * @returns {!string}
 */
ContentEditor.prototype.modalTemplate = function (context) {
    return [
        '<article class="hub-modal-input-wrapper">',
        '<header class="hub-modal-input-header">',
        'Post Your Comment',
        '</header>',
        '<div class="lf-modal-body">',
        ContentEditor.prototype.template.apply(this, arguments),
        '</div>',
        '</article>'
    ].join('');
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 */
ContentEditor.prototype.render = function () {
    this.$el.html(this.template(this.getTemplateContext(), {
        editor: require('hgn!streamhub-input/templates/editor').template,
    }));

    // this is called in the base render, unfortunate duplication
    this.$resizeEl = this.$('.' + this.classes.RESIZE);
    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this._processPlaceholders();

    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this.$postEl = this.$('.' + this.classes.POST_BTN);

    this._postButton = new Button(this._authCmd, {el: this.$postEl});

    if (this.opts.mediaEnabled) {
        this._addUploadButton()
    }
};

/** @override */
ContentEditor.prototype.reset = function () {
    Editor.prototype.reset.call(this);
    this._attachmentsList && this._attachmentsList.clearAttachments();
};

/** @override */
ContentEditor.prototype.returnModal = function (err, data) {
    LaunchableModal.prototype.returnModal.apply(this, arguments);
};

/** @override */
ContentEditor.prototype.sendPostEvent = function (ev) {
    // Calling you
    var calledBack = false;
    var newContent = new Content();
    newContent.body = ev.body;
    newContent.attachments = ev.attachments;
    this._postCmd.disable();
    this.push(newContent);
    ev.success();

    // TODO: error handling
    // for (var i = 0; i < this._destinations.length; i++) {
    //     this._destinations[i].write(newContent, function (err) {
    //         if (calledBack) {
    //             return;
    //         }
    //         calledBack = true;

    //         if (err) {
    //             ev.failure(err);
    //         }
    //         ev.success(newContent);
    //     });
    // };
};

// /**
//  * Set the destination writable to handle content that is created here.
//  * @param {Writable} writable
//  */
// ContentEditor.prototype.pipe = function (writable) {
//     this._destinations.push(writable);
// };

// *
//  * Set the destination writable to handle content that is created here.
//  * @param {Writable} writable

// ContentEditor.prototype.unpipe = function (writable) {
//     this._destinations.splice(this._destinations.indexOf(writable), 0);
// };

/**@override */
ContentEditor.prototype.template = require('hgn!streamhub-input/templates/content-editor');

module.exports = ContentEditor;
