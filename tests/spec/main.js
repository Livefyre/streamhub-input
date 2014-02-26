'use strict';

var Input = require('input');
var Readable = require('stream/readable');
var Writable = require('stream/writable');

describe('streamhub-input', function () {
    it('is a constructor that inherits parasitically from Readable', function () {
        expect(typeof(Input)).toBe('function');
        var input = new Input();
        expect(input instanceof Input).toBe(true);
        //TODO (joao) Improve the check for Readable and EventEmitter
        expect(typeof(input.read)).toBe('function');
        expect(typeof(input.on)).toBe('function');
    });
    
    describe('when constructed', function () {
        var input;
        beforeEach(function () {
            spyOn(Input.prototype, '_getRawInput');
            input = new Input();
        });

        describe('with opts', function () {
            var opts;
            var writable;
            beforeEach(function () {
                writable = new Writable();
                opts = {
                    destination: writable
                };

                input = new Input(opts);
            });

            it('assigns opts.destination to ._destination', function () {
                expect(input._destination).toBe(writable);
            });
        });
    });
});
