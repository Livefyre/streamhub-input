'use strict';

var Auth = require('streamhub-sdk/auth');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var Input = require('input');
var InputButton = require('input/button');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Upload = require('upload');
var UploadButton = require('upload/button');
var Writable = require('stream/writable');

describe('upload/button', function () {
    it('is a constructor that extends InputButton', function () {
        expect(typeof(UploadButton)).toBe('function');

        var upldBtn = new UploadButton();
        expect(upldBtn instanceof InputButton).toBe(true);
    });
    
    describe('when constructed', function () {
        var opts;
        var upldBtn;
        var writable;
        var testString = 'data sample'
        beforeEach(function () {
            opts = $.extend({}, Upload.DEFAULT_OPTS);
            upldBtn = new UploadButton();
            writable = new Writable();
            spyOn(writable, '_write').andCallFake(function (data, clbk) {
                clbk();
            });
        });

        it('can pipe data to a writable', function () {
            upldBtn.pipe(writable);
            upldBtn.write(testString);
            expect(writable._write).toHaveBeenCalled();
        });

        describe('with opts.destination', function () {
            beforeEach(function () {
                upldBtn = new UploadButton({destination: writable});
            });

            it('assigns opts.destination to ._destination and .pipe()s to it', function () {
                expect(upldBtn._destination).toBe(writable);

                upldBtn.write('something');
                expect(writable._write).toHaveBeenCalled();
            });

            describe('and render()\'d', function () {
                beforeEach(function () {
                    opts.pick.debug = true;
                    opts.destination = writable;

                    upldBtn.render();
                    Auth.setToken('FAKE');//Fake auth
                });

                it('can be clicked to launch an Upload modal, then receive and pipe the returned value', function () {
                    upldBtn.$el.click();

                    var picker = $('#picker');
                    expect(picker).toBeTruthy();
                });

                it('can receive and pipe the value returned by Upload', function () {
                    upldBtn = new UploadButton(opts);
                    spyOn(upldBtn._input, '_processResponse').andCallThrough();
                    upldBtn.render();
                    upldBtn._command.execute(function (err, data) {});

                    waitsFor(function() {
                        return window.filepicker && 
                            upldBtn._input._processResponse.calls.length;
                    }, 'filepicker to load', 2000);
                    runs(function () {
                        expect(writable._write).toHaveBeenCalled();
                    });
                });
            });

            describe('and with additional opts', function () {
                var cmd;
                var cmdSpy;
                var input;
                beforeEach(function () {
                    cmdSpy = jasmine.createSpy('command spy');
                    cmd = new Command(cmdSpy);
                    input = new Input();
                    input.getInput = function() { return 'stuff'; };
                    input._validate = function() { return true; };
                    input._inputToContent = function(data) { return new Content(data); };

                    opts.command = cmd,
                    opts.destination = writable;
                    opts.pick.container = 'fake';

                    upldBtn = new UploadButton(opts);
                });

                it('uses opts.command in place of its default command', function () {
                    expect(upldBtn._command).toBe(cmd);
                    upldBtn._command.execute();
                    expect(cmdSpy).toHaveBeenCalled();
                });
            });
        });
    });
});
