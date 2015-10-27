'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var InputButton = require('streamhub-input/javascript/button');
var Pipeable = require('streamhub-input/javascript/pipeable');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/button', function () {
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

    it('wraps the command in a auth required command by default', function () {
        var command = new Command(function () {});
        inputButton = new InputButton(command, opts);
        expect(inputButton._command instanceof AuthRequiredCommand).toBeTruthy();
    });

    it('can skip the auth required command', function () {
        var command = new Command(function () {});
        inputButton = new InputButton(command, {
            authRequired: false
        });
        expect(inputButton._command instanceof AuthRequiredCommand).not.toBeTruthy();
    });
});
