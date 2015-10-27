'use strict';

var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var ModalView = require('streamhub-sdk/modal');
var View = require('view');

describe('streamhub-input/javascript/modal/launchable-modal', function () {
    describe('inherits.parasitically() by a View and', function () {
        var data;
        var err;
        var SubView;
        var view;

        beforeEach(function () {
            SubView = function (opts) {
                if (!opts || !opts.noTemplate) {
                    this.template = function () {
                        return '<div></div>';
                    };
                }

                View.apply(this, arguments);
                LaunchableModal.apply(this, arguments);
            };
            inherits(SubView, View);
            inherits.parasitically(SubView, LaunchableModal);

            data = 'stuff';
            err = 'error';
            view = new SubView();
        });

        afterEach(function () {
            view.destroy();
        });

        it('preserves template() to be used for default rendering', function () {
            expect(typeof(view.template)).toBe('function');
            expect(typeof(view.template({}))).toBe('string');
        });

        it('can launchModal without a callback', function () {
            expect(function () {
                view.launchModal();
            }).not.toThrow();
            expect(view._modal).toBeTruthy();
            expect(view._modal._modalSubView).toBe(view);
        });

        it('does nothing when returnModal() is called out of turn', function () {
            view.launchModal();

            var spy = spyOn(view._modal.$el, 'trigger').andCallThrough();
            //Do it right
            view.returnModal();
            expect(spy).toHaveBeenCalled();

            spy.reset();

            //Do it wrong
            view.returnModal();
            expect(spy).not.toHaveBeenCalled();
        });

        it('hide()s the modal when returnModal', function () {
            view.launchModal();
            expect(view._modal).toBeTruthy();

            spyOn(view._modal, 'hide').andCallThrough();
            view.returnModal();
            expect(view._modal.hide).toHaveBeenCalled();
        });

        it('can launchModal() with a specified modal', function () {
            var modal = new ModalView();
            view.launchModal(modal);
            expect(view._modal).toEqual(modal);
            modal.destroy();
        });
    });
});
