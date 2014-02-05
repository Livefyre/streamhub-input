//var $ = require('streamhub-sdk/jquery');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var ModalInputCommand = require('modal/modal-input-command');
var Upload = require('upload');

'use strict';

/**
 * @param [command] {function||Command} Collection not necessary if this is provided.
 * @param [collection] {Collection} Must be specified here or as opts.collection.
 * @param [opts] {Object}
 * @param [opts.collection] {Collection} Must be specified here or the collection parameter.
 * @param [opts.upload] {Upload} Upload instance to use in place a of default constructed Upload.
 * @param [opts.uploadOpts] {Object} Opts to pass to the default Upload on construction.
 * @constructor
 * @extends {Button}
 */
var UploadButton = function(command, collection, opts) {
    opts = opts || {};
    collection = opts.collection = collection || opts.collection;
    if (!collection && !command) {
    //A collection must be specified unless the user specifies their own command
        throw 'Attempting to create an UploadButton without specifying a collection or a command.';
    }
    
    var upload = opts.upload || new Upload(opts.uploadOpts);
    if (typeof(command) === 'function') {
    //Pass a function to the default command
        command = new ModalInputCommand(command, upload, opts);//(command, edit, opts);
    }
    command = command || new ModalInputCommand(undefined, upload, opts);
    command.callback = function (err, data) {
        data && data.forEach(function (content) {
            collection.write(content);
        });
    }
    
    Button.call(this, command, opts);
};
inherits(UploadButton, Button);

/**
 * @override
 * @type {string}
 */
UploadButton.prototype.elClass += ' lf-upload-btn';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
UploadButton.prototype.elTag = 'button';

/**
 * Template for el
 * @override
 * @param [context] {Object}
 */
UploadButton.prototype.template = function (context) {
    return ['<button class="lf-btn lf-upload-btn">',
            'Post Your Photo ',
            '<i class="fycon-composer-photo"></i>',
            '</button>'].join('');
};

/**
 * Get contextual data for a template.
 * @override
 * @returns {!Object}
 */
UploadButton.prototype.getTemplateContext = function () {
    return this;
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those sub-elements
 * @param [parent] {Element} Parent container to render into.
 */
UploadButton.prototype.render = function (parent) {
    var context;
    if (typeof this.template === 'function') {
        context = this.getTemplateContext();
        this.$el.html(this.template(context));
    }
    
    parent && $(parent).append(this.el);
};

module.exports = UploadButton;
