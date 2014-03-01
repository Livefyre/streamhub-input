define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/storage',
    'streamhub-sdk/content'],
function ($, Storage, Content) {
    'use strict';

    describe('Storage', function () {
        var contentA,
            contentB,
            onSpy;
        beforeEach(function () {
            Storage.cache = {};
            contentA = new Content("Body A");
            contentB = new Content("Body B");
            onSpy = jasmine.createSpy('event handler');
        });
        
        describe(".set", function () {
            
            beforeEach(function () {
                
            });
            
            it("adds new contents and emits 'add'", function () {
                Storage.on('add', onSpy);
                
                Storage.set(contentA.id, contentA);
                
                expect(Storage.cache[contentA.id]).toEqual(contentA);
                expect(onSpy).toHaveBeenCalledWith(contentA);
            });

            it("updates existing contents and emits 'change'", function () {
                Storage.on('change', onSpy);
                
                Storage.set(contentA.id, contentA);
                Storage.set(contentA.id, contentB);
                
                expect(Storage.cache[contentA.id]).toEqual(contentB);
                expect(onSpy).toHaveBeenCalledWith(contentA, contentB);
            });
            
            it("returns content", function () {
                var val = Storage.set('key', contentA);
                
                expect(val).toEqual(contentA);
            });
            
            it("executes callback when provided", function () {
                var spy = jasmine.createSpy('callback');
                
                Storage.set('key', contentA, spy);
                
                expect(spy).toHaveBeenCalledWith(contentA);
            });
        });
        
        describe(".get", function () {
            var key;
            beforeEach(function () {
                key = contentA.id;
                Storage.cache[key] = contentA;
            });
            
            it("returns content", function () {
                var val = Storage.get(key);
                
                expect(val).toEqual(contentA);
            });
            
            it("returns undefined when there is no data for that key", function () {
                var val = Storage.get('fake key');
                
                expect(val).not.toBeDefined();
            });
            
            it("executes callback when provided", function () {
                var spy = jasmine.createSpy('callback');
                Storage.get(key, spy);
                
                expect(spy).toHaveBeenCalledWith(contentA);
            });
        });
    });
});
