'use strict';

var Auth = require('streamhub-sdk/auth');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var CommentButton = require('streamhub-input/content-editor/button');
var Content = require('streamhub-sdk/content');
var InputButton = require('streamhub-input/button');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Writable = require('stream/writable');

describe('streamhub-input/content-editor/button', function () {
    it('is a constructor that extends InputButton', function () {
        expect(typeof(CommentButton)).toBe('function');

        var cmtBtn = new CommentButton();
        expect(cmtBtn instanceof InputButton).toBe(true);
    });

    describe('when constructed', function () {
        var cmtBtn;
        var writable;
        var testString = 'data sample'
        beforeEach(function () {
            cmtBtn = new CommentButton();
            writable = new Writable();
            writable._write = function () {};
            spyOn(writable, '_write').andCallFake(function (data, clbk) {
                clbk();
            });
        });

        it('can pipe data to a writable', function () {
            cmtBtn.pipe(writable);
            cmtBtn._input.writeToDestination(testString);
            expect(writable._write).toHaveBeenCalled();
        });

        describe('without a complete Auth flow', function () {
            xit('maintains a disabled state', function () {
                throw 'TODO (joao) Implement this!';
            });
        });

        describe('with opts.destination', function () {
            beforeEach(function () {
                cmtBtn = new CommentButton({destination: writable});
            });

            it('.pipe()s to destination', function () {
                cmtBtn._input.writeToDestination('something');
                expect(writable._write).toHaveBeenCalled();
            });

            describe('and render()\'d', function () {
                beforeEach(function () {
                    cmtBtn.render();
                });

                xit('can be clicked to launch an Edit modal, then receive and pipe the returned value', function () {
                    Auth.setToken('FAKE');//Fake auth
                    //cmtBtn.pipe(writable);
                    cmtBtn.$el.click();

                    var $editor = $('.editor-container > .editor-field');
                    var $post = $('.editor-post-btn');
                    expect($editor).toBeTruthy();
                    expect($post).toBeTruthy();

                    $editor.val(testString);
                    $post.click();
                    expect(writable._write).toHaveBeenCalled();
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
                    input = new Command();
                    input.getInput = function() { return 'stuff'; };
                    input._validate = function() { return true; };
                    input._inputToContent = function(data) { return new Content(data); };

                    opts = {
                        command: cmd,
                        destination: writable,
                        input: input
                    };

                    cmtBtn = new CommentButton(opts);
                });

                xit('doesn\'t wrap the command with AuthRequired when opts.authRequired is false', function () {
                    throw 'TODO (joao) Implement this test!';
                });
            });
        });
    });
});
