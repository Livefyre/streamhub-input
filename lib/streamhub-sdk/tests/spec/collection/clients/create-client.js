define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/collection/clients/create-client'],
function ($, LivefyreCreateClient) {
    'use strict';

    describe('A LivefyreCreateClient', function () {
        var spy, mockSuccessResponse, callback, opts, createClient;

        beforeEach(function () {
            createClient = new LivefyreCreateClient();
        });
        
        describe("when constructed with normal opts", function () {
            beforeEach(function() {
                mockSuccessResponse = {"msg": "This request is being processed.", "status": "ok", "code": 202};

                spy = spyOn(createClient, '_request').andCallFake(function(opts, errback) {
                    return $.ajax().success(function () {
                        errback(null, mockSuccessResponse);
                    });
                });
                
                callback = jasmine.createSpy();
                opts = {"environment": "t402.livefyre.com",
                        "network": "labs-t402.fyre.co",
                        "siteId": "286470",
                        "articleId": "1111123",
                        "collectionMeta": {
                            "title": 'Media Wall Example',
                            "url": 'http://www.fake.com',
                            "tags": ['test', 'wall']
                        },
                        "signed": false
                };
            });

            it("is instanceof LivefyreCreateClient", function () {
                expect(createClient instanceof LivefyreCreateClient).toBe(true);
            });

            it("should return a confirmation when createCollection is called", function () {        
                createClient.createCollection(opts, callback);
        
                waitsFor(function() {
                    return callback.callCount > 0;
                });
                runs(function() {
                    expect(callback).toHaveBeenCalled();
                    expect(callback.callCount).toBe(1);
                    expect(callback.mostRecentCall.args[0]).toBeNull();
                    expect(callback.mostRecentCall.args[1]).toBeDefined();
                    expect(callback.mostRecentCall.args[1]).toBe(mockSuccessResponse);
                });                            
            });
            
            it("has the correct post data", function () {
                createClient.createCollection(opts, callback);
                var requestType = createClient._request.mostRecentCall.args[0].method;
                var requestData = createClient._request.mostRecentCall.args[0].data;
                expect(requestType).toBe('POST');
                expect(requestData).toBe('{"collectionMeta":{"title":"Media Wall Example","url":"http://www.fake.com","tags":"test,wall","articleId":"1111123"},"signed":false}');
            });
            
            it("requests the correct URL", function () {
                createClient.createCollection(opts, callback);
                var requestUrl = createClient._request.mostRecentCall.args[0].url;
                expect(requestUrl).toBe('http://quill.labs-t402.fyre.co/api/v3.0/site/286470/collection/create');
            });
        });
        
        describe("when constructed with a token", function () {
            beforeEach(function() {                
                opts = {"environment": "t402.livefyre.com",
                        "network": "labs-t402.fyre.co",
                        "siteId": "286470",
                        "articleId": "1111123",
                        "collectionMeta": "tokenstring",
                        "signed": true,
                        "checksum": "check"
                };
                spyOn(createClient, '_request').andReturn($.ajax());
            });

            it("has the correct post data", function () {
                createClient.createCollection(opts, callback);
                var requestType = createClient._request.mostRecentCall.args[0].method;
                var requestData = createClient._request.mostRecentCall.args[0].data;
                expect(requestType).toBe('POST');
                expect(requestData).toBe('{"collectionMeta":"tokenstring","signed":true,"checksum":"check"}');
            });
            
        });
        
        describe("when configured with environment='fyre'", function () {
            var opts, callback;
            beforeEach(function () {
                opts = {"environment": "fyre",
                        "network": "fyre",
                        "siteId": "286470",
                        "articleId": "1111123",
                        "collectionMeta": {
                            "title": 'Media Wall Example',
                            "url": 'http://www.fake.com',
                            "tags": ['test', 'wall']
                        },
                        "signed": false
                };
                callback = jasmine.createSpy();
                spyOn(createClient, '_request').andCallFake(function (opts, errback) {
                    return $.ajax().success(function () {
                        errback(null, {});
                    });
                });
            });
            
            it("requests the correct create collection URL for localdev", function () {
                createClient.createCollection(opts, callback);
                var requestedUrl = createClient._request.mostRecentCall.args[0].url;
                expect(requestedUrl).toBe('http://quill.fyre/api/v3.0/site/286470/collection/create');
            });
        });

        describe("when constructed with opts.protocol=https:", function () {
            var createClient;
            beforeEach(function () {
                createClient = new LivefyreCreateClient({
                    protocol: 'https:'
                });
            });
            it('makes requests to the right URL', function () {
                spyOn(createClient, '_request').andReturn($.ajax());
                var opts = {
                    "network": "blah.fyre.co",
                    "siteId": "286470",
                    "articleId": "1111123",
                    "collectionMeta": {
                        "title": 'Media Wall Example',
                        "url": 'http://www.fake.com',
                        "tags": ['test', 'wall']
                    },
                    "signed": false
                };
                var callback = jasmine.createSpy();
                createClient.createCollection(opts, callback);
                var requestedUrl = createClient._request.mostRecentCall.args[0].url;
                expect(requestedUrl).toBe('https://blah.quill.fyre.co/api/v3.0/site/286470/collection/create');
            });
        });
    }); 
});