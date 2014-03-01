var util = require('streamhub-editor/util');
var expect = require('chai').expect;

describe('streamhub-editor/util', function() {
    describe('abstractMethod', function() {
        var cls = function(){};
        cls.prototype.test = util.abstractMethod;
        var testFn;

        beforeEach(function() {
            testFn = new cls();
        });

        it('should throw an exception', function() {
            expect(testFn.test).to.throw.exception;
        });

        it('should not throw an exception when overridden', function() {
            testFn.test = function() {
                return 'abc';
            };
            expect(testFn.test).to.not.throw.exception;
            expect(testFn.test()).to.equal('abc');
        });
    });
});
