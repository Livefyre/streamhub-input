var $ = require('jquery');
var AttachmentListView = require('streamhub-input/comment/attachment-list-view');
var Auth = require('streamhub-sdk/auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Editor = require('streamhub-editor/editor');
var inherits = require('inherits');
var Input = require('streamhub-input');
var LaunchableModal = require('streamhub-input/modal/abstract/launchable-modal');
var log = require('streamhub-sdk/debug')('streamhub-input/comment');
var ModalView = require('streamhub-sdk/modal');
var PostComment = require('streamhub-input/command');
var UploadButtonIcon = require('streamhub-input/upload/buttonicon');
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
var Comment = function(opts) {
    opts = opts || {};
    Editor.call(this, opts);
    Input.call(this, opts);
    LaunchableModal.call(this);
    var self = this;

    Auth.once('delegate', function (authDelegate) {
        self._setUser(authDelegate);
    });
    Auth.getDelegate();
};
inherits(Comment, Editor);
inherits.parasitically(Comment, Input);
inherits.parasitically(Comment, LaunchableModal);

/**
 * Uses an auth delegate to set user and attaches listeners
 * @param authDelegate {!AuthDelegate}
 * @private
 */
Comment.prototype._setUser = function (authDelegate) {
    this._user = authDelegate.getUser();

    var self = this;
    this._user.once('login', function () {
        if (!self.$el) {
            return;
        }
        Auth.setToken(self._user.getToken());
        var $name = self.$el.find('.name');
        $name && $name.text(self._user.get('displayName'));
    });
};

/* @override */
Comment.prototype.buildPostEventObj = function () {
    var event = Editor.prototype.buildPostEventObj.call(this);
    event.attachments = this._attachmentsList.getAttachments();
    return event;
};

/** @enum {string} */
Comment.prototype.classes = (function () {
    var classes = $.extend({}, Editor.prototype.classes);
    classes.BTN_WRAPPER = 'btn-wrapper';
    classes.POST_BTN = 'editor-post-btn';
    return classes;
})();

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
Comment.prototype.elClass += ' lf-edit';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
Comment.prototype.elTag = 'article';

/** @override */
Comment.prototype.getInput = function () {
    // Don't call us, we'll call you
    return null;
};

/**
 * Get contextual data for a template.
 * @type {function()}
 * @override
 */
Comment.prototype.getTemplateContext = function () {
    var username = this._user && this._user.get('displayName') || '';
    return {
        strings: {
            post: 'Post Comment',
            username: username
        }
    };
};

/**
 * Post failure callback.
 * @param {Object} data The response data.
 */
Comment.prototype.handlePostFailure = function (data) {
    log('Post Failure');

    //TODO (joao) Get msg to display from data param.
    //this.showError(msg);
};

/**
 * Post success callback.
 * @param {Object} data The response data.
 */
Comment.prototype.handlePostSuccess = function (data) {
    log('Post Success');

    this.reset();
    this.returnModal(null, data);
};

/**
 * This probably doesn't
 * Template for el when .launchModal()
 * @param [context] {Object}
 * @returns {!string}
 */
Comment.prototype.modalTemplate = function (context) {
    return [
        '<article class="hub-modal-input-wrapper">',
        '<header class="hub-modal-input-header">',
        'Post Your Comment',
        '</header>',
        '<div class="lf-modal-body">',
        Comment.prototype.template.apply(this, arguments),
        '</div>',
        '</article>'
    ].join('');
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 */
Comment.prototype.render = function () {
    this.$el.html(this.template(this.getTemplateContext(), {
        editor: require('hgn!streamhub-editor/templates/editor').template,
    }));

    // iz annoy
    this.$resizeEl = this.$('.' + this.classes.RESIZE);
    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this._processPlaceholders();

    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this.$postEl = this.$('.' + this.classes.POST_BTN);


    var authCmd = new AuthRequiredCommand();
    this._postButton = new Button(authCmd, {el: this.$postEl});

    // TODO: setting
    if (true) {
        // TODO: handler
        this._uploadButton = new UploadButtonIcon();
        this._uploadButton.render();
        this._attachmentsList = new AttachmentListView();
        this._attachmentsList.render();
        this._uploadButton.pipe(this._attachmentsList);
        var $buttonWrapper = this.$('.' + this.classes.BTN_WRAPPER);
        var $containerWrapper = this.$('.upload-container');
        $buttonWrapper.prepend(this._uploadButton.$el);
        $containerWrapper.append(this._attachmentsList.$el);
    }
};

/** @override */
Comment.prototype.returnModal = function (err, data) {
    LaunchableModal.prototype.returnModal.apply(this, arguments);
};

/** @override */
Comment.prototype.sendPostEvent = function (ev) {
    // Calling you
    ev.errback = function (err, data) {
        if (err) {
            return ev.failure();
        }
        ev.success();
    }
    this.push(ev);
    this.push(null);
};

/**
 * Show an error message to the user.
 * @param {string} msg The error message to display.
 */
Comment.prototype.showError = function (msg) {
    log(msg);
    //TODO (joao) Real implementation. Waiting on UX.
};

/**
 * TODO: actual template
 * Template for el
 * @override
 * @param [context] {Object}
 */
Comment.prototype.template = require('hgn!streamhub-input/templates/comment');


/** @override */
Comment.prototype.validate = function(data) {
    // TODO: yeah...
    return true;
};

module.exports = Comment;
