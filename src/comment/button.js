//var $ = require('streamhub-sdk/jquery');
var inherits = require('inherits');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Edit = require('comment');
var ModalInputCommand = require('modal/modal-input-command');

'use strict';

/**
 * @param [command] {function|Command} Collection not necessary if this is provided.
 * @param [collection] {Collection} Must be specified here or as opts.collection.
 * @param [opts] {Object}
 * @param [opts.collection] {Collection} Must be specified here or the collection parameter.
 * @param [opts.edit] {Edit} Edit to use instead of the default Edit.
 * @constructor
 * @extends {Button}
 */
var EditButton = function(command, collection, opts) {
    opts = opts || {};
    collection = opts.collection = collection || opts.collection;
    if (!collection && !command) {
    //A collection must be specified unless the user specifies their own command
        throw 'Attempting to create an EditButton without specifying a collection or a command.';
    }
    
    var edit = opts.edit || new Edit({collection: collection});
    if (typeof(command) === 'function') {
    //Pass a function to the default command
        command = new ModalInputCommand(command, edit, opts);
    }
    command = command || new ModalInputCommand(undefined, edit, opts);
    Button.call(this, command, opts);
};
inherits(EditButton, Button);

/**
 * @override
 * @type {string}
 */
EditButton.prototype.elClass += ' lf-edit-btn';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
EditButton.prototype.elTag = 'button';

/**
 * Template for el
 * @override
 * @param [context] {Object}
 */
EditButton.prototype.template = function (context) {
    return ['<button class="lf-btn lf-edit-btn">',
            'Post Your Comment ',
            '</button>'].join('');
};

/**
 * Get contextual data for a template.
 * @override
 * @returns {!Object}
 */
EditButton.prototype.getTemplateContext = function () {
    return this;
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 * @param [parent] {Element} Parent container to render into.
 */
EditButton.prototype.render = function (parent) {
    var context;
    if (typeof this.template === 'function') {
        context = this.getTemplateContext();
        this.$el.html(this.template(context));
    }
    
    parent && $(parent).append(this.el);
};

module.exports = EditButton;
