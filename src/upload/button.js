var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var InputButton = require('input/button');
var ModalInputCommand = require('modal/modal-input-command');
var Upload = require('upload');

'use strict';

/**
 * @param [opts] {Object}
 * @param [opts.command] {Command} A Command to replace the default,
 *          incase it isn't good enough for you.
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @param [opts.uploadOpts] {Object} Opts to pass to the default Upload on construction.
 * @constructor
 * @extends {Button}
 */
var UploadButton = function(opts) {
    opts = opts || {};
    var input = new Upload(opts);
    command = opts.command || new ModalInputCommand(input, opts);
    
    var self = this;
    command.callback = function (err, data) {
        data && self._destination && data.forEach(function (content) {
            self._destination.write(content);
        });
    }
    
    InputButton.call(this, command, opts);
    input.pipe(this);
};
inherits(UploadButton, InputButton);

/**
 * @override
 * @type {string}
 */
UploadButton.prototype.elClass += ' lf-upload-btn';

module.exports = UploadButton;
