'use strict';

var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var InputButton = require('streamhub-input/button');
var Passthrough = require('stream/passthrough');
var Pipeable = require('streamhub-input/pipeable');
var Readable = require('stream/readable');
var Writable = require('stream/writable');

describe('streamhub-input/button', function () {
    var inputButton;
    var opts;
    var writable;
    var input = new Pipeable();
    beforeEach(function () {
        writable = new Writable();
        writable._write = function () {};
        opts = {
            destination: writable,
            input: input
        };

        inputButton = new InputButton(null, opts);
    });

    it('has a pipeable and a destination', function () {
        spyOn(writable, 'write');
        inputButton._input.writeToDestination('something', 'cb');
        expect(writable.write).toHaveBeenCalledWith('something', 'cb');
    });
});
