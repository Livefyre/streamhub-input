var Command = require('streamhub-sdk/ui/command');
var InputButton = require('streamhub-input/button');
var Pipeable = require('streamhub-input/pipeable');
var Writable = require('stream/writable');

'use strict';

describe('streamhub-input/button', function () {
    var input;
    var inputButton;
    var opts;
    var writable;

    it('has a pipeable and a destination (if specified)', function () {
        input = new Pipeable();
        writable = new Writable();
        writable._write = function () {};
        opts = {
            destination: writable,
            input: input
        };

        inputButton = new InputButton(null, opts);
        spyOn(writable, 'write');
        inputButton._input.writeToDestination('something', 'cb');
        expect(writable.write).toHaveBeenCalledWith('something', 'cb');
    });

    it('wraps the pipeable for post-construction piping', function () {
        input = new Pipeable();
        writable = new Writable();
        writable._write = function () {};
        opts = {
            input: input
        };

        inputButton = new InputButton(null, opts);
        inputButton.pipe(writable);
        spyOn(writable, 'write');
        inputButton._input.writeToDestination('something', 'cb');
        expect(writable.write).toHaveBeenCalledWith('something', 'cb');
    });

    it('throws no error if no input is specified', function () {
        writable = new Writable();
        writable._write = function () {};

        inputButton = new InputButton(null, opts);
        inputButton.pipe(writable);  // no error
    });
});
