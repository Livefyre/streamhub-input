'use strict';

var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var Input = require('input');
var InputButton = require('input/button');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Writable = require('stream/writable');

describe('streamhub-input/button', function () {
    it('is a constructor that extends Button and inherits parasitically from Passthrough', function () {
        expect(typeof(InputButton)).toBe('function');

        var inputButton = new InputButton(new Command(function () {}));
        expect(inputButton instanceof Button).toBe(true);
        //TODO (joao) Improve the check for Passthrough
        expect(typeof(inputButton.read)).toBe('function');
        expect(typeof(inputButton.write)).toBe('function');
    });

    it('can\'t be constructed without a command specified', function  () {
        expect(function () {
            new InputButton();
        }).toThrow();
    });
    
    describe('when constructed', function () {
        var inputButton;
        var cmd;
        var cmdSpy;
        beforeEach(function () {
            cmdSpy = jasmine.createSpy('command');
            cmd = new Command(cmdSpy);
            inputButton = new InputButton(cmd);
        });

        describe('with opts', function () {
            var input;
            var opts;
            var writable;
            beforeEach(function () {
                input = new Input();
                input.getInput = function() { return 'stuff'; };
                input._validate = function() { return true; };
                input._inputToContent = function(data) { return new Content(data); };

                writable = new Writable();
                writable._write = function () {};
                opts = {
                    destination: writable,
                    input: input
                };

                inputButton = new InputButton(cmd, opts);
            });

            it('assigns opts.destination to ._destination and .pipe()s to it', function () {
                expect(inputButton._destination).toBe(writable);

                spyOn(writable, 'write');
                inputButton.write('something');
                expect(writable.write).toHaveBeenCalledWith('something');
            });
        });
    });
});
