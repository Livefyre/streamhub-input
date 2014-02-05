var $ = require('jquery');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('comment');
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
 * @param [opts.collection] {Writable} Collection to post to.
 *      Recommended, but not required.
 * @param [opts.emptyText] {string} Suggestive text to display in an empty editor.
 * @constructor
 * @extends {Editor}
 */
var Edit = function(opts) {
    opts = opts || {};
    !opts.destination && (opts.destination = opts.collection);
    Editor.call(this, opts);
    Input.call(this, opts);
    LaunchableModal.call(this, opts);
    
    /**
     * The collection or other writable that the user's input is meant for
     * @type {Writable=}
     * @protected
     */
    this._collection = opts.collection;
    
    /**
     * Suggestive text to display in an empty editor.
     * @type {!string}
     */
    this.emptyText = opts.emptyText || '';
};
inherits(Edit, Editor);
inherits.parasitically(Edit, Input);
inherits.parasitically(Edit, LaunchableModal);

/**
 * Reads the data that has been received from the user.
 * @returns {?Object}
 * @override
 */
Edit.prototype.getInput = function () {
    return this.buildPostEventObj();
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
    this.$textareaEl && this.$textareaEl.val(this.emptyText);
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
Edit.prototype.class += ' edit';

/** @enum {string} */
Edit.prototype.classes = {
        FIELD: 'editor-field',
        POST_BTN: 'editor-post-btn'
};

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
        '<div class="user-info">',
        '<span class="name">',
        'Ron Burgandy',//DEBUG (joao) Dev text
        '</span>\n',
        '<span class="handle">',
        '@tomoleary',//DEBUG (joao) Dev text
        '</span>',
        '</div>',
        '<div class="editor-container">',
        '<textarea class="editor-field">',
        //this._emptyText,
        'Ron Burgandy. Stay classy, San Diego. Hello, Baxter? Baxter, is that you?\n',//DEBUG (joao) Dev text
        'Bark twice if you\'re in Milwaukee. Is this Wilt Chamberlain?',//DEBUG (joao) Dev text
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
 * Get contextual data for a template.
 * @override
 * @returns {!Object}
 */
Edit.prototype.getTemplateContext = function () {
    return this;
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 */
Edit.prototype.render = function () {
    var context;
    if (typeof this.template === 'function') {
        context = this.getTemplateContext();
        this.$el.html(this.template(context));
    }
    
    //Just for the editor
    this.$textareaEl = this.$('.' + this.classes.FIELD);
    this.$postEl = this.$('.' + this.classes.POST_BTN);
    
    if (this._collection) {
        var self = this;
        var clbk = function (err, data) {
            if (err) {
                self.handlePostFailure(err);
            } else {
                self.handlePostSuccess(data);
            }
        };
        
        var postCmd = new PostComment(
                    undefined,//fn
                    this,//source
                    this._collection,//destination
                    {callback: clbk});//opts
        
        this._button = new Button(postCmd, {el: this.$postEl});
    }
};

/** @override */
Edit.prototype.events = {};//TODO (joao) Probably shouldn't have this override

/**
 * Post failure callback.
 * @param {Object} data The response data.
 */
Edit.prototype.handlePostFailure = function (data) {
    console.log('Post Failure');//DEBUG (joao)
    
    //TODO (joao) Get msg to display from data param.
    //this.showError(msg);
};

/**
 * Post success callback.
 * @param {Object} data The response data.
 */
Edit.prototype.handlePostSuccess = function (data) {
    console.log('Post Success');//DEBUG (joao)
    
    this._done(undefined, data);
};

/** @override */
Edit.prototype._done = function (err, data) {
    this.reset();
    LaunchableModal.prototype._done.apply(this, arguments);
};

/**
 * Show an error message to the user.
 * @param {string} msg The error message to display.
 */
Edit.prototype.showError = function (msg) {
    alert(msg);//DEBUG (joao)
    //TODO (joao) Real implementation. Waiting on UX.
};

module.exports = Edit;
