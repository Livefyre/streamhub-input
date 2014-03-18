'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var debug = require('streamhub-sdk/debug');
var Input = require('input');
var InputButton = require('input/button');
var InputCommand = require('input/command');
var Readable = require('stream/readable');
var Writable = require('stream/writable');

describe('streamhub-input/command', function () {
    it('is a constructor that extends Command', function () {
        expect(typeof(InputCommand)).toBe('function');
        var inputCommand = new InputCommand(new Input(), new Writable());
        expect(inputCommand instanceof Command).toBe(true);
    });
    
    describe('when constructed', function () {
        var cmd;
        var cmdSpy;
        var dest;
        var inputCommand;
        var src;
        var testString;
        beforeEach(function () {
            testString = 'stuff';
            cmdSpy = jasmine.createSpy('command');
            cmd = new Command(cmdSpy);
            dest = new Writable();
            dest._write = function (data, clbk) { clbk(undefined, data); };
            src = new Input(cmd);
            src.getInput = function() { return testString; };
            src._validate = function() { return true; };
            src._inputToContent = function(data) { return data; };

            inputCommand = new InputCommand(src);
            //This pipe() is done by the InputButton
            src.pipe(dest);

            //Control check
            expect(inputCommand.canExecute()).toBeTruthy();
        });

        afterEach(function () {
            src.unpipe(dest);
        });

        it('throws when source isn\'t provided and .disable()s', function () {
            //Confirming good stuff
            expect(function() {
                inputCommand = new InputCommand();
                expect(inputCommand.canExecute()).toBeTruthy();
            }).toThrow();

            //Trying bad stuff
            expect(function() {
                inputCommand = new InputCommand(undefined);
                expect(inputCommand.canExecute()).toBeFalsy();
            }).toThrow();
            expect(function() {
                inputCommand = new InputCommand(src);
                expect(inputCommand.canExecute()).toBeTruthy();
            }).not.toThrow();
        });

        it('!.canExecute() when ._source is falsy', function () {
            //Break ._source
            inputCommand._source = undefined;
            expect(inputCommand.canExecute()).toBeFalsy();

            //Fix ._source
            inputCommand._source = src;
            expect(inputCommand.canExecute()).toBeTruthy();
        });

        it('can be .disable()\'d and .enable()\'d', function () {
            inputCommand.disable();
            expect(inputCommand.canExecute()).toBeFalsy();

            inputCommand.enable();
            expect(inputCommand.canExecute()).toBeTruthy();
        });

        xit('has a default .callback that logs when it is called', function () {
            if (debug.enabled('input/command')) {
                spyOn(console, 'log').andCallThrough();

                inputCommand.execute();

                waitsFor(function () {
                    return console.log.wasCalled;
                }, 'console.log to get called', 200);
                runs(function () {
                    expect(console.log).toHaveBeenCalled();
                });
            } else {
                throw 'This test requires debugging enabled for input/command';
            }
        });

        describe('and .executed()', function () {
            var clbk;
            var fn;
            beforeEach(function () {
                clbk = jasmine.createSpy('.callback');
                fn = jasmine.createSpy('fn callback');
                inputCommand.callback = clbk;
            });

            it('.read()\'s data from ._source and emits it', function () {
                spyOn(dest, 'write');

                inputCommand.execute();
                expect(dest.write).toHaveBeenCalledWith(testString);
            });

            xit('passes .callback to be called', function () {
                spyOn(dest, 'write').andCallThrough();

                inputCommand.execute();
                expect(dest.write).toHaveBeenCalledWith(testString, clbk);
                waitsFor(function () {
                    return clbk.callCount;
                }, 'clbk to be called', 500);
                runs(function () {
                    expect(clbk).toHaveBeenCalled();
                });
            });

            xit('passes a callback parameter to be called', function () {
                spyOn(dest, 'write').andCallThrough();

                inputCommand.execute(fn);
                expect(dest.write).toHaveBeenCalledWith(testString, fn);
                waitsFor(function () {
                    return fn.callCount;
                }, 'fn to be called', 500);
                runs(function () {
                    expect(fn).toHaveBeenCalled();
                });
            });
        });

        describe('with opts', function () {
            var clbk;
            var fn;
            beforeEach(function () {
                clbk = jasmine.createSpy('callback');
                fn = jasmine.createSpy('custom function');
                opts = {
                    callback: clbk,
                    fn: fn
                };

                inputCommand = new InputCommand(src, opts);
            });

            it('assigns opts.callback to .callback', function () {
                expect(inputCommand.callback).toBe(clbk);

                inputCommand.callback();
                expect(clbk).toHaveBeenCalled();
            });

            it('assigns opts.fn to ._execute', function () {
                expect(inputCommand._execute).toBe(fn);
                
                inputCommand.execute();
                expect(fn).toHaveBeenCalled();
            });
        });
    });
});
