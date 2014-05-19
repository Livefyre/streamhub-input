'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var ModalInputCommand= require('streamhub-input/javascript/modal/modal-input-command');
var util = require('streamhub-input/javascript/util');
var View = require('view');

describe('streamhub-input/javascript/modal/modal-input-command', function () {

    it('is an constructor that subclasses Command', function () {
        expect(typeof(ModalInputCommand)).toBe('function');
    });

    it('thows if you try to construct without specifying a view', function () {
        expect(function () {
            new ModalInputCommand();
        }).toThrow();
    });

    describe('when constructed', function () {
        var LaunchableView = function (opts) {
            if (!opts || !opts.noTemplate) {
                this.template = function () {
                    return '<div></div>';
                };
            }

            View.apply(this, arguments);
            LaunchableModal.apply(this, arguments);
        };
        inherits(LaunchableView, View);
        inherits.parasitically(LaunchableView, LaunchableModal);

        var clbk;
        var inputCmd;
        var view;
        beforeEach(function () {
            clbk = jasmine.createSpy('callback');
            view = new LaunchableView();

            inputCmd = new ModalInputCommand(view);
        });

        it('!.canExecute() if the view is taken away', function () {
            inputCmd.view = undefined;
            expect(inputCmd.canExecute()).toBeFalsy();
        });

        it('passes .callback to launchModal() on execute()', function () {
            inputCmd = new ModalInputCommand(view, {
                callback: clbk
            });
            inputCmd.execute()
            inputCmd.view.returnModal();
            expect(clbk).toHaveBeenCalled();
        });

        it('passes a null function to launchModal() when .callback is falsy', function () {
            inputCmd.callback = undefined;
            spyOn(util, 'nullFunction').andCallThrough();
            inputCmd.execute()
            inputCmd.view.returnModal();
            expect(util.nullFunction).toHaveBeenCalled();
        });

        it('passes a specified callback to launchModal for .execute(callback)' , function () {
            inputCmd.execute(clbk)
            inputCmd.view.returnModal();
            expect(clbk).toHaveBeenCalled();
        });

        describe('with opts', function() {
            var clbk2;
            var fn;
            var opts;
            beforeEach(function () {
                clbk2 = jasmine.createSpy('custom callback');
                fn = jasmine.createSpy('custom function');
                opts = {
                    callback: clbk2,
                    fn: fn
                };

                inputCmd = new ModalInputCommand(view, opts);
            });

            it('sets opts.callback as this.callback', function () {
                inputCmd = new ModalInputCommand(view, { callback: clbk2 });
                //Control
                expect(clbk2).not.toHaveBeenCalled();

                inputCmd.execute();
                inputCmd.view.returnModal();
                expect(clbk2).toHaveBeenCalled();
            });
        });
    });
});
