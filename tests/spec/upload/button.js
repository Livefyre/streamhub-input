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
        var upldBtn;
        var writable;
        var testString = 'data sample'
        beforeEach(function () {
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
                    var uploadOpts = $.extend({}, Upload.DEFAULT_OPTS);

                    upldBtn.render();
                    Auth.setToken('FAKE');//Fake auth
                });

                it('can be clicked to launch an Upload modal, then receive and pipe the returned value', function () {
                    upldBtn.$el.click();

                    var picker = $('#picker');
                    expect(picker).toBeTruthy();
                });

                it('can receive and pipe the value returned by Upload', function () {
                    // upldBtn.destroy();
                    var uploadOpts = Upload.DEFAULT_OPTS;
                    uploadOpts.pick.debug = true;//Will auto-return an inkBlob

                    opts = {
                        destination: writable,
                        uploadOpts: uploadOpts
                    };

                    upldBtn = new UploadButton(opts);
                    upldBtn.render();
                    upldBtn._command.execute(function (err, data) {});

                    //Fake data upload and response
                    //throw 'TODO (joao) Fake data upload and response.';

                    waitsFor(function() {
                        return window.filepicker;
                    }, 'filepicker to load', 500);
                    runs(function () {
                        expect(writable._write).toHaveBeenCalled();
                    });
                });
            });

            describe('and with additional opts', function () {
                var cmd;
                var cmdSpy;
                var input;
                var opts;
                beforeEach(function () {
                    cmdSpy = jasmine.createSpy('command spy');
                    cmd = new Command(cmdSpy);
                    input = new Input();
                    input.getInput = function() { return 'stuff'; };
                    input._validate = function() { return true; };
                    input._inputToContent = function(data) { return new Content(data); };

                    var uploadOpts = Upload.DEFAULT_OPTS;
                    uploadOpts.pick.container = 'fake';
                    opts = {
                        command: cmd,
                        destination: writable,
                        input: input
                    };

                    upldBtn = new UploadButton(opts);
                });

                it('uses opts.command in place of its default command', function () {
                    expect(upldBtn._command).toBe(cmd);
                    upldBtn._command.execute();
                    expect(cmdSpy).toHaveBeenCalled();
                });

                it('assigns opts.input to ._input and is .pipe()\'d from it', function () {
                    expect(upldBtn._input).toBe(input);

                    spyOn(upldBtn, 'write');
                    input.emit('data', 'something');
                    expect(upldBtn.write).toHaveBeenCalledWith('something');
                });

                it('uses opts.uploadOpts during default construction of the Upload', function () {
                    var uploadOpts = $.extend({}, Upload.DEFAULT_OPTS);
                    uploadOpts.container = 'fake';
                    upldBtn = new UploadButton({uploadOpts: uploadOpts});
                    expect(upldBtn._input.opts.pick.container).toBe('fake');
                });
            });
        });
    });
});
