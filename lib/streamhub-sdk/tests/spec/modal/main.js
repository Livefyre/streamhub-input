define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/content',
    'streamhub-sdk/content/types/oembed',
    'streamhub-sdk/modal',
    'streamhub-sdk/content/views/gallery-attachment-list-view'
], function($, Content, Oembed, ModalView, GalleryAttachmentListView) {
    'use strict';

    describe('ModalView', function() {

        describe('when constructed', function() {

            describe('with no arguments', function() {

                var modalView = new ModalView();
                expect(modalView instanceof ModalView).toBe(true);
            });
        });

        describe('when DOM ready', function () {
            var modalView;

            beforeEach(function () {
                modalView = new ModalView({ modalSubView: new GalleryAttachmentListView() });
            });

            afterEach(function () {
                modalView.hide();
            });

            it('has inserted a container element as a direct child of body element', function () {
                $(document).trigger('ready');
                expect($('body > .hub-modals')).toBe('div');
            });
        });

        describe('when rendering', function () {

            var modalView;

            beforeEach(function() {
                modalView = new ModalView({ modalSubView: new GalleryAttachmentListView() });
                modalView.render();
            });

            afterEach(function () {
                modalView.hide();
            });

            it('has a close button', function () {
                var $closeButton = modalView.$el.find(modalView.closeButtonSelector);
                expect($closeButton.length).toBe(1);
            });

            it('has an element to contain the contentView of the modal', function() {
                var $contentViewEl = modalView.$el.find(modalView.containerElSelector);
                expect($contentViewEl.length).toBe(1);
            });
        });

        describe('when showing', function() {

            var modalView;

            beforeEach(function() {
                modalView = new ModalView();
                modalView.show(new GalleryAttachmentListView());
            });

            afterEach(function() {
                modalView.hide();
            });

            it('is appended as a direct child of ModalView.el', function() {
                expect(modalView.$el.parent()).toBe(ModalView.$el);
            });

            it('the .visible property is true', function() {
                modalView.show(new GalleryAttachmentListView());
                expect(modalView.visible).toBe(true);
            });
        });

        describe('when hiding', function() {

            var modalView;

            beforeEach(function() {
                modalView = new ModalView({ modalSubView: new GalleryAttachmentListView() });
                modalView.render();
            });

            afterEach(function() {
                modalView.hide();
                $('body > .hub-modals').remove();
            });

            it('the .visible property is false', function() {
                modalView.show(new GalleryAttachmentListView());
                modalView.hide();
                expect(modalView.visible).toBe(false);
            });
        });

        describe('when dismissing', function () {

            describe('with Escape key', function() {
                var modalView;

                beforeEach(function() {
                    modalView = new ModalView();
                });

                afterEach(function() {
                    modalView.hide();
                });

                it('hides the modal', function () {
                    modalView.show(new GalleryAttachmentListView());
                    spyOn(modalView, 'hide').andCallThrough();
                    $(window).trigger($.Event('keyup', { keyCode: 27 }));
                    expect(modalView.hide).toHaveBeenCalled();
                });
            });

            describe('with Close button', function() {
                var modalView;

                beforeEach(function() {
                    modalView = new ModalView();
                });

                afterEach(function() {
                    modalView.hide();
                });

                it('hides the modal', function () {
                    modalView.show(new GalleryAttachmentListView());
                    spyOn(modalView, 'hide').andCallThrough();
                    var $closeButtonEl = modalView.$el.find(modalView.closeButtonSelector);
                    $closeButtonEl.trigger('click');
                    expect(modalView.hide).toHaveBeenCalled();
                });
            });
        });
    });
});
