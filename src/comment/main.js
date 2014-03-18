var $ = require('jquery');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('comment');
var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Content = require('streamhub-sdk/content');
var Editor = require('streamhub-editor/editor');
var Input = require('input');
var LaunchableModal = require('modal/abstract/launchable-modal');
var ModalView = require('streamhub-sdk/modal');
var PostComment = require('input/command');
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
var Edit = function(opts) {
    opts = opts || {};
    Editor.call(this, opts);
    Input.call(this, opts);//handles opts.destination
    LaunchableModal.call(this);
    
    this._i18n = opts.i18n || this._i18n;
};
inherits(Edit, Editor);
inherits.parasitically(Edit, Input);
inherits.parasitically(Edit, LaunchableModal);

/**
 * Returns the raw data that has been received from the user.
 * @returns {?Object}
 * @override
 */
Edit.prototype._getRawInput = function () {
    return (this.$textareaEl) ? this.buildPostEventObj() : null;
};

/**
 * Checks that the input from the user is valid.
 * Should call showError(msg) with
 * @param [data] {Object} Typically comes from .getInput()
 * @returns {!boolean}
 * @protected
 */
Edit.prototype._validate = function (data) {
    return this.validate(data);
};

/**
 * Resets the input display, typically by clearing out the current user input
 * from the screen.
 */
Edit.prototype.reset = function () {
    this.$textareaEl && this.$textareaEl.val(this._i18n.emptyText);
};

/**
 * Creates and returns a Content object based on the input.
 * @param input {Object} Usually the data retrieved from getInput().
 * @returns {Content}
 * @protected
 */
Edit.prototype._inputToContent = function (input) {
    return new Content(input.body);
};

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
Edit.prototype.class += ' lf-edit';

/**
 * Displayable strings
 * @type {Object}
 */
Edit.prototype._i18n = {
    emptyText: ''
};

// /** @enum {string} */
// Edit.prototype.classes = {
//     FIELD: 'editor-field',
//     POST_BTN: 'editor-post-btn'
// };

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
Edit.prototype.elTag = 'article';

/**
 * Template for el
 * @override
 * @param [context] {Object}
 */
Edit.prototype.template = function (context) {
    return [
        '<section class="lf-modal-body">',
        // '<div class="user-info">',
        // '<span class="name">',
        // 'Ron Burgandy',//DEBUG (joao) Dev text
        // '</span>\n',
        // '<span class="handle">',
        // '@tomoleary',//DEBUG (joao) Dev text
        // '</span>',
        // '</div>',
        '<div class="editor-container">',
        '<textarea class="editor-field">',
        //this._i18n.emptyText,
        // 'Ron Burgandy. Stay classy, San Diego. Hello, Baxter? Baxter, is that you?\n',//DEBUG (joao) Dev text
        // 'Bark twice if you\'re in Milwaukee. Is this Wilt Chamberlain?',//DEBUG (joao) Dev text
        '</textarea>',
        '</div>',
        '<div class="btn-wrapper">',
        '<button class="lf-btn editor-post-btn">',
        'Post Comment',
        '</button>',
        '</div>',
        '</section>'
    ].join('');
};

Edit.prototype.modalTemplate = function (context) {
    return [
        '<article class="lf-modal-content">',
        '<header class="lf-modal-header">',
        'Post Your Comment',
        '</header>',
        Edit.prototype.template.apply(this, arguments),
        '<footer class="lf-modal-footer"></footer>',
        '</article>'
    ].join('');
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 */
Edit.prototype.render = function () {
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
};

/** @override */
Edit.prototype.events = {};//TODO (joao) Probably shouldn't have this override

/**
 * Post failure callback.
 * @param {Object} data The response data.
 */
Edit.prototype.handlePostFailure = function (data) {
    log('Post Failure');
    
    //TODO (joao) Get msg to display from data param.
    //this.showError(msg);
};

/**
 * Post success callback.
 * @param {Object} data The response data.
 */
Edit.prototype.handlePostSuccess = function (data) {
    log('Post Success');

    this.returnModal(undefined, data);
};

/** @override */
Edit.prototype.returnModal = function (err, data) {
    this.reset();//TODO (joao) Possibly move this into handlePostSuccess()
    LaunchableModal.prototype.returnModal.apply(this, arguments);
};

/**
 * Show an error message to the user.
 * @param {string} msg The error message to display.
 */
Edit.prototype.showError = function (msg) {
    log(msg);
    //TODO (joao) Real implementation. Waiting on UX.
};

module.exports = Edit;
