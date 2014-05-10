'use strict';

var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var InputButton = require('streamhub-input/button');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Writable = require('stream/writable');

describe('streamhub-input/button', function () {
    var inputButton;
    var opts;
    var writable;
    beforeEach(function () {
        writable = new Writable();
        writable._write = function () {};
        opts = {
            destination: writable
        };

        inputButton = new InputButton(null, opts);
    });

    it('assigns opts.destination to ._destination and .pipe()s to it', function () {
        spyOn(writable, 'write');
        inputButton.push('something');
        expect(writable.write).toHaveBeenCalledWith('something');
    });
});
