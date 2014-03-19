var jQuery;
var $ = jQuery = require('jquery');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('streamhub-input/comment');
var Auth = require('streamhub-sdk/auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Content = require('streamhub-sdk/content');
var Editor = require('streamhub-editor/editor');
var Input = require('streamhub-input');
var LaunchableModal = require('streamhub-input/modal/abstract/launchable-modal');
var ModalView = require('streamhub-sdk/modal');
var PostComment = require('streamhub-input/command');
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
    Input.call(this, opts);//handles opts.destination
    LaunchableModal.call(this);
    
    this._i18n = opts.i18n || this._i18n;
    this._user = Auth.getDelegate().getUser();
    var self = this;
    this._user.on('login', function () {
        if (!self.$el) {
            return;
        }
        var $name = self.$el.find('.name');
        $name && $name.text(self._user.get('displayName'));
    });
};
inherits(Comment, Editor);
inherits.parasitically(Comment, Input);
inherits.parasitically(Comment, LaunchableModal);

/**
 * Returns the raw data that has been received from the user.
 * @returns {?Object}
 * @override
 */
Comment.prototype._getRawInput = function () {
    return (this.$textareaEl) ? this.buildPostEventObj() : null;
};

/**
 * Checks that the input from the user is valid.
 * Should call showError(msg) with
 * @param [data] {Object} Typically comes from .getInput()
 * @returns {!boolean}
 * @protected
 */
Comment.prototype._validate = function (data) {
    return this.validate(data);
};

/**
 * Resets the input display, typically by clearing out the current user input
 * from the screen.
 */
Comment.prototype.reset = function () {
    this.$textareaEl && this.$textareaEl.val(this._i18n.emptyText);
};

/**
 * Creates and returns a Content object based on the input.
 * @param input {Object} Usually the data retrieved from getInput().
 * @returns {Content}
 * @protected
 */
Comment.prototype._packageInput = function (input) {
    return new Content(input.body);
};

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
Comment.prototype.class += ' lf-edit';

/**
 * Displayable strings
 * @type {Object}
 */
Comment.prototype._i18n = {
    emptyText: 'Comment here'
};

/** @enum {string} */
Comment.prototype.classes = {
    WRAPPER: 'hub-modal-input-wrapper',
    HEADER: 'hub-modal-input-header',
    BODY: 'lf-modal-body',
    HUB_COMMENT: 'hub-comment',
    USER_INFO: 'user-info',
    NAME: 'name',
    EDITOR: 'editor-container',
    FIELD: 'editor-field',
    BTN_WRAPPER: 'btn-wrapper',
    LF_BTN: 'lf-btn',
    POST_BTN: 'editor-post-btn',
    PLACEHOLDER: 'placeholder'
};

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
Comment.prototype.elTag = 'article';

/**
 * Get contextual data for a template.
 * @type {function()}
 * @override
 */
Comment.prototype.getTemplateContext = function () {
    var username = this._user.get('displayName') || '';
    var emptyTextString = this._i18n.emptyText;
    return {
        username: username,
        emptyTextString: emptyTextString
    };
};

/**
 * Template for el
 * @override
 * @param [context] {Object}
 */
Comment.prototype.template = function (context) {
    return [
        '<section class="hub-comment">',
        '<div class="user-info">',
        '<span class="name">',
        context.username,
        '</span>\n',
        '</div>',
        '<div class="editor-container">',
        '<div class="editor-field placeholder" contenteditable autofocus="autofocus">',
        context.emptyTextString,
        '</div>',
        '</div>',
        '<div class="btn-wrapper">',
        '<button class="lf-btn editor-post-btn">',
        'Post Comment',
        '</button>',
        '</div>',
        '</section>'
    ].join('');
};

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
    View.prototype.render.call(this);

    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this.$postEl = this.$('.' + this.classes.POST_BTN);

    var self = this;
    var clbk = function (err, data) {
        if (err) {
            self.handlePostFailure(err);
        } else {
            self.handlePostSuccess(data);
        }
    };

    var postCmd = new PostComment(
                this,//source
                {//opts
                    callback: clbk
                });
    var authCmd = new AuthRequiredCommand(postCmd);

    this._postButton = new Button(authCmd, {el: this.$postEl});

    this.$textareaEl.focus(this, this._managePlaceholder).blur(this, this._managePlaceholder);
};

/** @override */
Comment.prototype.events = {};//TODO (joao) Probably shouldn't have this override

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

    this.returnModal(undefined, data);
};

/** @override */
Comment.prototype.returnModal = function (err, data) {
    this.reset();//TODO (joao) Possibly move this into handlePostSuccess()
    LaunchableModal.prototype.returnModal.apply(this, arguments);
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
 * Manages the display and removal of placeholder text.
 * @private
 */
Comment.prototype._managePlaceholder = function (ev) {
    var self = ev.data;
    if (!self || !self.$textareaEl) {
        log('Some how attempting to manage placeholder without rendered el.');
        return;
    }

    var text = self.$textareaEl.text();
    if (text !== self._i18n.emptyText && text !== '') {
    //Nothing to react to here
        return;
    }

    var cls = self.classes.PLACEHOLDER;
    //No user input
    if (text === '') {
        self.$textareaEl.addClass(cls);
        self.$textareaEl.text(self._i18n.emptyText);
    } else if (text === self._i18n.emptyText && self.$textareaEl.hasClass(cls)) {
    //Get ready for input
        self.$textareaEl.text('');
        self.$textareaEl.removeClass(cls);
        // self == safeActiveElement() && input.select();
    }
}

module.exports = Comment;
