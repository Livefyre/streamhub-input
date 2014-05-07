var $ = require('jquery');
var AttachmentListView = require('streamhub-input/comment/attachment-list-view');
var Auth = require('auth');  // -> auth
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Editor = require('streamhub-editor/editor');
var inherits = require('inherits');
var Input = require('streamhub-input');
var LaunchableModal = require('streamhub-input/modal/abstract/launchable-modal');
var Content = require('streamhub-sdk/content');
var log = require('streamhub-sdk/debug')('streamhub-input/comment');
var ModalView = require('streamhub-sdk/modal');
var PostComment = require('streamhub-input/command');
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
var ContentEditor = function(opts) {
    opts = opts || {};
    Editor.call(this, opts);
    Input.call(this, opts);  // mrr
    LaunchableModal.call(this);

    var livefyreUser = Auth.get('livefyre');
    var self = this;
    this._user = livefyreUser;

    // TODO: destruction
    Auth.on('login.livefyre', function (livefyreUser) {
        self._user = livefyreUser;
        this.render();
    });
    Auth.on('logout.livefyre', function (livefyreUser) {
        self._user = null;
        this.render();
    });
};
inherits(ContentEditor, Editor);
inherits.parasitically(ContentEditor, Input);
inherits.parasitically(ContentEditor, LaunchableModal);

/**
 * Render the upload button (camera icon) that launches filepicker, and
 * render the contianer where photo upload thumbnails will live.
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
 */
ContentEditor.prototype._handlePostFailure = function () {
    log('Post Failure');

    //TODO (joao) Get msg to display from data param.
    //this.showError(msg);
    this._authCmd.enable();
};

/**
 * Post success callback.
 */
ContentEditor.prototype._handlePostSuccess = function () {
    log('Post Success');

    this.reset();
    this.returnModal(null, data);
    this._authCmd.enable();
};

/** @override */
ContentEditor.prototype._validate = function(data) {
    return data.body || data.attachments.length;
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
    classes.BTN_WRAPPER = 'btn-wrapper';
    classes.POST_BTN = 'lf-editor-post-btn';
    classes.UPLOAD_CONTAINER = 'upload-container';
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
ContentEditor.prototype.getInput = function () {
    // Don't call us, we'll call you
    return null;
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
        'Post Your ContentEditor',
        '</header>',
        '<div class="lf-modal-body">',
        ContentEditor.prototype.template.apply(this, arguments),
        '</div>',
        '</article>'
    ].join('');
};

/** @sugar */
ContentEditor.prototype.pipe = function (writable) {
    this.setDestination(writable);
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 */
ContentEditor.prototype.render = function () {
    this.$el.html(this.template(this.getTemplateContext(), {
        editor: require('templates/editor').template,
    }));

    // iz annoy
    this.$resizeEl = this.$('.' + this.classes.RESIZE);
    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this._processPlaceholders();

    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this.$postEl = this.$('.' + this.classes.POST_BTN);

    this._authCmd = new AuthRequiredCommand();
    this._postButton = new Button(this._authCmd, {el: this.$postEl});

    if (this.opts.mediaEnabled) {
        this._addUploadButton()
    }
};

/** @override */
ContentEditor.prototype.reset = function () {
    Editor.prototype.reset.call(this);
    // TODO: impl in component
    if (this._attachmentsList) {
        for (var i = 0; i < this._attachmentsList.views.length; i++) {
            this._attachmentsList.remove(this._attachmentsList.views[i]);
        }
    }
};

/** @override */
ContentEditor.prototype.returnModal = function (err, data) {
    LaunchableModal.prototype.returnModal.apply(this, arguments);
};

/** @override */
ContentEditor.prototype.sendPostEvent = function (ev) {
    // Calling you
    var newContent = new Content();
    newContent.body = ev.body;
    newContent.attachments = ev.attachments;
    this._authCmd.disable();
    this._destination.write(newContent, function (err) {
        if (err) {
            ev.failure(err);
        }
        ev.success();
    });
};

/**
 * Set the destination writable to handle content that is created here.
 * TODO: this looks like a feature of Input
 * @param {Writable} writable
 */
ContentEditor.prototype.setDestination = function (writable) {
    this._destination = writable;
};

/**@override */
ContentEditor.prototype.template = require('hgn!streamhub-input/templates/content-editor');

module.exports = ContentEditor;
