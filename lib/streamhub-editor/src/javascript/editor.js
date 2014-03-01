/**
 * @fileOverview The editor view class. This contains the editor box and any
 * buttons that go along with it.
 */

var $ = require('jquery');
var EventMap = require('view/event-map');
var inherits = require('inherits');
var util = require('streamhub-editor/util');
var View = require('view');

/**
 * Editor view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var Editor = function(opts) {
    View.call(this, opts);
};
inherits(Editor, View);

/** @enum {string} */
Editor.prototype.classes = {
    FIELD: 'editor-field',
    POST_BTN: 'editor-post-btn'
};

/** @enum {string} */
Editor.prototype.errors = {
    BODY: 'Please enter a body'
};

/**
 * Build the post event object that will be dispatched from the editor.
 * @return {Object} The post event object.
 */
Editor.prototype.buildPostEventObj = function() {
    var event = {};
    event.body = this.$textareaEl.val();
    event.failure = $.proxy(this.handlePostFailure, this);
    event.success = $.proxy(this.handlePostSuccess, this);
    return event;
};

/** @override */
Editor.prototype.events = new EventMap((function() {
    var classes = Editor.prototype.classes;
    var events = {};
    events['click .' + classes.POST_BTN] = 'handlePostBtnClick';
    return events;
})());

/**
 * Handle the post button click event. This should validate the data and
 * dispatch a post event that a controller can handle.
 */
Editor.prototype.handlePostBtnClick = function() {
    var data = this.buildPostEventObj();
    if (!this.validate(data)) {
        return;
    }
    this.sendPostEvent(data);
};

/**
 * Post failure callback.
 * @param {Object} data The response data.
 */
Editor.prototype.handlePostFailure = util.abstractMethod;

/**
 * Post success callback.
 * @param {Object} data The response data.
 */
Editor.prototype.handlePostSuccess = util.abstractMethod;

/** @override */
Editor.prototype.render = function() {
    View.prototype.render.call(this);
    this.$textareaEl = this.$('.' + this.classes.FIELD);
};

/**
 * Send the post event.
 * @param {Object} data The post data to send.
 */
Editor.prototype.sendPostEvent = util.abstractMethod;

/**
 * Show an error message to the user.
 * @param {string} msg The error message to display.
 */
Editor.prototype.showError = util.abstractMethod;

/**
 * Validate the post data.
 * @param {Object} data The post data to be validated.
 * @return {boolean} Whether the post data is valid or not.
 */
Editor.prototype.validate = function(data) {
    if (!data.body) {
        this.showError(this.errors.BODY);
        return false;
    }
    return true;
};

module.exports = Editor;
