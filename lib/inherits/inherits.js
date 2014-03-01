define([], function () {


    /**
     * sub should prototypally inherit from base
     * @param sub {function} Subclass constructor
     * @param base {function} Base class constructor
     */
    function inherits (sub, base) {
        var Fn = function(){};
        Fn.prototype = base.prototype;
        sub.prototype = new Fn();
        sub.prototype.constructor = sub;
    }


    /**
     * sub should parasitically inherit from base
     * that is, we should pluck values from base.prototype onto sub.prototype
     */
    inherits.parasitically = function (sub, base) {
        var baseKeys = inherits.keys(base.prototype),
            baseKeysLength = baseKeys.length,
            methodName;
        for (var i=0; i < baseKeysLength; i++) {
            methodName = baseKeys[i];
            if ( ! sub.prototype[methodName]) {
                sub.prototype[methodName] = base.prototype[methodName];
            }
        }
    };


    /**
     * Object.keys shim
     */
    inherits.keys = Object.keys || (function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
            DontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            DontEnumsLength = DontEnums.length;

        return function (o) {
            if (typeof o != "object" && typeof o != "function" || o === null)
                throw new TypeError("Object.keys called on a non-object");

            var result = [];
            for (var name in o) {
                if (hasOwnProperty.call(o, name))
                    result.push(name);
            }

            if (hasDontEnumBug) {
                for (var i = 0; i < DontEnumsLength; i++) {
                    if (hasOwnProperty.call(o, DontEnums[i]))
                        result.push(DontEnums[i]);
                }
            }

            return result;
        };
    })();

    return inherits;
});