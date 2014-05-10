'use strict';

var Auth = require('auth');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var InputButton = require('streamhub-input/button');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Upload = require('streamhub-input/upload');
var UploadButton = require('streamhub-input/upload/button');
var Writable = require('stream/writable');

describe('streamhub-input/upload/button', function () {
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
            upldBtn.push(testString);
            expect(writable._write).toHaveBeenCalled();
        });

        describe('without a complete Auth flow', function () {
            xit('maintains a disabled state', function () {
                throw 'TODO (joao) Implement this!';
            });
        });

        describe('with opts.destination', function () {
            beforeEach(function () {
                upldBtn = new UploadButton({
                    authRequired: false,
                    destination: writable
                });
            });

            it('.pipe()s to the destination', function () {
                upldBtn.push('something');
                expect(writable._write).toHaveBeenCalled();
            });

            describe('and render()\'d', function () {
                beforeEach(function () {
                    opts.authRequired = false;
                    opts.pick.debug = true;
                    opts.destination = writable;

                    upldBtn.render();
                });

                it('can be clicked to launch an Upload modal, then receive and pipe the returned value', function () {
                    upldBtn.$el.click();
                    var picker = $('#picker');
                    expect(picker).toBeTruthy();
                });

                it('can receive and pipe the value returned by Upload', function () {
                    upldBtn = new UploadButton(opts);
                    spyOn(upldBtn._upload, '_processResponse').andCallThrough();
                    upldBtn.render();
                    upldBtn._command.execute(function (err, data) {});

                    waitsFor(function() {
                        return window.filepicker &&
                            upldBtn._upload._processResponse.calls.length;
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
                    input = new Command();
                    input.getInput = function() { return 'stuff'; };
                    input._validate = function() { return true; };
                    input._inputToContent = function(data) { return new Content(data); };

                    opts.command = cmd,
                    opts.destination = writable;
                    opts.pick.container = 'fake';

                    upldBtn = new UploadButton(opts);
                });

                xit('doesn\'t wrap the command with AuthRequired when opts.authRequired is false', function () {
                    throw 'TODO (joao) Implement this test!';
                });
            });
        });
    });
});
