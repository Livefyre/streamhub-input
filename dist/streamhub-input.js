(function (root, factory) {
    if ((typeof Livefyre === 'object') && (typeof Livefyre.define === 'function') && Livefyre.define.amd) {
        // Livefyre.define is defined by https://github.com/Livefyre/require
        if (Livefyre.require.almond) {
            // mrr
            return Livefyre.define('streamhub-input', factory);
        }
        Livefyre.define([], factory);
    } else if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define([], factory);

    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.Livefyre = root.Livefyre || {};
        root.Livefyre['streamhub-input'] = factory();
    }
}(this, function () {
    //almond, and your modules will be inlined here

/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

define('jquery',[], function(require, exports, module) {/*! jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/
(function(e,t){var n,r,i=typeof t,o=e.location,a=e.document,s=a.documentElement,l=e.jQuery,u=e.$,c={},p=[],f="1.10.2",d=p.concat,h=p.push,g=p.slice,m=p.indexOf,y=c.toString,v=c.hasOwnProperty,b=f.trim,x=function(e,t){return new x.fn.init(e,t,r)},w=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=/\S+/g,C=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,k=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,E=/^[\],:{}\s]*$/,S=/(?:^|:|,)(?:\s*\[)+/g,A=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,j=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,D=/^-ms-/,L=/-([\da-z])/gi,H=function(e,t){return t.toUpperCase()},q=function(e){(a.addEventListener||"load"===e.type||"complete"===a.readyState)&&(_(),x.ready())},_=function(){a.addEventListener?(a.removeEventListener("DOMContentLoaded",q,!1),e.removeEventListener("load",q,!1)):(a.detachEvent("onreadystatechange",q),e.detachEvent("onload",q))};x.fn=x.prototype={jquery:f,constructor:x,init:function(e,n,r){var i,o;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof x?n[0]:n,x.merge(this,x.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:a,!0)),k.test(i[1])&&x.isPlainObject(n))for(i in n)x.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(o=a.getElementById(i[2]),o&&o.parentNode){if(o.id!==i[2])return r.find(e);this.length=1,this[0]=o}return this.context=a,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return g.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(g.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},l=1,u=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},l=2),"object"==typeof s||x.isFunction(s)||(s={}),u===l&&(s=this,--l);u>l;l++)if(null!=(o=arguments[l]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(x.isPlainObject(r)||(n=x.isArray(r)))?(n?(n=!1,a=e&&x.isArray(e)?e:[]):a=e&&x.isPlainObject(e)?e:{},s[i]=x.extend(c,a,r)):r!==t&&(s[i]=r));return s},x.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=l),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){if(e===!0?!--x.readyWait:!x.isReady){if(!a.body)return setTimeout(x.ready);x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(a,[x]),x.fn.trigger&&x(a).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray||function(e){return"array"===x.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?c[y.call(e)]||"object":typeof e},isPlainObject:function(e){var n;if(!e||"object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!v.call(e,"constructor")&&!v.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(r){return!1}if(x.support.ownLast)for(n in e)return v.call(e,n);for(n in e);return n===t||v.call(e,n)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||a;var r=k.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=x.trim(n),n&&E.test(n.replace(A,"@").replace(j,"]").replace(S,"")))?Function("return "+n)():(x.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||x.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&x.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(D,"ms-").replace(L,H)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:b&&!b.call("\ufeff\u00a0")?function(e){return null==e?"":b.call(e)}:function(e){return null==e?"":(e+"").replace(C,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(m)return m.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return d.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),x.isFunction(e)?(r=g.call(arguments,2),i=function(){return e.apply(n||this,r.concat(g.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):t},access:function(e,n,r,i,o,a,s){var l=0,u=e.length,c=null==r;if("object"===x.type(r)){o=!0;for(l in r)x.access(e,n,l,r[l],!0,a,s)}else if(i!==t&&(o=!0,x.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(x(e),n)})),n))for(;u>l;l++)n(e[l],r,s?i:i.call(e[l],l,n(e[l],r)));return o?e:c?n.call(e):u?n(e[0],r):a},now:function(){return(new Date).getTime()},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),x.ready.promise=function(t){if(!n)if(n=x.Deferred(),"complete"===a.readyState)setTimeout(x.ready);else if(a.addEventListener)a.addEventListener("DOMContentLoaded",q,!1),e.addEventListener("load",q,!1);else{a.attachEvent("onreadystatechange",q),e.attachEvent("onload",q);var r=!1;try{r=null==e.frameElement&&a.documentElement}catch(i){}r&&r.doScroll&&function o(){if(!x.isReady){try{r.doScroll("left")}catch(e){return setTimeout(o,50)}_(),x.ready()}}()}return n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){c["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=x(a),function(e,t){var n,r,i,o,a,s,l,u,c,p,f,d,h,g,m,y,v,b="sizzle"+-new Date,w=e.document,T=0,C=0,N=st(),k=st(),E=st(),S=!1,A=function(e,t){return e===t?(S=!0,0):0},j=typeof t,D=1<<31,L={}.hasOwnProperty,H=[],q=H.pop,_=H.push,M=H.push,O=H.slice,F=H.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},B="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",P="[\\x20\\t\\r\\n\\f]",R="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",W=R.replace("w","w#"),$="\\["+P+"*("+R+")"+P+"*(?:([*^$|!~]?=)"+P+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+W+")|)|)"+P+"*\\]",I=":("+R+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+$.replace(3,8)+")*)|.*)\\)|)",z=RegExp("^"+P+"+|((?:^|[^\\\\])(?:\\\\.)*)"+P+"+$","g"),X=RegExp("^"+P+"*,"+P+"*"),U=RegExp("^"+P+"*([>+~]|"+P+")"+P+"*"),V=RegExp(P+"*[+~]"),Y=RegExp("="+P+"*([^\\]'\"]*)"+P+"*\\]","g"),J=RegExp(I),G=RegExp("^"+W+"$"),Q={ID:RegExp("^#("+R+")"),CLASS:RegExp("^\\.("+R+")"),TAG:RegExp("^("+R.replace("w","w*")+")"),ATTR:RegExp("^"+$),PSEUDO:RegExp("^"+I),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+P+"*(even|odd|(([+-]|)(\\d*)n|)"+P+"*(?:([+-]|)"+P+"*(\\d+)|))"+P+"*\\)|)","i"),bool:RegExp("^(?:"+B+")$","i"),needsContext:RegExp("^"+P+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+P+"*((?:-\\d)?\\d*)"+P+"*\\)|)(?=[^-]|$)","i")},K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,et=/^(?:input|select|textarea|button)$/i,tt=/^h\d$/i,nt=/'|\\/g,rt=RegExp("\\\\([\\da-f]{1,6}"+P+"?|("+P+")|.)","ig"),it=function(e,t,n){var r="0x"+t-65536;return r!==r||n?t:0>r?String.fromCharCode(r+65536):String.fromCharCode(55296|r>>10,56320|1023&r)};try{M.apply(H=O.call(w.childNodes),w.childNodes),H[w.childNodes.length].nodeType}catch(ot){M={apply:H.length?function(e,t){_.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function at(e,t,n,i){var o,a,s,l,u,c,d,m,y,x;if((t?t.ownerDocument||t:w)!==f&&p(t),t=t||f,n=n||[],!e||"string"!=typeof e)return n;if(1!==(l=t.nodeType)&&9!==l)return[];if(h&&!i){if(o=Z.exec(e))if(s=o[1]){if(9===l){if(a=t.getElementById(s),!a||!a.parentNode)return n;if(a.id===s)return n.push(a),n}else if(t.ownerDocument&&(a=t.ownerDocument.getElementById(s))&&v(t,a)&&a.id===s)return n.push(a),n}else{if(o[2])return M.apply(n,t.getElementsByTagName(e)),n;if((s=o[3])&&r.getElementsByClassName&&t.getElementsByClassName)return M.apply(n,t.getElementsByClassName(s)),n}if(r.qsa&&(!g||!g.test(e))){if(m=d=b,y=t,x=9===l&&e,1===l&&"object"!==t.nodeName.toLowerCase()){c=mt(e),(d=t.getAttribute("id"))?m=d.replace(nt,"\\$&"):t.setAttribute("id",m),m="[id='"+m+"'] ",u=c.length;while(u--)c[u]=m+yt(c[u]);y=V.test(e)&&t.parentNode||t,x=c.join(",")}if(x)try{return M.apply(n,y.querySelectorAll(x)),n}catch(T){}finally{d||t.removeAttribute("id")}}}return kt(e.replace(z,"$1"),t,n,i)}function st(){var e=[];function t(n,r){return e.push(n+=" ")>o.cacheLength&&delete t[e.shift()],t[n]=r}return t}function lt(e){return e[b]=!0,e}function ut(e){var t=f.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function ct(e,t){var n=e.split("|"),r=e.length;while(r--)o.attrHandle[n[r]]=t}function pt(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function ft(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function dt(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function ht(e){return lt(function(t){return t=+t,lt(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}s=at.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},r=at.support={},p=at.setDocument=function(e){var n=e?e.ownerDocument||e:w,i=n.defaultView;return n!==f&&9===n.nodeType&&n.documentElement?(f=n,d=n.documentElement,h=!s(n),i&&i.attachEvent&&i!==i.top&&i.attachEvent("onbeforeunload",function(){p()}),r.attributes=ut(function(e){return e.className="i",!e.getAttribute("className")}),r.getElementsByTagName=ut(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),r.getElementsByClassName=ut(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),r.getById=ut(function(e){return d.appendChild(e).id=b,!n.getElementsByName||!n.getElementsByName(b).length}),r.getById?(o.find.ID=function(e,t){if(typeof t.getElementById!==j&&h){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){return e.getAttribute("id")===t}}):(delete o.find.ID,o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),o.find.TAG=r.getElementsByTagName?function(e,n){return typeof n.getElementsByTagName!==j?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},o.find.CLASS=r.getElementsByClassName&&function(e,n){return typeof n.getElementsByClassName!==j&&h?n.getElementsByClassName(e):t},m=[],g=[],(r.qsa=K.test(n.querySelectorAll))&&(ut(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||g.push("\\["+P+"*(?:value|"+B+")"),e.querySelectorAll(":checked").length||g.push(":checked")}),ut(function(e){var t=n.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&g.push("[*^$]="+P+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||g.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),g.push(",.*:")})),(r.matchesSelector=K.test(y=d.webkitMatchesSelector||d.mozMatchesSelector||d.oMatchesSelector||d.msMatchesSelector))&&ut(function(e){r.disconnectedMatch=y.call(e,"div"),y.call(e,"[s!='']:x"),m.push("!=",I)}),g=g.length&&RegExp(g.join("|")),m=m.length&&RegExp(m.join("|")),v=K.test(d.contains)||d.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},A=d.compareDocumentPosition?function(e,t){if(e===t)return S=!0,0;var i=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t);return i?1&i||!r.sortDetached&&t.compareDocumentPosition(e)===i?e===n||v(w,e)?-1:t===n||v(w,t)?1:c?F.call(c,e)-F.call(c,t):0:4&i?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return S=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:c?F.call(c,e)-F.call(c,t):0;if(o===a)return pt(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?pt(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},n):f},at.matches=function(e,t){return at(e,null,null,t)},at.matchesSelector=function(e,t){if((e.ownerDocument||e)!==f&&p(e),t=t.replace(Y,"='$1']"),!(!r.matchesSelector||!h||m&&m.test(t)||g&&g.test(t)))try{var n=y.call(e,t);if(n||r.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(i){}return at(t,f,null,[e]).length>0},at.contains=function(e,t){return(e.ownerDocument||e)!==f&&p(e),v(e,t)},at.attr=function(e,n){(e.ownerDocument||e)!==f&&p(e);var i=o.attrHandle[n.toLowerCase()],a=i&&L.call(o.attrHandle,n.toLowerCase())?i(e,n,!h):t;return a===t?r.attributes||!h?e.getAttribute(n):(a=e.getAttributeNode(n))&&a.specified?a.value:null:a},at.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},at.uniqueSort=function(e){var t,n=[],i=0,o=0;if(S=!r.detectDuplicates,c=!r.sortStable&&e.slice(0),e.sort(A),S){while(t=e[o++])t===e[o]&&(i=n.push(o));while(i--)e.splice(n[i],1)}return e},a=at.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=a(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=a(t);return n},o=at.selectors={cacheLength:50,createPseudo:lt,match:Q,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(rt,it),e[3]=(e[4]||e[5]||"").replace(rt,it),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||at.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&at.error(e[0]),e},PSEUDO:function(e){var n,r=!e[5]&&e[2];return Q.CHILD.test(e[0])?null:(e[3]&&e[4]!==t?e[2]=e[4]:r&&J.test(r)&&(n=mt(r,!0))&&(n=r.indexOf(")",r.length-n)-r.length)&&(e[0]=e[0].slice(0,n),e[2]=r.slice(0,n)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(rt,it).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=N[e+" "];return t||(t=RegExp("(^|"+P+")"+e+"("+P+"|$)"))&&N(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=at.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,l){var u,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!l&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[b]||(m[b]={}),u=c[e]||[],d=u[0]===T&&u[1],f=u[0]===T&&u[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[T,d,f];break}}else if(v&&(u=(t[b]||(t[b]={}))[e])&&u[0]===T)f=u[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[b]||(p[b]={}))[e]=[T,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=o.pseudos[e]||o.setFilters[e.toLowerCase()]||at.error("unsupported pseudo: "+e);return r[b]?r(t):r.length>1?(n=[e,e,"",t],o.setFilters.hasOwnProperty(e.toLowerCase())?lt(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=F.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:lt(function(e){var t=[],n=[],r=l(e.replace(z,"$1"));return r[b]?lt(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:lt(function(e){return function(t){return at(e,t).length>0}}),contains:lt(function(e){return function(t){return(t.textContent||t.innerText||a(t)).indexOf(e)>-1}}),lang:lt(function(e){return G.test(e||"")||at.error("unsupported lang: "+e),e=e.replace(rt,it).toLowerCase(),function(t){var n;do if(n=h?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===d},focus:function(e){return e===f.activeElement&&(!f.hasFocus||f.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!o.pseudos.empty(e)},header:function(e){return tt.test(e.nodeName)},input:function(e){return et.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:ht(function(){return[0]}),last:ht(function(e,t){return[t-1]}),eq:ht(function(e,t,n){return[0>n?n+t:n]}),even:ht(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:ht(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:ht(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:ht(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}},o.pseudos.nth=o.pseudos.eq;for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})o.pseudos[n]=ft(n);for(n in{submit:!0,reset:!0})o.pseudos[n]=dt(n);function gt(){}gt.prototype=o.filters=o.pseudos,o.setFilters=new gt;function mt(e,t){var n,r,i,a,s,l,u,c=k[e+" "];if(c)return t?0:c.slice(0);s=e,l=[],u=o.preFilter;while(s){(!n||(r=X.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),l.push(i=[])),n=!1,(r=U.exec(s))&&(n=r.shift(),i.push({value:n,type:r[0].replace(z," ")}),s=s.slice(n.length));for(a in o.filter)!(r=Q[a].exec(s))||u[a]&&!(r=u[a](r))||(n=r.shift(),i.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?at.error(e):k(e,l).slice(0)}function yt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function vt(e,t,n){var r=t.dir,o=n&&"parentNode"===r,a=C++;return t.first?function(t,n,i){while(t=t[r])if(1===t.nodeType||o)return e(t,n,i)}:function(t,n,s){var l,u,c,p=T+" "+a;if(s){while(t=t[r])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[r])if(1===t.nodeType||o)if(c=t[b]||(t[b]={}),(u=c[r])&&u[0]===p){if((l=u[1])===!0||l===i)return l===!0}else if(u=c[r]=[p],u[1]=e(t,n,s)||i,u[1]===!0)return!0}}function bt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,a=[],s=0,l=e.length,u=null!=t;for(;l>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),u&&t.push(s));return a}function wt(e,t,n,r,i,o){return r&&!r[b]&&(r=wt(r)),i&&!i[b]&&(i=wt(i,o)),lt(function(o,a,s,l){var u,c,p,f=[],d=[],h=a.length,g=o||Nt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:xt(g,f,e,s,l),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,l),r){u=xt(y,d),r(u,[],s,l),c=u.length;while(c--)(p=u[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){u=[],c=y.length;while(c--)(p=y[c])&&u.push(m[c]=p);i(null,y=[],u,l)}c=y.length;while(c--)(p=y[c])&&(u=i?F.call(o,p):f[c])>-1&&(o[u]=!(a[u]=p))}}else y=xt(y===a?y.splice(h,y.length):y),i?i(null,a,y,l):M.apply(a,y)})}function Tt(e){var t,n,r,i=e.length,a=o.relative[e[0].type],s=a||o.relative[" "],l=a?1:0,c=vt(function(e){return e===t},s,!0),p=vt(function(e){return F.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==u)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;i>l;l++)if(n=o.relative[e[l].type])f=[vt(bt(f),n)];else{if(n=o.filter[e[l].type].apply(null,e[l].matches),n[b]){for(r=++l;i>r;r++)if(o.relative[e[r].type])break;return wt(l>1&&bt(f),l>1&&yt(e.slice(0,l-1).concat({value:" "===e[l-2].type?"*":""})).replace(z,"$1"),n,r>l&&Tt(e.slice(l,r)),i>r&&Tt(e=e.slice(r)),i>r&&yt(e))}f.push(n)}return bt(f)}function Ct(e,t){var n=0,r=t.length>0,a=e.length>0,s=function(s,l,c,p,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,C=u,N=s||a&&o.find.TAG("*",d&&l.parentNode||l),k=T+=null==C?1:Math.random()||.1;for(w&&(u=l!==f&&l,i=n);null!=(h=N[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,l,c)){p.push(h);break}w&&(T=k,i=++n)}r&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,r&&b!==v){g=0;while(m=t[g++])m(x,y,l,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=q.call(p));y=xt(y)}M.apply(p,y),w&&!s&&y.length>0&&v+t.length>1&&at.uniqueSort(p)}return w&&(T=k,u=C),x};return r?lt(s):s}l=at.compile=function(e,t){var n,r=[],i=[],o=E[e+" "];if(!o){t||(t=mt(e)),n=t.length;while(n--)o=Tt(t[n]),o[b]?r.push(o):i.push(o);o=E(e,Ct(i,r))}return o};function Nt(e,t,n){var r=0,i=t.length;for(;i>r;r++)at(e,t[r],n);return n}function kt(e,t,n,i){var a,s,u,c,p,f=mt(e);if(!i&&1===f.length){if(s=f[0]=f[0].slice(0),s.length>2&&"ID"===(u=s[0]).type&&r.getById&&9===t.nodeType&&h&&o.relative[s[1].type]){if(t=(o.find.ID(u.matches[0].replace(rt,it),t)||[])[0],!t)return n;e=e.slice(s.shift().value.length)}a=Q.needsContext.test(e)?0:s.length;while(a--){if(u=s[a],o.relative[c=u.type])break;if((p=o.find[c])&&(i=p(u.matches[0].replace(rt,it),V.test(s[0].type)&&t.parentNode||t))){if(s.splice(a,1),e=i.length&&yt(s),!e)return M.apply(n,i),n;break}}}return l(e,f)(i,t,!h,n,V.test(e)),n}r.sortStable=b.split("").sort(A).join("")===b,r.detectDuplicates=S,p(),r.sortDetached=ut(function(e){return 1&e.compareDocumentPosition(f.createElement("div"))}),ut(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||ct("type|href|height|width",function(e,n,r){return r?t:e.getAttribute(n,"type"===n.toLowerCase()?1:2)}),r.attributes&&ut(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||ct("value",function(e,n,r){return r||"input"!==e.nodeName.toLowerCase()?t:e.defaultValue}),ut(function(e){return null==e.getAttribute("disabled")})||ct(B,function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&i.specified?i.value:e[n]===!0?n.toLowerCase():null}),x.find=at,x.expr=at.selectors,x.expr[":"]=x.expr.pseudos,x.unique=at.uniqueSort,x.text=at.getText,x.isXMLDoc=at.isXML,x.contains=at.contains}(e);var O={};function F(e){var t=O[e]={};return x.each(e.match(T)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?O[e]||F(e):x.extend({},e);var n,r,i,o,a,s,l=[],u=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=l.length,n=!0;l&&o>a;a++)if(l[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,l&&(u?u.length&&c(u.shift()):r?l=[]:p.disable())},p={add:function(){if(l){var t=l.length;(function i(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&p.has(n)||l.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=l.length:r&&(s=t,c(r))}return this},remove:function(){return l&&x.each(arguments,function(e,t){var r;while((r=x.inArray(t,l,r))>-1)l.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?x.inArray(e,l)>-1:!(!l||!l.length)},empty:function(){return l=[],o=0,this},disable:function(){return l=u=r=t,this},disabled:function(){return!l},lock:function(){return u=t,r||p.disable(),this},locked:function(){return!u},fireWith:function(e,t){return!l||i&&!u||(t=t||[],t=[e,t.slice?t.slice():t],n?u.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var a=o[0],s=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=g.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?g.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,l,u;if(r>1)for(s=Array(r),l=Array(r),u=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(a(t,u,n)).fail(o.reject).progress(a(t,l,s)):--i;return i||o.resolveWith(u,n),o.promise()}}),x.support=function(t){var n,r,o,s,l,u,c,p,f,d=a.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*")||[],r=d.getElementsByTagName("a")[0],!r||!r.style||!n.length)return t;s=a.createElement("select"),u=s.appendChild(a.createElement("option")),o=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t.getSetAttribute="t"!==d.className,t.leadingWhitespace=3===d.firstChild.nodeType,t.tbody=!d.getElementsByTagName("tbody").length,t.htmlSerialize=!!d.getElementsByTagName("link").length,t.style=/top/.test(r.getAttribute("style")),t.hrefNormalized="/a"===r.getAttribute("href"),t.opacity=/^0.5/.test(r.style.opacity),t.cssFloat=!!r.style.cssFloat,t.checkOn=!!o.value,t.optSelected=u.selected,t.enctype=!!a.createElement("form").enctype,t.html5Clone="<:nav></:nav>"!==a.createElement("nav").cloneNode(!0).outerHTML,t.inlineBlockNeedsLayout=!1,t.shrinkWrapBlocks=!1,t.pixelPosition=!1,t.deleteExpando=!0,t.noCloneEvent=!0,t.reliableMarginRight=!0,t.boxSizingReliable=!0,o.checked=!0,t.noCloneChecked=o.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!u.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}o=a.createElement("input"),o.setAttribute("value",""),t.input=""===o.getAttribute("value"),o.value="t",o.setAttribute("type","radio"),t.radioValue="t"===o.value,o.setAttribute("checked","t"),o.setAttribute("name","t"),l=a.createDocumentFragment(),l.appendChild(o),t.appendChecked=o.checked,t.checkClone=l.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip;for(f in x(t))break;return t.ownLast="0"!==f,x(function(){var n,r,o,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",l=a.getElementsByTagName("body")[0];l&&(n=a.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",l.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",o=d.getElementsByTagName("td"),o[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===o[0].offsetHeight,o[0].style.display="",o[1].style.display="none",t.reliableHiddenOffsets=p&&0===o[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",x.swap(l,null!=l.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===d.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(a.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(l.style.zoom=1)),l.removeChild(n),n=d=o=r=null)}),n=s=l=u=r=o=null,t
}({});var B=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,P=/([A-Z])/g;function R(e,n,r,i){if(x.acceptData(e)){var o,a,s=x.expando,l=e.nodeType,u=l?x.cache:e,c=l?e[s]:e[s]&&s;if(c&&u[c]&&(i||u[c].data)||r!==t||"string"!=typeof n)return c||(c=l?e[s]=p.pop()||x.guid++:s),u[c]||(u[c]=l?{}:{toJSON:x.noop}),("object"==typeof n||"function"==typeof n)&&(i?u[c]=x.extend(u[c],n):u[c].data=x.extend(u[c].data,n)),a=u[c],i||(a.data||(a.data={}),a=a.data),r!==t&&(a[x.camelCase(n)]=r),"string"==typeof n?(o=a[n],null==o&&(o=a[x.camelCase(n)])):o=a,o}}function W(e,t,n){if(x.acceptData(e)){var r,i,o=e.nodeType,a=o?x.cache:e,s=o?e[x.expando]:x.expando;if(a[s]){if(t&&(r=n?a[s]:a[s].data)){x.isArray(t)?t=t.concat(x.map(t,x.camelCase)):t in r?t=[t]:(t=x.camelCase(t),t=t in r?[t]:t.split(" ")),i=t.length;while(i--)delete r[t[i]];if(n?!I(r):!x.isEmptyObject(r))return}(n||(delete a[s].data,I(a[s])))&&(o?x.cleanData([e],!0):x.support.deleteExpando||a!=a.window?delete a[s]:a[s]=null)}}}x.extend({cache:{},noData:{applet:!0,embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(e){return e=e.nodeType?x.cache[e[x.expando]]:e[x.expando],!!e&&!I(e)},data:function(e,t,n){return R(e,t,n)},removeData:function(e,t){return W(e,t)},_data:function(e,t,n){return R(e,t,n,!0)},_removeData:function(e,t){return W(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&x.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),x.fn.extend({data:function(e,n){var r,i,o=null,a=0,s=this[0];if(e===t){if(this.length&&(o=x.data(s),1===s.nodeType&&!x._data(s,"parsedAttrs"))){for(r=s.attributes;r.length>a;a++)i=r[a].name,0===i.indexOf("data-")&&(i=x.camelCase(i.slice(5)),$(s,i,o[i]));x._data(s,"parsedAttrs",!0)}return o}return"object"==typeof e?this.each(function(){x.data(this,e)}):arguments.length>1?this.each(function(){x.data(this,e,n)}):s?$(s,e,x.data(s,e)):null},removeData:function(e){return this.each(function(){x.removeData(this,e)})}});function $(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(P,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:B.test(r)?x.parseJSON(r):r}catch(o){}x.data(e,n,r)}else r=t}return r}function I(e){var t;for(t in e)if(("data"!==t||!x.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}x.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=x._data(e,n),r&&(!i||x.isArray(r)?i=x._data(e,n,x.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),a=function(){x.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return x._data(e,n)||x._data(e,n,{empty:x.Callbacks("once memory").add(function(){x._removeData(e,t+"queue"),x._removeData(e,n)})})}}),x.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?x.queue(this[0],e):n===t?this:this.each(function(){var t=x.queue(this,e,n);x._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=x.Deferred(),a=this,s=this.length,l=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=x._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(l));return l(),o.promise(n)}});var z,X,U=/[\t\r\n\f]/g,V=/\r/g,Y=/^(?:input|select|textarea|button|object)$/i,J=/^(?:a|area)$/i,G=/^(?:checked|selected)$/i,Q=x.support.getSetAttribute,K=x.support.input;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return e=x.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,l="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,l=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e;return"boolean"==typeof t&&"string"===n?t?this.addClass(e):this.removeClass(e):x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var t,r=0,o=x(this),a=e.match(T)||[];while(t=a[r++])o.hasClass(t)?o.removeClass(t):o.addClass(t)}else(n===i||"boolean"===n)&&(this.className&&x._data(this,"__className__",this.className),this.className=this.className||e===!1?"":x._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(U," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=x.isFunction(e),this.each(function(n){var o;1===this.nodeType&&(o=i?e.call(this,n,x(this).val()):e,null==o?o="":"number"==typeof o?o+="":x.isArray(o)&&(o=x.map(o,function(e){return null==e?"":e+""})),r=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=x.valHooks[o.type]||x.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(V,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=x.find.attr(e,"value");return null!=t?t:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,l=0>i?s:o?i:0;for(;s>l;l++)if(n=r[l],!(!n.selected&&l!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),a=i.length;while(a--)r=i[a],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,n,r){var o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===i?x.prop(e,n,r):(1===s&&x.isXMLDoc(e)||(n=n.toLowerCase(),o=x.attrHooks[n]||(x.expr.match.bool.test(n)?X:z)),r===t?o&&"get"in o&&null!==(a=o.get(e,n))?a:(a=x.find.attr(e,n),null==a?t:a):null!==r?o&&"set"in o&&(a=o.set(e,r,n))!==t?a:(e.setAttribute(n,r+""),r):(x.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(T);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.bool.test(n)?K&&Q||!G.test(n)?e[r]=!1:e[x.camelCase("default-"+n)]=e[r]=!1:x.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!x.isXMLDoc(e),a&&(n=x.propFix[n]||n,o=x.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var t=x.find.attr(e,"tabindex");return t?parseInt(t,10):Y.test(e.nodeName)||J.test(e.nodeName)&&e.href?0:-1}}}}),X={set:function(e,t,n){return t===!1?x.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&x.propFix[n]||n,n):e[x.camelCase("default-"+n)]=e[n]=!0,n}},x.each(x.expr.match.bool.source.match(/\w+/g),function(e,n){var r=x.expr.attrHandle[n]||x.find.attr;x.expr.attrHandle[n]=K&&Q||!G.test(n)?function(e,n,i){var o=x.expr.attrHandle[n],a=i?t:(x.expr.attrHandle[n]=t)!=r(e,n,i)?n.toLowerCase():null;return x.expr.attrHandle[n]=o,a}:function(e,n,r){return r?t:e[x.camelCase("default-"+n)]?n.toLowerCase():null}}),K&&Q||(x.attrHooks.value={set:function(e,n,r){return x.nodeName(e,"input")?(e.defaultValue=n,t):z&&z.set(e,n,r)}}),Q||(z={set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},x.expr.attrHandle.id=x.expr.attrHandle.name=x.expr.attrHandle.coords=function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&""!==i.value?i.value:null},x.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&r.specified?r.value:t},set:z.set},x.attrHooks.contenteditable={set:function(e,t,n){z.set(e,""===t?!1:t,n)}},x.each(["width","height"],function(e,n){x.attrHooks[n]={set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}}})),x.support.hrefNormalized||x.each(["href","src"],function(e,t){x.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}}),x.support.style||(x.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.support.enctype||(x.propFix.enctype="encoding"),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,n){return x.isArray(n)?e.checked=x.inArray(x(e).val(),n)>=0:t}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}function at(){try{return a.activeElement}catch(e){}}x.event={global:{},add:function(e,n,r,o,a){var s,l,u,c,p,f,d,h,g,m,y,v=x._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=x.guid++),(l=v.events)||(l=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof x===i||e&&x.event.triggered===e.type?t:x.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(T)||[""],u=n.length;while(u--)s=rt.exec(n[u])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),g&&(p=x.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=x.event.special[g]||{},d=x.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&x.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=l[g])||(h=l[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),x.event.global[g]=!0);e=null}},remove:function(e,t,n,r,i){var o,a,s,l,u,c,p,f,d,h,g,m=x.hasData(e)&&x._data(e);if(m&&(c=m.events)){t=(t||"").match(T)||[""],u=t.length;while(u--)if(s=rt.exec(t[u])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=x.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),l=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));l&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||x.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)x.event.remove(e,d+t[u],n,r,!0);x.isEmptyObject(c)&&(delete m.handle,x._removeData(e,"events"))}},trigger:function(n,r,i,o){var s,l,u,c,p,f,d,h=[i||a],g=v.call(n,"type")?n.type:n,m=v.call(n,"namespace")?n.namespace.split("."):[];if(u=f=i=i||a,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+x.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),l=0>g.indexOf(":")&&"on"+g,n=n[x.expando]?n:new x.Event(g,"object"==typeof n&&n),n.isTrigger=o?2:3,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:x.makeArray(r,[n]),p=x.event.special[g]||{},o||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!o&&!p.noBubble&&!x.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(u=u.parentNode);u;u=u.parentNode)h.push(u),f=u;f===(i.ownerDocument||a)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((u=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(x._data(u,"events")||{})[n.type]&&x._data(u,"handle"),s&&s.apply(u,r),s=l&&u[l],s&&x.acceptData(u)&&s.apply&&s.apply(u,r)===!1&&n.preventDefault();if(n.type=g,!o&&!n.isDefaultPrevented()&&(!p._default||p._default.apply(h.pop(),r)===!1)&&x.acceptData(i)&&l&&i[g]&&!x.isWindow(i)){f=i[l],f&&(i[l]=null),x.event.triggered=g;try{i[g]()}catch(y){}x.event.triggered=t,f&&(i[l]=f)}return n.result}},dispatch:function(e){e=x.event.fix(e);var n,r,i,o,a,s=[],l=g.call(arguments),u=(x._data(this,"events")||{})[e.type]||[],c=x.event.special[e.type]||{};if(l[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((x.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,l),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],l=n.delegateCount,u=e.target;if(l&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!=this;u=u.parentNode||this)if(1===u.nodeType&&(u.disabled!==!0||"click"!==e.type)){for(o=[],a=0;l>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?x(r,this).index(u)>=0:x.find(r,this,null,[u]).length),o[r]&&o.push(i);o.length&&s.push({elem:u,handlers:o})}return n.length>l&&s.push({elem:this,handlers:n.slice(l)}),s},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,o=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new x.Event(o),t=r.length;while(t--)n=r[t],e[n]=o[n];return e.target||(e.target=o.srcElement||a),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,o):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,o,s=n.button,l=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||a,o=i.documentElement,r=i.body,e.pageX=n.clientX+(o&&o.scrollLeft||r&&r.scrollLeft||0)-(o&&o.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(o&&o.scrollTop||r&&r.scrollTop||0)-(o&&o.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&l&&(e.relatedTarget=l===e.target?n.toElement:l),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==at()&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===at()&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},click:{trigger:function(){return x.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=a.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},x.Event=function(e,n){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&x.extend(this,n),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,t):new x.Event(e,n)},x.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.submitBubbles||(x.event.special.submit={setup:function(){return x.nodeName(this,"form")?!1:(x.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=x.nodeName(n,"input")||x.nodeName(n,"button")?n.form:t;r&&!x._data(r,"submitBubbles")&&(x.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),x._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&x.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return x.nodeName(this,"form")?!1:(x.event.remove(this,"._submit"),t)}}),x.support.changeBubbles||(x.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(x.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),x.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),x.event.simulate("change",this,e,!0)})),!1):(x.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!x._data(t,"changeBubbles")&&(x.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||x.event.simulate("change",this.parentNode,e,!0)}),x._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return x.event.remove(this,"._change"),!Z.test(this.nodeName)}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&a.addEventListener(e,r,!0)},teardown:function(){0===--n&&a.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return x().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=x.guid++)),this.each(function(){x.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,x(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){x.event.remove(this,e,r,n)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?x.event.trigger(e,n,r,!0):t}});var st=/^.[^:#\[\.,]*$/,lt=/^(?:parents|prev(?:Until|All))/,ut=x.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n=[],r=this,i=r.length;if("string"!=typeof e)return this.pushStack(x(e).filter(function(){for(t=0;i>t;t++)if(x.contains(r[t],this))return!0}));for(t=0;i>t;t++)x.find(e,r[t],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=this.selector?this.selector+" "+e:e,n},has:function(e){var t,n=x(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(x.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e||[],!0))},filter:function(e){return this.pushStack(ft(this,e||[],!1))},is:function(e){return!!ft(this,"string"==typeof e&&ut.test(e)?x(e):e||[],!1).length},closest:function(e,t){var n,r=0,i=this.length,o=[],a=ut.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(a?a.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?x.inArray(this[0],x(e)):x.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return x.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(ct[e]||(i=x.unique(i)),lt.test(e)&&(i=i.reverse())),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!x(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(st.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return x.inArray(e,t)>=0!==n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Ct=/^(?:checkbox|radio)$/i,Nt=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:x.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(a),Dt=jt.appendChild(a.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===t?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||a).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(Ft(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&_t(Ft(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&x.cleanData(Ft(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&x.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!x.support.htmlSerialize&&mt.test(e)||!x.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(x.cleanData(Ft(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(r&&r.parentNode!==i&&(r=this.nextSibling),x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=d.apply([],e);var r,i,o,a,s,l,u=0,c=this.length,p=this,f=c-1,h=e[0],g=x.isFunction(h);if(g||!(1>=c||"string"!=typeof h||x.support.checkClone)&&Nt.test(h))return this.each(function(r){var i=p.eq(r);g&&(e[0]=h.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(l=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),r=l.firstChild,1===l.childNodes.length&&(l=r),r)){for(a=x.map(Ft(l,"script"),Ht),o=a.length;c>u;u++)i=l,u!==f&&(i=x.clone(i,!0,!0),o&&x.merge(a,Ft(i,"script"))),t.call(this[u],i,u);if(o)for(s=a[a.length-1].ownerDocument,x.map(a,qt),u=0;o>u;u++)i=a[u],kt.test(i.type||"")&&!x._data(i,"globalEval")&&x.contains(s,i)&&(i.src?x._evalUrl(i.src):x.globalEval((i.text||i.textContent||i.innerHTML||"").replace(St,"")));l=r=null}return this}});function Lt(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function Ht(e){return e.type=(null!==x.find.attr(e,"type"))+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function _t(e,t){var n,r=0;for(;null!=(n=e[r]);r++)x._data(n,"globalEval",!t||x._data(t[r],"globalEval"))}function Mt(e,t){if(1===t.nodeType&&x.hasData(e)){var n,r,i,o=x._data(e),a=x._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)x.event.add(t,n,s[n][r])}a.data&&(a.data=x.extend({},a.data))}}function Ot(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!x.support.noCloneEvent&&t[x.expando]){i=x._data(t);for(r in i.events)x.removeEvent(t,r,i.handle);t.removeAttribute(x.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),x.support.html5Clone&&e.innerHTML&&!x.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Ct.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=0,i=[],o=x(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),x(o[r])[t](n),h.apply(i,n.get());return this.pushStack(i)}});function Ft(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||x.nodeName(o,n)?s.push(o):x.merge(s,Ft(o,n));return n===t||n&&x.nodeName(e,n)?x.merge([e],s):s}function Bt(e){Ct.test(e.type)&&(e.defaultChecked=e.checked)}x.extend({clone:function(e,t,n){var r,i,o,a,s,l=x.contains(e.ownerDocument,e);if(x.support.html5Clone||x.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(x.support.noCloneEvent&&x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(r=Ft(o),s=Ft(e),a=0;null!=(i=s[a]);++a)r[a]&&Ot(i,r[a]);if(t)if(n)for(s=s||Ft(e),r=r||Ft(o),a=0;null!=(i=s[a]);a++)Mt(i,r[a]);else Mt(e,o);return r=Ft(o,"script"),r.length>0&&_t(r,!l&&Ft(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,l,u,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===x.type(o))x.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),l=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[l]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!x.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!x.support.tbody){o="table"!==l||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)x.nodeName(u=o.childNodes[i],"tbody")&&!u.childNodes.length&&o.removeChild(u)}x.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),x.support.appendChecked||x.grep(Ft(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===x.inArray(o,r))&&(a=x.contains(o.ownerDocument,o),s=Ft(f.appendChild(o),"script"),a&&_t(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,l=x.expando,u=x.cache,c=x.support.deleteExpando,f=x.event.special;for(;null!=(n=e[s]);s++)if((t||x.acceptData(n))&&(o=n[l],a=o&&u[o])){if(a.events)for(r in a.events)f[r]?x.event.remove(n,r):x.removeEvent(n,r,a.handle);
u[o]&&(delete u[o],c?delete n[l]:typeof n.removeAttribute!==i?n.removeAttribute(l):n[l]=null,p.push(o))}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})}}),x.fn.extend({wrapAll:function(e){if(x.isFunction(e))return this.each(function(t){x(this).wrapAll(e.call(this,t))});if(this[0]){var t=x(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+w+")(.*)$","i"),Yt=RegExp("^("+w+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+w+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=x._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=x._data(r,"olddisplay",ln(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&x._data(r,"olddisplay",i?n:x.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}x.fn.extend({css:function(e,n){return x.access(this,function(e,n,r){var i,o,a={},s=0;if(x.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=x.css(e,n[s],!1,o);return a}return r!==t?x.style(e,n,r):x.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){nn(this)?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":x.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,l=x.camelCase(n),u=e.style;if(n=x.cssProps[l]||(x.cssProps[l]=tn(u,l)),s=x.cssHooks[n]||x.cssHooks[l],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:u[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(x.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||x.cssNumber[l]||(r+="px"),x.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(u[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{u[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,l=x.camelCase(n);return n=x.cssProps[l]||(x.cssProps[l]=tn(e.style,l)),s=x.cssHooks[n]||x.cssHooks[l],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||x.isNumeric(o)?o||0:a):a}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s.getPropertyValue(n)||s[n]:t,u=e.style;return s&&(""!==l||x.contains(e.ownerDocument,e)||(l=x.style(e,n)),Yt.test(l)&&Ut.test(n)&&(i=u.width,o=u.minWidth,a=u.maxWidth,u.minWidth=u.maxWidth=u.width=l,l=s.width,u.width=i,u.minWidth=o,u.maxWidth=a)),l}):a.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s[n]:t,u=e.style;return null==l&&u&&u[n]&&(l=u[n]),Yt.test(l)&&!zt.test(n)&&(i=u.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),u.left="fontSize"===n?"1em":l,l=u.pixelLeft+"px",u.left=i,a&&(o.left=a)),""===l?"auto":l});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=x.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=x.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=x.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=x.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=x.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function ln(e){var t=a,n=Gt[e];return n||(n=un(e,t),"none"!==n&&n||(Pt=(Pt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=un(e,t),Pt.detach()),Gt[e]=n),n}function un(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,n){x.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(x.css(e,"display"))?x.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x.support.opacity||(x.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=x.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===x.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,n){return n?x.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,n){x.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?x(e).position()[n]+"px":r):t}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!x.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||x.css(e,"display"))},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(x.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Ct.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),x.param=function(e,n){var r,i=[],o=function(e,t){t=x.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var mn,yn,vn=x.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Cn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Nn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=x.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=o.href}catch(Ln){yn=a.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(T)||[];if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(l){var u;return o[l]=!0,x.each(e[l]||[],function(e,l){var c=l(n,r,i);return"string"!=typeof c||a||o[c]?a?!(u=c):t:(n.dataTypes.unshift(c),s(c),!1)}),u}return s(n.dataTypes[0])||!o["*"]&&s("*")}function _n(e,n){var r,i,o=x.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,l=e.indexOf(" ");return l>=0&&(i=e.slice(l,e.length),e=e.slice(0,l)),x.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&x.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?x("<div>").append(x.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Cn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?_n(_n(e,x.ajaxSettings),t):_n(x.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,l,u,c,p=x.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?x(f):x.event,h=x.Deferred(),g=x.Callbacks("once memory"),m=p.statusCode||{},y={},v={},b=0,w="canceled",C={readyState:0,getResponseHeader:function(e){var t;if(2===b){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===b?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return b||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return b||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>b)for(t in e)m[t]=[m[t],e[t]];else C.always(e[C.status]);return this},abort:function(e){var t=e||w;return u&&u.abort(t),k(0,t),this}};if(h.promise(C).complete=g.add,C.success=C.done,C.error=C.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=x.trim(p.dataType||"*").toLowerCase().match(T)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?"80":"443"))===(mn[3]||("http:"===mn[1]?"80":"443")))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=x.param(p.data,p.traditional)),qn(An,p,n,C),2===b)return C;l=p.global,l&&0===x.active++&&x.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Nn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(x.lastModified[o]&&C.setRequestHeader("If-Modified-Since",x.lastModified[o]),x.etag[o]&&C.setRequestHeader("If-None-Match",x.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&C.setRequestHeader("Content-Type",p.contentType),C.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)C.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,C,p)===!1||2===b))return C.abort();w="abort";for(i in{success:1,error:1,complete:1})C[i](p[i]);if(u=qn(jn,p,n,C)){C.readyState=1,l&&d.trigger("ajaxSend",[C,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){C.abort("timeout")},p.timeout));try{b=1,u.send(y,k)}catch(N){if(!(2>b))throw N;k(-1,N)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,N=n;2!==b&&(b=2,s&&clearTimeout(s),u=t,a=i||"",C.readyState=e>0?4:0,c=e>=200&&300>e||304===e,r&&(w=Mn(p,C,r)),w=On(p,w,C,c),c?(p.ifModified&&(T=C.getResponseHeader("Last-Modified"),T&&(x.lastModified[o]=T),T=C.getResponseHeader("etag"),T&&(x.etag[o]=T)),204===e||"HEAD"===p.type?N="nocontent":304===e?N="notmodified":(N=w.state,y=w.data,v=w.error,c=!v)):(v=N,(e||!N)&&(N="error",0>e&&(e=0))),C.status=e,C.statusText=(n||N)+"",c?h.resolveWith(f,[y,N,C]):h.rejectWith(f,[C,N,v]),C.statusCode(m),m=t,l&&d.trigger(c?"ajaxSuccess":"ajaxError",[C,p,c?y:v]),g.fireWith(f,[C,N]),l&&(d.trigger("ajaxComplete",[C,p]),--x.active||x.event.trigger("ajaxStop")))}return C},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,n){return x.get(e,t,n,"script")}}),x.each(["get","post"],function(e,n){x[n]=function(e,r,i,o){return x.isFunction(r)&&(o=o||i,i=r,r=t),x.ajax({url:e,type:n,dataType:o,data:r,success:i})}});function Mn(e,n,r){var i,o,a,s,l=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in l)if(l[s]&&l[s].test(o)){u.unshift(s);break}if(u[0]in r)a=u[0];else{for(s in r){if(!u[0]||e.converters[s+" "+u[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==u[0]&&u.unshift(a),r[a]):t}function On(e,t,n,r){var i,o,a,s,l,u={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)u[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!l&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),l=o,o=c.shift())if("*"===o)o=l;else if("*"!==l&&l!==o){if(a=u[l+" "+o]||u["* "+o],!a)for(i in u)if(s=i.split(" "),s[1]===o&&(a=u[l+" "+s[0]]||u["* "+s[0]])){a===!0?a=u[i]:u[i]!==!0&&(o=s[0],c.unshift(s[1]));break}if(a!==!0)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(p){return{state:"parsererror",error:a?p:"No conversion from "+l+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),x.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=a.head||x("head")[0]||a.documentElement;return{send:function(t,i){n=a.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var Fn=[],Bn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Fn.pop()||x.expando+"_"+vn++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,l=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return l||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=x.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,l?n[l]=n[l].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||x.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,Fn.push(o)),s&&x.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}x.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=x.ajaxSettings.xhr(),x.support.cors=!!Rn&&"withCredentials"in Rn,Rn=x.support.ajax=!!Rn,Rn&&x.ajaxTransport(function(n){if(!n.crossDomain||x.support.cors){var r;return{send:function(i,o){var a,s,l=n.xhr();if(n.username?l.open(n.type,n.url,n.async,n.username,n.password):l.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)l[s]=n.xhrFields[s];n.mimeType&&l.overrideMimeType&&l.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)l.setRequestHeader(s,i[s])}catch(u){}l.send(n.hasContent&&n.data||null),r=function(e,i){var s,u,c,p;try{if(r&&(i||4===l.readyState))if(r=t,a&&(l.onreadystatechange=x.noop,$n&&delete Pn[a]),i)4!==l.readyState&&l.abort();else{p={},s=l.status,u=l.getAllResponseHeaders(),"string"==typeof l.responseText&&(p.text=l.responseText);try{c=l.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,u)},n.async?4===l.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},x(e).unload($n)),Pn[a]=r),l.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+w+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n=this.createTween(e,t),r=n.cur(),i=Yn.exec(t),o=i&&i[3]||(x.cssNumber[e]?"":"px"),a=(x.cssNumber[e]||"px"!==o&&+r)&&Yn.exec(x.css(n.elem,e)),s=1,l=20;if(a&&a[3]!==o){o=o||a[3],i=i||[],a=+r||1;do s=s||".5",a/=s,x.style(n.elem,e,a+o);while(s!==(s=n.cur()/r)&&1!==s&&--l)}return i&&(a=n.start=+a||+r||0,n.unit=o,n.end=i[1]?a+(i[1]+1)*i[2]:+i[2]),n}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=x.now()}function Zn(e,t,n){var r,i=(Qn[t]||[]).concat(Qn["*"]),o=0,a=i.length;for(;a>o;o++)if(r=i[o].call(n,t,e))return r}function er(e,t,n){var r,i,o=0,a=Gn.length,s=x.Deferred().always(function(){delete l.elem}),l=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,u.startTime+u.duration-t),r=n/u.duration||0,o=1-r,a=0,l=u.tweens.length;for(;l>a;a++)u.tweens[a].run(o);return s.notifyWith(e,[u,o,n]),1>o&&l?n:(s.resolveWith(e,[u]),!1)},u=s.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,u.opts,t,n,u.opts.specialEasing[t]||u.opts.easing);return u.tweens.push(r),r},stop:function(t){var n=0,r=t?u.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)u.tweens[n].run(1);return t?s.resolveWith(e,[u,t]):s.rejectWith(e,[u,t]),this}}),c=u.props;for(tr(c,u.opts.specialEasing);a>o;o++)if(r=Gn[o].call(u,e,c,u.opts))return r;return x.map(c,Zn,u),x.isFunction(u.opts.start)&&u.opts.start.call(e,u),x.fx.timer(x.extend(l,{elem:e,anim:u,queue:u.opts.queue})),u.progress(u.opts.progress).done(u.opts.done,u.opts.complete).fail(u.opts.fail).always(u.opts.always)}function tr(e,t){var n,r,i,o,a;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),a=x.cssHooks[r],a&&"expand"in a){o=a.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(er,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,l,u=this,c={},p=e.style,f=e.nodeType&&nn(e),d=x._data(e,"fxshow");n.queue||(s=x._queueHooks(e,"fx"),null==s.unqueued&&(s.unqueued=0,l=s.empty.fire,s.empty.fire=function(){s.unqueued||l()}),s.unqueued++,u.always(function(){u.always(function(){s.unqueued--,x.queue(e,"fx").length||s.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(x.support.inlineBlockNeedsLayout&&"inline"!==ln(e.nodeName)?p.zoom=1:p.display="inline-block")),n.overflow&&(p.overflow="hidden",x.support.shrinkWrapBlocks||u.always(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t)if(i=t[r],Vn.exec(i)){if(delete t[r],o=o||"toggle"===i,i===(f?"hide":"show"))continue;c[r]=d&&d[r]||x.style(e,r)}if(!x.isEmptyObject(c)){d?"hidden"in d&&(f=d.hidden):d=x._data(e,"fxshow",{}),o&&(d.hidden=!f),f?x(e).show():u.done(function(){x(e).hide()}),u.done(function(){var t;x._removeData(e,"fxshow");for(t in c)x.style(e,t,c[t])});for(r in c)a=Zn(f?d[r]:0,r,u),r in d||(d[r]=a.start,f&&(a.end=a.start,a.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}x.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),a=function(){var t=er(this,x.extend({},e),o);(i||x._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=x.timers,a=x._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=x._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,a=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.stop&&i.stop.call(this,!0),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=rr.prototype.init,x.fx.tick=function(){var e,n=x.timers,r=0;for(Xn=x.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||x.fx.stop(),Xn=t},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){Un||(Un=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(Un),Un=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){x.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,x.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},x.offset={setOffset:function(e,t,n){var r=x.css(e,"position");"static"===r&&(e.style.position="relative");var i=x(e),o=i.offset(),a=x.css(e,"top"),s=x.css(e,"left"),l=("absolute"===r||"fixed"===r)&&x.inArray("auto",[a,s])>-1,u={},c={},p,f;l?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),x.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(u.top=t.top-o.top+p),null!=t.left&&(u.left=t.left-o.left+f),"using"in t?t.using.call(e,u):i.css(u)}},x.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===x.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(n=e.offset()),n.top+=x.css(e[0],"borderTopWidth",!0),n.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-x.css(r,"marginTop",!0),left:t.left-n.left-x.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);x.fn[e]=function(i){return x.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?x(a).scrollLeft():o,r?o:x(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return x.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}x.each({Height:"height",Width:"width"},function(e,n){x.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){x.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return x.access(this,function(n,r,i){var o;return x.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?x.css(n,r,s):x.style(n,r,i,s)},n,a?i:t,a,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&module&&"object"==typeof module.exports?module.exports=x:(e.jQuery=e.$=x,"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}))})(window);
});
define('inherits',[], function () {


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
define('streamhub-sdk/jquery/jquery',['jquery'], function($) {
    

    /**
     * Cross domain requests in IE8/9 fail. Here is a patch for that.
     * AJAX POST request on IE fails with error “No Transport”: http://stackoverflow.com/q/15418290
     */
    if (!$.support.cors && window.XDomainRequest) {
        var httpRegEx = /^https?:\/\//i;
        var getOrPostRegEx = /^get|post$/i;
        var sameSchemeRegEx = new RegExp('^'+location.protocol, 'i');
        var xmlRegEx = /\/xml/i;
        var XDomainRequest = window.XDomainRequest;
        var ActiveXObject = window.ActiveXObject;

        // ajaxTransport exists in jQuery 1.5+
        $.ajaxTransport('text html xml json', function(options, userOptions, jqXHR) {
            // XDomainRequests must be: asynchronous, GET or POST methods, HTTP or HTTPS protocol, and same scheme as calling page
            if (options.crossDomain && options.async && getOrPostRegEx.test(options.type) && httpRegEx.test(userOptions.url) && sameSchemeRegEx.test(userOptions.url)) {
                var xdr = null;
                var userType = (userOptions.dataType||'').toLowerCase();
                
                return {
                    send: function(headers, complete) {
                        xdr = new XDomainRequest();
                        
                        if (/^\d+$/.test(userOptions.timeout)) {
                            xdr.timeout = userOptions.timeout;
                        }
                        
                        xdr.ontimeout = function(){
                            complete(500, 'timeout');
                        };
                        
                        xdr.onload = function() {
                            var allResponseHeaders = 'Content-Length: ' + xdr.responseText.length + '\r\nContent-Type: ' + xdr.contentType;
                            var status = {
                                code: 200,
                                message: 'success'
                            };
                            var responses = {
                                text: xdr.responseText
                            };
    
                            try {
                                if (userType === 'json') {
                                    try {
                                        responses.json = JSON.parse(xdr.responseText);
                                    } catch(e) {
                                        status.code = 500;
                                        status.message = 'parseerror';
                                        //throw 'Invalid JSON: ' + xdr.responseText;
                                    }
                                } else if ((userType === 'xml') || ((userType !== 'text') && xmlRegEx.test(xdr.contentType))) {
                                    var doc = new ActiveXObject('Microsoft.XMLDOM');
                                    doc.async = false;
                                    try {
                                        doc.loadXML(xdr.responseText);
                                    } catch(e) {
                                        doc = undefined;
                                    }
                                    if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) {
                                        status.code = 500;
                                        status.message = 'parseerror';
                                        throw 'Invalid XML: ' + xdr.responseText;
                                    }
                                    responses.xml = doc;
                                }
                            } catch(parseMessage) {
                                throw parseMessage;
                            } finally {
                                complete(status.code, status.message, responses, allResponseHeaders);
                            }
                        };
                        
                        xdr.onerror = function(){
                            complete(500, 'error', {
                                text: xdr.responseText
                            });
                        };
                        xdr.open(options.type, options.url);

                        xdr.onprogress = function () {};

                        if (userOptions.data && options.type === 'POST') {
                            var data = userOptions.data;
                            if (typeof(data) === 'object') {
                                data = $.param(data);
                            }

                            xdr.send(data);
                        } else {
                            xdr.send();
                        }
                    },
                    abort: function() {
                        if (xdr) {
                            xdr.abort();
                        }
                    }
                };
            }
        });
    }

    return $;
});

define('streamhub-sdk/jquery', ['streamhub-sdk/jquery/jquery'], function (main) { return main; });

define('view/event-map',['require','exports','module'],function (require, exports, module) {

/**
 * An extensible object that maps event selectors to callback functions
 * @param events {Object} - Initial event mapping
 */
function EventMap (events) {
    this._factories = [];
    extend(this, [events]);
}

/**
 * Return another EventMap that has been extended with
 * the provided objects
 * @param {...object} extensions - Objects to extend from
 * @returns {EventMap} - A new EventMap, extended from this and others
 */
EventMap.prototype.extended = function () {
    var newMap = new EventMap(this);
    var extensions = [].slice.apply(arguments);
    extend(newMap, extensions);
    return newMap;
};

/**
 * Evaluate the EventMap with a particular context
 * Any ._factories will be called so that `this` is the provided context
 * @returns {object} object mapping event strings/selectors to callback functions
 */
EventMap.prototype.withContext = function (context) {
    var contextualExtensions = [];
    var factory;
    var theseEvents;
    var events = {};
    for (var i=0, numFactories=this._factories.length; i < numFactories; i++) {
        factory = this._factories[i];
        theseEvents = {};
        contextualExtensions.push(factory.call(context, theseEvents) || theseEvents);
    }
    extend(events, [this].concat(contextualExtensions));
    return events;
};

/**
 * Extend the first argument with keys from the rest, left to right
 * Only extends ownProperties (unlike $.extend)
 * @param {object} target - Target Object to extend
 * @param {object[]} extensions - Array of Objects to extend from
 */
function extend (target, extensions) {
    var copy, name, extension, extensionsLength;
    target = target || {},
    extensions = extensions || [];
    extensionsLength = extensions.length;

    for (var i=0; i < extensionsLength; i++) {
        // Only deal with non-undefined values
        if ((extension = extensions[i]) !== undefined) {
            // If it's a function, store in target._factories
            if (typeof extension === 'function') {
                target._factories.push(extension);
                continue;
            }
            // Extend the base object
            for (name in extension) {
                if ( ! extension.hasOwnProperty(name)) {
                    continue;
                }
                copy = extension[name];

                // Copy _factories array
                if (name === '_factories' && copy.slice) {
                    copy = copy.slice();
                }

                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }

                if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
}

module.exports = EventMap;

});

define('view/delegate',['require','exports','module','jquery','view/event-map'],function (require, exports, module) {/**
 * @fileOverview Delegate utils.
 */
var $ = require('jquery');
var EventMap = require('view/event-map');

/** @const {string} */
var EVENT_ANTENNA = '.delegateEvents';

/** @const {RegExp} */
var EVENT_SPLITTER = /^(\S+)\s*(.*)$/;

/** @type {number} */
var idCounts = 0;

/**
 * Delegate events. Binds a listener for all events onto the $antenna. The
 * uniqueId is used as a way to access them later.
 * @param {jQuery} $antenna
 * @param {Object.<string, string|function>} events
 * @param {string} uniqueId
 * @param {Object} context
 */
function delegateEvents($antenna, events, uniqueId, context) {
    undelegateEvents($antenna, uniqueId);
    if (events instanceof EventMap) {
        events = events.withContext(context);
    }
    for (var key in events) {
        if (events.hasOwnProperty(key)) {
            var method = events[key];
            if (typeof method === 'string') {
                method = context[method];
            }
            if (!method) {
                throw "Undefined method for: " + key;
            }
            method = $.proxy(method, context);

            var match = key.match(EVENT_SPLITTER);
            if (!match) {
                throw "Invalid event/selector pair: " + key;
            }
            var eventName = match[1];
            var selector = match[2];
            eventName += EVENT_ANTENNA + uniqueId;
            if (selector === '') {
                $antenna.on(eventName, method);
            } else {
                $antenna.on(eventName, selector, method);
            }
        }
    }
}

/**
 * Get a unique Id
 * @return {string}
 */
function getUniqueId () {
    return ++idCounts + '';
}

/**
 * Undelegate events. Removes all events from the provided antenna jQuery
 * element. Uses the uniqueId as a way of grabbing all delegated events.
 * @param {jQuery} $antenna The antenna element.
 * @param {string} uniqueId The id that all events are using.
 */
function undelegateEvents($antenna, uniqueId) {
    $antenna.off(EVENT_ANTENNA + uniqueId);
}

module.exports = {
    delegateEvents: delegateEvents,
    getUniqueId: getUniqueId,
    undelegateEvents: undelegateEvents
};

});

define('event-emitter',[],function() {

    var slice = Array.prototype.slice;


    /**
     * Defines the base class for all event emitting objects to extend.
     * @exports streamhub-sdk/event-emitter
     * @constructor
     */
    var EventEmitter = function() {
        this._listeners = {};
    };


    EventEmitter.listenerCount = function (emitter, eventName) {
        var listeners = emitter._listeners[eventName];
        if ( ! listeners) {
            return 0;
        }
        return listeners.length;
    };


    /**
     * Binds a listener function to an event name.
     * @param name {string} The event name to bind to.
     * @param fn {function} The callback function to call whenever the event is emitted.
     * @returns {EventEmitter} Returns 'this' for chaining
     */
    EventEmitter.prototype.on = function(name, fn) {
        this._listeners[name] = this._listeners[name] || [];
        this._listeners[name].push(fn);
        return this;
    };
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;


    EventEmitter.prototype.once = function (name, fn) {
        function doAndRemoveListener () {
            this.removeListener(name, doAndRemoveListener);
            fn.apply(this, arguments);
        }
        // Store original listener
        doAndRemoveListener.listener = fn;
        return this.on(name, doAndRemoveListener);
    };


    /**
     * Removes a bound listener from the named event.
     * @param name {string} The name of the event to remove this listener from.
     * @param fn {function} The original callback function to remove.
     */
    EventEmitter.prototype.removeListener = function(name, fn) {
        if (fn && this._listeners[name]) {
            this._listeners[name].splice(indexOf(this._listeners[name], fn), 1);
        }
    };


    /**
     * Emits an event from the object this is called on. Iterates through bound
     * listeners and passes through the arguments emit was called with.
     * @param name {string} The name of the event to emit.
     * @param {...Object} Optional arguments to pass to each listener's callback.
     */
    EventEmitter.prototype.emit = function(name) {
        var listeners = this._listeners[name] || [],
            args = slice.call(arguments, 1),
            err;

        // Copy listeners in case executing them mutates the array
        // e.g. .once() listeners remove themselves
        if (listeners.length) {
            listeners = listeners.slice();
        }
        
        // Throw on error event if there are no listeners
        if (name === 'error' && ! listeners.length) {
            err = args[0];
            if (err instanceof Error) {
                throw err;
            } else {
                throw TypeError('Uncaught, unspecified "error" event');
            }
        }

        for (var i=0, numListeners=listeners.length; i < numListeners; i++) {
            try {
                listeners[i].apply(this, args); 
            } catch(err) {
                this.emit('error', err);
            }
        }
    };

    /**
     * Helper for Array.prototype.indexOf since IE8 does not have it.
     * Note this does not implement a "fromIndex" param.
     * @param {Array} arr
     * @parma {*} obj
     */
    function indexOf(arr, obj) {
        if (Array.prototype.indexOf) {
            return arr.indexOf(obj);
        }

        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    }

    return EventEmitter;
});

define('view/view',['require','exports','module','jquery','view/delegate','event-emitter','view/event-map','inherits'],function (require, exports, module) {var $ = require('jquery');
var delegate = require('view/delegate');
var EventEmitter = require('event-emitter');
var EventMap = require('view/event-map');
var inherits = require('inherits');



/**
 * A View is an Object that facades an HTMLElement, and provides helpful methods
 * for automatically creating appropriate Elements on construction, rendering
 * templates as their innerHTML, and delegating and undelegating event listeners
 * @param opts {Object} A set of options to config the view with
 * @param opts.el {HTMLElement} The element the View should control
 * @exports view/view
 * @constructor
 */
var View = function(opts) {
    EventEmitter.call(this);
    opts = opts || {};
    this.opts = opts;
    this.uid = delegate.getUniqueId();

    this.setElement(opts.el || document.createElement(this.elTag));
};
inherits(View, EventEmitter);

var delegateEventSplitter = /^(\S+)\s*(.*)$/;

/**
 * Find elements within the View's .el by jQuery selector
 * @param {string} selector
 * @return {jQuery}
 */
View.prototype.$ = function(selector) {
    return this.$el.find(selector);
};

/**
 * Find elements by class name
 * @param {string} className
 * @return {jQuery}
 */
View.prototype.getElementsByClass = function(className) {
    return this.$el.find('.' + className);
};

/**
 * The HTMLElement tag to use if this View creates its own element
 * @type {string}
 */
View.prototype.elTag = 'div';

/**
 * Class to be added to the view's element.
 * @type {string}
 */
View.prototype.elClass = '';

/**
 * Event bindings.
 * @type {EventMap}
 */
View.prototype.events = new EventMap();

/**
 * Get contextual data for a template.
 * @type {function()}
 */
View.prototype.getTemplateContext = function () {
    return this;
};

/**
 * The template that may be used for this view.
 * @type {?function()}
 */
View.prototype.template = null;

/**
 * Set the element for the view to render in.
 * You will probably want to call .render() after this, but not always.
 * @param element {HTMLElement} The element to render this View in
 * @return this
 */
View.prototype.setElement = function (element) {
    if (this.el) {
        this.$el.removeClass(this.elClass);
        this.undelegateEvents();
    }

    this.$el = element instanceof $ ? element : $(element);
    this.el = this.$el[0];

    if (this.elClass) {
        this.$el.addClass(this.elClass);
    }

    this.delegateEvents();

    return this;
};

/**
 * Attatch the declared events
 * @param events {Object.<string, (string|function)>} Mapping of event/selectors to a function
 * or the name of a method on this view.
 * Backbone.View style, e.g. { "click testSelector": "updateTestEl" }
 */
View.prototype.delegateEvents = function (events) {
    if (!(events || (events = this.events))) {
        return this;
    }
    delegate.delegateEvents(this.$el, events, this.uid, this);
    return this;
};

/**
 * Unbinds the events registered with .delegateEvents
 */
View.prototype.undelegateEvents = function() {
    delegate.undelegateEvents(this.$el, this.uid);
    return this;
};

/**
 * If a template is set, render it in this.el
 * Subclasses will want to setElement on child views after rendering,
 *     then call .render() on those subelements
 */
View.prototype.render = function () {
    var context;
    if (typeof this.template === 'function') {
        context = this.getTemplateContext();
        this.$el.html(this.template(context));
    }
};

/**
 * The inverse of render. Detaches the element from the DOM.
 * Retains data and event handlers
 */
View.prototype.detach = function () {
    this.$el.detach();
};

/**
 * Destroy this View, rendering it useless.
 * Remove .el from the DOM, and unbind all event listeners in .events
 * Subclasses should free up as much memory as possible here.
 */
View.prototype.destroy = function () {
    this.$el.remove();
    this.template = null;
    this.undelegateEvents();
};

module.exports = View;

});

define('view', ['view/view'], function (main) { return main; });

define('streamhub-sdk/view',['view'], function(View) {
    
    return View;
});

define('debug/debug',['require','exports','module'],function (require, exports, module) {
/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

});

define('debug', ['debug/debug'], function (main) { return main; });

define('streamhub-sdk/debug',['require','exports','module','debug'],function (require, exports, module) {module.exports = require('debug');

});

define('stream/main',[
    'inherits',
    'event-emitter'],
function (inherits, EventEmitter) {
    

    /**
     * Base class for all Streams
     */
    function Stream (opts) {
        EventEmitter.call(this);
    }
    inherits(Stream, EventEmitter);

    return Stream;
});
define('stream', ['stream/main'], function (main) { return main; });

define('stream/util',[],function () {
    

    var exports = {};

    exports.nextTick = (function () {
        if (typeof setImmediate == 'function') {
            return function(f){ setImmediate(f); };
        }
        // fallback for other environments / postMessage behaves badly on IE8
        else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
            return function(f){ setTimeout(f); };
        } else {
            var q = [];

            window.addEventListener('message', function(){
                var i = 0;
                while (i < q.length) {
                    try { q[i++](); }
                    catch (e) {
                        q = q.slice(i);
                        window.postMessage('tic!', '*');
                        throw e;
                    }
                }
                q.length = 0;
            }, true);

            return function(fn){
                if (!q.length) window.postMessage('tic!', '*');
                q.push(fn);
            };
        }
    }());

    return exports;
});
define('stream/writable',['stream', 'stream/util', 'inherits'], function (Stream, util, inherits) {

    function Writable (opts) {
        this.writable = true;
        this._writableState = new WritableState(opts, this);
        Stream.call(this, opts);
    }

    inherits(Writable, Stream);


    Writable.prototype.write = function (chunk, errback) {
        var state = this._writableState,
            ret = false,
            writeAfterEndErr;

        if (typeof errback !== 'function') {
            errback = function () {};
        }

        if (state.ended) {
            writeAfterEndErr = new Error('.write() called after stream end');
            this.emit('error', writeAfterEndErr);
            util.nextTick(function () {
                errback(writeAfterEndErr);
            });
        } else {
            ret = this._writeOrBuffer(chunk, errback);
        }

        return ret;
    };


    Writable.prototype._writeOrBuffer = function (chunk, errback) {
        var state = this._writableState,
            ret = state.buffer.length < state.highWaterMark;

        state.needDrain = !ret;

        if (state.writing) {
            state.buffer.push(new WriteReq(chunk, errback));
        } else {
            this._doWrite(chunk, errback);
        }

        return ret;
    };


    Writable.prototype._write = function(chunk, errback) {
        errback(new Error('._write not implemented'));
    };


    Writable.prototype._onwrite = function (err) {
        var self = this,
            state = this._writableState,
            sync = state.sync,
            errback = state.writecb,
            finished;

        state.writing = false;
        state.writecb = null;
        state.writelen = 0;

        if (err) {
            if (sync) {
                util.nextTick(function () {
                    errback(err);
                });
            } else {
                errback(err);
            }
            this.emit('error', err);
        } else {
            finished = this._needFinish();
            if ( ! finished && ! state.bufferProcessing && state.buffer.length) {
                this._clearBuffer();
            }

            if (sync) {
                util.nextTick(function () {
                    self._afterWrite(finished, errback);
                });
            } else {
                this._afterWrite(finished, errback);
            }
        }
    };


    Writable.prototype._doWrite = function (chunk, errback) {
        var state = this._writableState;
        state.writelen = 1;
        state.writecb = errback;
        state.writing = true;
        state.sync = true;
        this._write(chunk, state.onwrite);
        state.sync = false;
    };


    Writable.prototype._afterWrite = function (finished, errback) {
        var state = this._writableState;
        if ( ! finished) {
            this._onwriteDrain();
        }
        errback();
        if (finished) {
            this._finishMaybe();
        }
    };


    Writable.prototype._onwriteDrain = function () {
        var state = this._writableState;
        if (state.buffer.length === 0 && state.needDrain) {
            state.needDrain = false;
            this.emit('drain');
        }
    };


    Writable.prototype._clearBuffer = function () {
        var state = this._writableState;

        state.bufferProcessing = true;

        for (var c = 0; c < state.buffer.length; c++) {
            var entry = state.buffer[c];
            var chunk = entry.chunk;
            var cb = entry.callback;
            var len = 1;

            this._doWrite(chunk, cb);

            // if we didn't call the onwrite immediately, then
            // it means that we need to wait until it does.
            // also, that means that the chunk and cb are currently
            // being processed, so move the buffer counter past them.
            if (state.writing) {
                c++;
                break;
            }
        }

        state.bufferProcessing = false;
        if (c < state.buffer.length) {
            state.buffer = state.buffer.slice(c);
        } else {
            // Clear the buffer
            state.buffer.length = 0;
        }
    };


    Writable.prototype.pipe = function () {
        this.emit('error', new Error('Cannot pipe. Not readable'));
    };


    Writable.prototype.end = function (chunk, errback) {
        var state = this._writableState;

        // If only passed an errback
        if (typeof chunk === 'function') {
            errback = chunk;
            chunk = null;
        }

        // If passed a chunk
        if (typeof chunk !== 'undefined' && chunk !== null) {
            this.write(chunk);
        }

        // Ignore extra .end() calls
        if ( ! state.ending && ! state.finished) {
            // Shut it down
            state.ending = true;
            this._finishMaybe();
            if (errback) {
                if (state.finished) {
                    util.nextTick(errback);
                } else {
                    this.once('finish', errback);
                }
            }
            state.ended = true;
        }
    };


    /**
     * @private
     */
    Writable.prototype._finishMaybe = function () {
        var state = this._writableState,
            needToFinish = this._needFinish();
        if (needToFinish) {
            state.finished = true;
            this.emit('finish');
        }
        return needToFinish;
    };


    /**
     * @private
     */
    Writable.prototype._needFinish = function () {
        var state = this._writableState;
        return (state.ending &&
                state.buffer.length === 0 &&
                ! state.finished &&
                ! state.writing);
    };


    function WriteReq(chunk, cb) {
        this.chunk = chunk;
        this.callback = cb;
    }


    /**
     * From https://github.com/isaacs/readable-stream/blob/c547457903406fdb9b5c621501c55eced48cae82/lib/_stream_writable.js#L41
     */
    function WritableState (opts, stream) {
        opts = opts || {};

        // the point at which write() starts returning false
        // Note: 0 is a valid value, means that we always return false if
        // the entire buffer is not flushed immediately on write()
        var hwm = opts.highWaterMark;
        this.highWaterMark = (hwm || hwm === 0) ? hwm : 0;

        // object stream flag to indicate whether or not this stream
        // contains buffers or objects.
        this.objectMode = !!opts.objectMode;

        // cast to ints.
        this.highWaterMark = ~~this.highWaterMark;

        this.needDrain = false;
        // at the start of calling end()
        this.ending = false;
        // when end() has been called, and returned
        this.ended = false;
        // when 'finish' is emitted
        this.finished = false;

        // should we decode strings into buffers before passing to _write?
        // this is here so that some node-core streams can optimize string
        // handling at a lower level.
        var noDecode = opts.decodeStrings === false;
        this.decodeStrings = !noDecode;

        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = opts.defaultEncoding || 'utf8';

        // not an actual buffer we keep track of, but a measurement
        // of how much we're waiting to get pushed to some underlying
        // socket or file.
        this.length = 0;

        // a flag to see when we're in the middle of a write.
        this.writing = false;

        // a flag to be able to tell if the onwrite cb is called immediately,
        // or on a later tick.  We set this to true at first, becuase any
        // actions that shouldn't happen until "later" should generally also
        // not happen before the first write call.
        this.sync = true;

        // a flag to know if we're processing previously buffered items, which
        // may call the _write() callback in the same tick, so that we don't
        // end up in an overlapped onwrite situation.
        this.bufferProcessing = false;

        // the callback that's passed to _write(chunk,cb)
        this.onwrite = function(er) {
            stream._onwrite(er);
        };

        // the callback that the user supplies to write(chunk,encoding,cb)
        this.writecb = null;

        // the amount that is being written when _write is called.
        this.writelen = 0;

        this.buffer = [];
    }

    Writable.WritableState = WritableState;
    return Writable;
});
define('stream/readable',['stream', 'stream/util', 'event-emitter', 'inherits'],
function (Stream, util, EventEmitter, inherits) {
    

    /**
     * Base class for Readable Streams
     * @constructor
     * @param [opts] {object} Configuration options
     * @param [opts.highWaterMark=0] {number} The maximum number of objects to
     *     store in the internal buffer before ceasing to read from upstream
     */
    function Readable (opts) {
        opts = opts || {};
        // This Readable implementation only supports objectMode
        opts.objectMode = true;
        this._readableState = new ReadableState(opts, this);

        this.readable = true;
        Stream.call(this);
    }
    inherits(Readable, Stream);


    /**
     * Pulls all the data out of this readable stream, and writes it to the
     * supplied destination, automatically managing the flow so that the
     * destination is not overwhelmed by a fast readable stream.
     * @param dest {Writable} A writable stream that should be written to
     * @param [pipeOpts] {object} Pipe options
     * @param [pipeOpts.end=true] {boolean} Whether the writer should be ended
     *     when the reader ends
     */
    Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this,
            state = this._readableState,
            doEnd,
            endFn;

        state.pipes.push(dest);

        doEnd = ( ! pipeOpts || pipeOpts.end !== false );

        endFn = doEnd ? onend : cleanup;

        if (state.endEmitted) {
            util.nextTick(endFn);
        } else {
            src.once('end', endFn);
        }

        dest.on('unpipe', onunpipe);
        function onunpipe (readable) {
            // Only if the unpipe was for this readable
            if (readable === src) {
                // Cleanup listeners when unpiped
                cleanup();
            }
        }

        // End the writable destination
        function onend () {
            dest.end();
        }

        // when the dest drains, it reduces the awaitDrain counter
        // on the source.  This would be more elegant with a .once()
        // handler in flow(), but adding and removing repeatedly is
        // too slow.
        var ondrain = this._pipeOnDrain();
        dest.on('drain', ondrain);

        function cleanup() {
            // cleanup event handlers once the pipe is broken
            dest.removeListener('close', onclose);
            dest.removeListener('finish', onfinish);
            dest.removeListener('drain', ondrain);
            dest.removeListener('error', onerror);
            dest.removeListener('unpipe', onunpipe);
            src.removeListener('end', onend);
            src.removeListener('end', cleanup);
            src.removeListener('data', ondata);

            // if the reader is waiting for a drain event from this
            // specific writer, then it would cause it to never start
            // flowing again.
            // So, if this is awaiting a drain, then we just call it now.
            // If we don't know, then assume that we are waiting for one.
            if (state.awaitDrain &&
               (!dest._writableState || dest._writableState.needDrain)) {
                ondrain();
            }
        }

        src.on('data', ondata);
        function ondata (chunk) {
            var ret = dest.write(chunk);
            if (ret === false) {
                // We should stop writing, so pause the source readable
                src._readableState.awaitDrain++;
                src.pause();
            }
        }

        // Unpipe when there is an error in the destination writable
        function onerror (err) {
            unpipe();
            if (EventEmitter.listenerCount(dest, 'error') === 0) {
                dest.emit('error', err);
            }
        }
        dest.once('error', onerror);


        // Both close and finish should trigger unpipe, but only once
        function onclose () {
            dest.removeListener('finish', onfinish);
            unpipe();
        }
        dest.once('close', onclose);
        function onfinish () {
            dest.removeListener('close', onclose);
            unpipe();
        }
        dest.once('finish', onfinish);


        function unpipe () {
            src.unpipe(dest);
        }

        // writables should emit 'pipe' when they're being piped to
        dest.emit('pipe', src);

        if ( ! state.flowing) {
            // Start the flow so pipe works
            src.resume();
        }

        return dest;
    };


    /**
     * This method will remove the hooks set up for a previous pipe() call.
     * If the destination is not specified, then all pipes are removed.
     * If the destination is specified, but no pipe is set up for it, then
     * this is a no-op.
     */
    Readable.prototype.unpipe = function (dest) {
        var state = this._readableState;

        // If there are no pipes, don't do anything
        if (state.pipes.length === 0) {
            return this;
        }

        // Only one pipe
        if (state.pipes.length === 1) {
            if (dest && dest !== state.pipes[0]) {
                // passed a dest we're not piping to
                return this;
            }

            if (!dest) {
                dest = state.pipes[0];
            }

            state.pipes = [];
            state.flowing = false;

            if (dest) {
                dest.emit('unpipe', this);
            }

            return this;
        }

        // Multiple Pipes

        // If dest not passed, unpipe all of them
        if ( ! dest) {
            var dests = state.pipes,
                numDests = dests.length;

            state.pipes = [];
            state.flowing = false;

            for (var i=0; i < numDests; i++) {
                dests[i].emit('unpipe', this);
            }

            return this;
        }

        // Dest was passed, only unpipe that one
        var indexOfDest = state.pipes.indexOf(dest);
        if (indexOfDest === -1) {
            return this;
        }

        state.pipes.splice(indexOfDest, 1);
        dest.emit('unpipe', this);

        return this;
    };


    /**
     * Get a function that will be excuted by a pipe destination
     * so that this readable continues piping when the writable drains
     */
    Readable.prototype._pipeOnDrain = function () {
        var src = this;
        return function () {
            var dest = this,
                state = src._readableState;
            if (state.awaitDrain) {
                state.awaitDrain--;
            }
            if (state.awaitDrain === 0 &&
                EventEmitter.listenerCount(src, 'data')) {
                state.flowing = true;
                src._flow();
            }
        };
    };


    /**
     * Continually .read() this Readable until there is nothing
     * more to read. Calling .read() will emit 'data'
     */
    Readable.prototype._flow = function () {
        var state = this._readableState,
            chunk;
        if (state.flowing) {
            do {
                chunk = this.read();
            } while (chunk !== null && state.flowing);
        }
    };


    /**
     * Push a chunk onto the end of the internal buffer
     * The _read() function will not be called again until at least one
     *     push(chunk) call is made.
     * The Readable class works by putting data into a read queue to be pulled
     *     out later by calling the read() method when the 'readable' event fires.
     * @param chunk {...object} Chunk of data to push into the read queue.
     *     if chunk === null, that signals the end of data
     * @returns {boolean} Whether or not more pushes should be performed
     */
    Readable.prototype.push = function (chunk) {
        var chunks = Array.prototype.slice.call(arguments);
        return this._addToBuffer.apply(this, [false].concat(chunks));
    };


    /**
     * Push a chunk onto the front of the internal buffer.
     * This is useful in certain cases where a stream is being consumed by a
     * parser, which needs to "un-consume" some data that it has optimistically pulled out of the source, so that the stream can be passed on to some other party.
     * @param chunk {...object} Chunk of data to unshift onto the read queue
     * @returns {boolean} Whether or not more pushes should be performed
     */
    Readable.prototype.unshift = function (chunk) {
        var chunks = Array.prototype.slice.call(arguments);
        return this._addToBuffer.apply(this, [true].concat(chunks));
    };


    /**
     * @private
     * Common implementation shared between .push and .unshift
     * Both methods mutate to read buffer
     * @param addToFront {boolean} Whether to add to the front or back of the
     *     buffer
     * @param chunk {...object} Chunk of data to add to the read queue
     * @returns {boolean} Whether this stream should have more data pushed
     *     to it
     */
    Readable.prototype._addToBuffer = function (addToFront, firstChunk) {
        var chunks = Array.prototype.slice.call(arguments, 1),
            state = this._readableState;
        if (firstChunk === null) {
            // End of file.
            state.reading = false;
            // Start wrapping up if we haven't before
            if ( ! state.ended) {
                this._endReadable();
            }
        } else {
            if (state.ended && ! addToFront) {
                this.emit('error', new Error("readable.push() called after EOF"));
            } else if (state.endEmitted && addToFront) {
                this.emit('error', new Error("readable.unshift() called after end event"));
            } else {
                if (addToFront) {
                    state.buffer.unshift.apply(state.buffer, chunks);
                } else {
                    state.reading = false;
                    state.buffer.push.apply(state.buffer, chunks);
                }
                // If we've pushed data to the buffer,
                // let listeners know we're readable
                if (firstChunk && state.needReadable) {
                    this._emitReadable();
                }
                this._maybeReadMore();
            }
        }
        
        // Return whether
        return ! state.ended && 
               ( state.needReadable ||
                 state.buffer.length < state.highWaterMark ||
                 state.buffer.length === 0);
    };


    /**
     * @private
     * _read() more data from upstream until the buffer length is greater than
     *     the highWaterMark. It triggers this by calling .read(0);
     * This executes on nextTick, not synchronously
     */
    Readable.prototype._maybeReadMore = function () {
        var self = this,
            state = self._readableState;

        if (state.readingMore) {
            return;
        }
        state.readingMore = true;

        util.nextTick(_readMore);

        function _readMore () {
            var len = state.buffer.length;
            while ( ! state.reading && ! state.ended &&
                    state.buffer.length < state.highWaterMark ) {
                // Trigger ._read()
                self.read(0);
                if (len === state.buffer.length) {
                    // self.read(0) didn't add any data
                    break;
                } else {
                    len = state.buffer.length;
                }
            }
            state.readingMore = false;
        }
    };


    /**
     * Resume emitting data events.
     * This method will switch the stream into flowing-mode. If you do not want
     * to consume the data from a stream, but you do want to get to its end
     * event, you can call readable.resume() to open the flow of data.
     */
    Readable.prototype.resume = function () {
        var state = this._readableState;
        if ( ! state.flowing) {
            state.flowing = true;
            // Make sure there's data coming from upstream
            if ( ! state.reading) {
                this.read(0);
            }
            this._scheduleResume();
        }
    };


    /**
     * @private
     * If not already scheduled, schedule _doResume to execute
     * on nextTick
     */
    Readable.prototype._scheduleResume = function () {
        var self = this,
            state = this._readableState;
        if ( ! state.resumeScheduled) {
            state.resumeScheduled = true;
            util.nextTick(function () {
                self._doResume();
            });
        }
    };


    Readable.prototype._doResume = function () {
        var state = this._readableState;
        state.resumeScheduled = false;
        this.emit('resume');
        this._flow();
        // Make sure we're getting data from upstream
        if (state.flowing && ! state.reading) {
            this.read(0);
        }
    };


    /**
     * Stop emitting data events. Any data that becomes available will remain
     * in the internal buffer.
     */
    Readable.prototype.pause = function () {
        if (this._readableState.flowing !== false) {
            this._readableState.flowing = false;
            this.emit('pause');
        }
    };


    /**
     * Bind an event listener to an event on this stream
     * Readable adds some extra functionality so that binding a listener
     *     to 'readable' marks ._readableState.needReadable=true
     * @param eventName {string} The Event name to listen for
     * @param cb {function} Callback function to call when eventName fires
     */
    Readable.prototype.on = function (eventName, cb) {
        var ret = Stream.prototype.on.call(this, eventName, cb),
            state = this._readableState;

        if (eventName === 'data' && (state.flowing !== false)) {
            this.resume();
        }

        if (eventName === 'readable' && this.readable) {
            // Start reading on the first readable listener
            if ( ! state.readableListening) {
                state.readableListening = true;
                state.emittedReadable = false;
                state.needReadable = true;
                if ( ! state.reading) {
                    this.read(0);
                } else if (state.buffer.length) {
                    this._emitReadable();
                }
            }
        }
    };


    /**
     * Read data from the read buffer
     * @param [size] {number} The number of items to read from the buffer.
     *     If not provided, all data will be returned.
     *     If 0, There are some cases where you want to trigger a refresh of the
     *     underlying readable stream mechanisms, without actually consuming any
     *     data. In that case, you can call stream.read(0), which will always
     *     return null.
     *     If the internal read buffer is below the highWaterMark, and the
     *     stream is not currently reading, then calling read(0) will trigger a
     *     low-level _read call.
     *     There is almost never a need to do this externally.
     * @returns {object|null} An object from the read buffer, or null
     */
    Readable.prototype.read = function (size) {
        var state = this._readableState,
            originalSize = size,
            doRead,
            ret;

        state.calledRead = true;
        
        if (typeof size !== 'number' || size > 0) {
            // User wants data. We'll need to emit readable
            state.emittedReadable = false;
        }

        if (size === 0 && state.needReadable &&
           (state.buffer.length >= state.highWaterMark || state.ended)) {
            if (state.buffer.length === 0 && state.ended) {
                this._endReadable();
            } else {
                this._emitReadable();
            }
            return null;
        }

        size = this._getSizeToRead(size);

        // If called with 0 once end has been emitted, return null
        if (size === 0 && state.ended) {
            if (state.buffer.length === 0) {
                this._endReadable();
            }
            return null;
        }

        // Determine whether ._read needs to be called to fill up the buffer
        doRead = state.needReadable;

        // We need to read if this read will lower the buffer size
        // below the highWaterMark
        if (state.buffer.length === 0 ||
            state.buffer.length - size < state.highWaterMark) {
            doRead = true;
        }

        // Never read if already reading or the stream has ended
        if (state.reading || state.ended) {
            doRead = false;
        }

        if (doRead) {
            state.reading = true;
            state.sync = true;
            if (state.buffer.length === 0) {
                state.needReadable = true;
            }
            // Go get more data!
            this._read(state.highWaterMark);
            state.sync = false;
            // state.reading will be falsy if _read executed synchronously
            // This could change the buffer so we recalc size
            if ( ! state.reading) {
                size = this._getSizeToRead(originalSize);
            }
        }

        if (size > 0) {
            ret = this._readFromBuffer(size);
        } else {
            ret = null;
        }

        if (ret === null) {
            state.needReadable = true;
            size = 0;
        }

        // If we have nothing in the buffer, then we want to know
        // as soon as we *do* get something into the buffer.
        if (state.buffer.length === 0 && !state.ended) {
            state.needReadable = true;
        }

        // If we happened to read() exactly the remaining amount in the
        // buffer, and the EOF has been seen at this point, then make sure
        // that we emit 'end' on the very next tick.
        if (state.ended && !state.endEmitted && state.buffer.length === 0) {
            this._endReadable();
        }

        if (ret !== null) {
            this.emit('data', ret);
        }

        return ret;
    };


    /**
     * @private
     * Fetch data asynchronously from an upstream source.
     * Implement this function, but do NOT call it directly.
     * When data is available, put it into the read queue by calling
     *     readable.push(chunk). If push returns false, then you should stop
     *     pushing. When _read is called again, you should start pushing more.
     */
    Readable.prototype._read = function () {
        this.emit('error', new Error('._read() not implemented'));
    };


    /**
     * @private
     * Get data from the internal read buffer
     * @returns {object|null} An object from the internal read buffer, or null
     *     if there is no more on the buffer
     */
    Readable.prototype._readFromBuffer = function () {
        var state = this._readableState,
            buffer = state.buffer;
        if (buffer.length === 0) {
            return null;
        } else {
            return buffer.shift();
        }
    };


    /**
     * @private
     * Get the appropriate number of objects to read from the buffer.
     * @param sizeAskedFor {number} The Number of items asked for by the user
     * @returns {number} The number of objects that should be returned from
     *     .read()
     */
    Readable.prototype._getSizeToRead = function (sizeAskedFor) {
        var state = this._readableState;
        // Don't read anything if there's nothing to read
        if (state.buffer.length === 0 && state.ended) {
            return 0;
        }
        // Assuming objectMode. Return at most one item
        return sizeAskedFor === 0 ? 0 : 1;
    };


    /**
     * @private
     * Cause the stream to emit 'readable'
     */
    Readable.prototype._emitReadable = function () {
        var self = this,
            state = this._readableState;

        state.needReadable = false;

        if ( ! state.emittedReadable) {
            state.emittedReadable = true;
            if (state.sync) {
                util.nextTick(emitReadable);
            } else {
                emitReadable();
            }
        }

        function emitReadable () {
            self.emit('readable');
            self._flow();
        }
    };


    /**
     * @private
     * Mark the stream as closed and that it should not be readable again.
     * Often this happens after this.push(null);
     */
    Readable.prototype._endReadable = function () {
        var state = this._readableState;
        state.ended = true;
        if (state.buffer.length) {
            this._emitReadable();
        } else {
            this._emitEnd();
        }
    };


    /**
     * @private
     * Emit the end event if it hasn't been emitted yet
     */
    Readable.prototype._emitEnd = function () {
        var self = this,
            state = this._readableState;
        if (state.buffer.length > 0) {
            throw new Error("Tried to emit end event on a non-empty Readable");
        }
        if ( ! state.endEmitted && state.calledRead) {
            state.ended = true;
            util.nextTick(function () {
                // Check that we didn't get one last unshift.
                if (!state.endEmitted && state.buffer.length === 0) {
                    state.endEmitted = true;
                    self.readable = false;
                    self.emit('end');
                }
            });
        }
    };


    /**
     * The state objects contain other useful information for debugging the
     * state of streams in your programs. It is safe to look at them, but beyond
     * setting option flags in the constructor, it is not safe to modify them.
     * Copied from http://bit.ly/16eA5K7
     */
    function ReadableState(opts, stream) {
        opts = opts || {};

        // the point at which it stops calling _read() to fill the buffer
        // Note: 0 is a valid value, means "don't call _read preemptively ever"
        var hwm = opts.highWaterMark;
        this.highWaterMark = (hwm || hwm === 0) ? hwm : 0;

        // cast to ints.
        this.highWaterMark = ~~this.highWaterMark;

        this.buffer = [];
        this.pipes = [];
        this.pipesCount = 0;
        this.flowing = null;
        this.ended = false;
        this.endEmitted = false;
        this.reading = false;

        // In streams that never have any data, and do push(null) right away,
        // the consumer can miss the 'end' event if they do some I/O before
        // consuming the stream.  So, we don't emit('end') until some reading
        // happens.
        this.calledRead = false;

        // a flag to be able to tell if the onwrite cb is called immediately,
        // or on a later tick.  We set this to true at first, becuase any
        // actions that shouldn't happen until "later" should generally also
        // not happen before the first write call.
        this.sync = true;

        // whenever we return null, then we set a flag to say
        // that we're awaiting a 'readable' event emission.
        this.needReadable = false;
        this.emittedReadable = false;
        this.readableListening = false;


        // object stream flag. Used to make read(n) ignore n and to
        // make all the buffer merging and length checks go away
        this.objectMode = !!opts.objectMode;

        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = opts.defaultEncoding || 'utf8';

        // when piping, we only care about 'readable' events that happen
        // after read()ing all the bytes and not getting any pushback.
        this.ranOut = false;

        // the number of writers that are awaiting a drain event in .pipe()s
        this.awaitDrain = 0;

        // if true, a maybeReadMore has been scheduled
        this.readingMore = false;

        this.decoder = null;
        this.encoding = null;
    }

    return Readable;
});
define('stream/duplex',['stream/readable', 'stream/writable', 'stream/util', 'inherits'],
function (Readable, Writable, util, inherits) {

	function Duplex (opts) {
		Readable.call(this, opts);
		Writable.call(this, opts);

		if (opts && opts.readable === false) {
			this.readable = false;
		}

		if (opts && opts.writable === false) {
			this.writable = false;
		}

		this.allowHalfOpen = true;
		if (opts && opts.allowHalfOpen === false) {
			this.allowHalfOpen = false;
		}

		this.once('end', onend);
	}

	inherits(Duplex, Readable);
	inherits.parasitically(Duplex, Writable);

	// Enforce noHalfOpen
	function onend () {
		var self = this;

		if (this.allowHalfOpen || this._writableState.ended) {
			return;
		}

		// No more data can be written.
		// But more writes can happen in this tick
		util.nextTick(function () {
			self.end();
		});
	}

	return Duplex;
});
define('streamhub-sdk/views/streams/more',[
    'inherits',
    'stream/duplex',
    'streamhub-sdk/debug'],
function (inherits, Duplex, debug) {
    


    var log = debug('streamhub-sdk/views/streams/more');


    /**
     * A Duplex stream (Readable & Writable) that only passes through
     * the number of items it is instructed to.
     * More also maintains a LIFO stack such that previously emitted Content can
     * be stashed back into More so that it is re-read out later when needed.
     * @constructor
     * @param opts {object}
     * @param [opts.goal=0] {number} The initial amount to let through
     */
    var More = function (opts) {
        opts = opts || {};
        this._goal = opts.goal || 0;
        this._stack = [];
        this._requestMore = null;
        Duplex.call(this, opts);
    };

    inherits(More, Duplex);


    /**
     * Let more items pass through.
     * This sets the goal of the stream to the provided number.
     * @param newGoal {number} The number of items this stream should
     *     let through before holding again.
     */
    More.prototype.setGoal = function (newGoal) {
        this._goal = newGoal;

        if (this._goal > 0) {
            this._fetchAndPush();
        }
    };


    /**
     * Get the number of objects the stream is waiting for to reach its goal
     */
    More.prototype.getGoal = function () {
        return this._goal;
    };


    /**
     * stack Content that should be re-emitted later in last-in-first-out
     * fashion. stacked stuff is read out before written stuff
     * @param obj {Object} An object to stack, that you may want back later
     */
    More.prototype.stack = function (obj) {
        this._stack.push(obj);
        this.emit('hold');
    };


    /**
     * Required by Duplex subclasses.
     * This ensures that once the goal is reached, no more content
     * passes through.
     * @private
     */
    More.prototype._write = function (chunk, doneWriting) {
        var self = this;
        log('_write', chunk);

        // Put on BOTTOM of the stack.
        // written stuff comes after all stacked stuff
        this._stack.unshift(chunk);

        // Save the doneWriting cb for later. We'll call it once this
        // new bottom of the stack is popped, and we need more data
        // from the Writable side of the duplex
        this._requestMore = function () {
            self._requestMore = null;
            doneWriting();
        };

        if (this._goal >= 1) {
            this._fetchAndPush();
        } else {
            // Emit 'hold' to signify that there is data waiting, if only
            // the goal were increased. This is useful to render a 'show more'
            // button only if there is data in the buffer, and avoids a
            // show more button that, when clicked, does nothing but disappear
            this.emit('hold');
        }
    };


    /**
     * Required by Readable subclasses. Get data from upstream. In this case,
     * either the internal ._stack or the Writable side of the Duplex
     * @private
     */
    More.prototype._read = function () {
        if (this._goal <= 0 && this._stack.length) {
            // You don't get data yet.
            this.emit('hold');
            return;
        }
        this._fetchAndPush();
    };


    /**
     * Fetch data from the internal stack (sync) and push it.
     * Or, if there is nothing in the stack, request more from the Writable
     * side of the duplex, which will eventually call this again.
     * @private
     */
    More.prototype._fetchAndPush = function () {
        // If there's data in the stack, pop, push it along, & decrement goal
        if (this._stack.length) {
            // There's stuff in the stack. Push it.
            this._goal--;
            this.push(this._stack.pop());
        }

        // If there was no data, or we just pushed the last bit,
        // request more if possible
        if (this._stack.length === 0 &&
            typeof this._requestMore === 'function') {
            this._requestMore();
        }
    };


    return More;
});

define('streamhub-sdk/views/show-more-button',['inherits', 'streamhub-sdk/view', 'streamhub-sdk/jquery'],
function (inherits, View) {
    

    /**
     * A View that provides a button that can control a More stream
     * @param opts {object}
     * @param [opts.more] {More} A More stream that this button should control
     */
    var ShowMoreButton = function (opts) {
        View.call(this, opts);
        opts = opts || {};
        if (opts.more) {
            this.setMoreStream(opts.more);
        }
    };

    inherits(ShowMoreButton, View);


    ShowMoreButton.prototype.events = View.prototype.events.extended({
        // Hide the button on click. When more content is held and can be shown,
        // It will reappear
        'click': function () {
            this._holding = false;
            this.$el.hide();
            this.$el.trigger('showMore.hub');
        }
    });


    ShowMoreButton.prototype.render = function () {
        View.prototype.render.call(this);
        this.$el.css('display', 'none');
    };


    /**
     * The template to render in the Button
     * @return {string}
     */
    ShowMoreButton.prototype.template = function () {
        return "Load More";
    };


    /**
     * Set the More Stream this button controls
     * @param more {More} A More stream that this button should control
     */
    ShowMoreButton.prototype.setMoreStream = function (more) {
        var self = this;

        this._more = more;

        // When more content is held to be shown, show the button
        this._more.on('hold', function () {
            self._holding = true;
            self.$el.css('display', '');
        });
    };


    ShowMoreButton.prototype.isHolding = function () {
        return this._holding;
    };


    /**
     * Get the More Stream this button is controlling
     * @return {More}
     */
    ShowMoreButton.prototype.getMoreStream = function () {
        return this._more;
    };


    return ShowMoreButton;
});

/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */



var Hogan = {};

(function (Hogan, useArrayBuffer) {
  Hogan.Template = function (renderFunc, text, compiler, options) {
    this.r = renderFunc || this.r;
    this.c = compiler;
    this.options = options;
    this.text = text || '';
    this.buf = (useArrayBuffer) ? [] : '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // tries to find a partial in the curent scope and render it
    rp: function(name, context, partials, indent) {
      var partial = partials[name];

      if (!partial) {
        return '';
      }

      if (this.c && typeof partial == 'string') {
        partial = this.c.compile(partial, this.options);
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ls(val, ctx, partials, inverted, start, end, tags);
      }

      pass = (val === '') || !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        return ctx[ctx.length - 1];
      }

      for (var i = 1; i < names.length; i++) {
        if (val && typeof val == 'object' && names[i] in val) {
          cx = val;
          val = val[names[i]];
        } else {
          val = '';
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.lv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        if (v && typeof v == 'object' && key in v) {
          val = v[key];
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.lv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ho: function(val, cx, partials, text, tags) {
      var compiler = this.c;
      var options = this.options;
      options.delimiters = tags;
      var text = val.call(cx, text);
      text = (text == null) ? String(text) : text.toString();
      this.b(compiler.compile(text, options).render(cx, partials));
      return false;
    },

    // template result buffering
    b: (useArrayBuffer) ? function(s) { this.buf.push(s); } :
                          function(s) { this.buf += s; },
    fl: (useArrayBuffer) ? function() { var r = this.buf.join(''); this.buf = []; return r; } :
                           function() { var r = this.buf; this.buf = ''; return r; },

    // lambda replace section
    ls: function(val, ctx, partials, inverted, start, end, tags) {
      var cx = ctx[ctx.length - 1],
          t = null;

      if (!inverted && this.c && val.length > 0) {
        return this.ho(val, cx, partials, this.text.substring(start, end), tags);
      }

      t = val.call(cx);

      if (typeof t == 'function') {
        if (inverted) {
          return true;
        } else if (this.c) {
          return this.ho(t, cx, partials, this.text.substring(start, end), tags);
        }
      }

      return t;
    },

    // lambda replace variable
    lv: function(val, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = val.call(cx);

      if (typeof result == 'function') {
        result = coerceToString(result.call(cx));
        if (this.c && ~result.indexOf("{\u007B")) {
          return this.c.compile(result, this.options).render(cx, partials);
        }
      }

      return coerceToString(result);
    }

  };

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos =/\'/g,
      rQuot = /\"/g,
      hChars =/[&<>\"\']/;


  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp,'&amp;')
        .replace(rLt,'&lt;')
        .replace(rGt,'&gt;')
        .replace(rApos,'&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);




(function (Hogan) {
  // Setup regex  assignments
  // remove whitespace according to Mustache spec
  var rIsWhitespace = /\S/,
      rQuot = /\"/g,
      rNewline =  /\n/g,
      rCr = /\r/g,
      rSlash = /\\/g,
      tagTypes = {
        '#': 1, '^': 2, '/': 3,  '!': 4, '>': 5,
        '<': 6, '=': 7, '_v': 8, '{': 9, '&': 10
      };

  Hogan.scan = function scan(text, delimiters) {
    var len = text.length,
        IN_TEXT = 0,
        IN_TAG_TYPE = 1,
        IN_TAG = 2,
        state = IN_TEXT,
        tagType = null,
        tag = null,
        buf = '',
        tokens = [],
        seenTag = false,
        i = 0,
        lineStart = 0,
        otag = '{{',
        ctag = '}}';

    function addBuf() {
      if (buf.length > 0) {
        tokens.push(new String(buf));
        buf = '';
      }
    }

    function lineIsWhitespace() {
      var isAllWhitespace = true;
      for (var j = lineStart; j < tokens.length; j++) {
        isAllWhitespace =
          (tokens[j].tag && tagTypes[tokens[j].tag] < tagTypes['_v']) ||
          (!tokens[j].tag && tokens[j].match(rIsWhitespace) === null);
        if (!isAllWhitespace) {
          return false;
        }
      }

      return isAllWhitespace;
    }

    function filterLine(haveSeenTag, noNewLine) {
      addBuf();

      if (haveSeenTag && lineIsWhitespace()) {
        for (var j = lineStart, next; j < tokens.length; j++) {
          if (!tokens[j].tag) {
            if ((next = tokens[j+1]) && next.tag == '>') {
              // set indent to token value
              next.indent = tokens[j].toString()
            }
            tokens.splice(j, 1);
          }
        }
      } else if (!noNewLine) {
        tokens.push({tag:'\n'});
      }

      seenTag = false;
      lineStart = tokens.length;
    }

    function changeDelimiters(text, index) {
      var close = '=' + ctag,
          closeIndex = text.indexOf(close, index),
          delimiters = trim(
            text.substring(text.indexOf('=', index) + 1, closeIndex)
          ).split(' ');

      otag = delimiters[0];
      ctag = delimiters[1];

      return closeIndex + close.length - 1;
    }

    if (delimiters) {
      delimiters = delimiters.split(' ');
      otag = delimiters[0];
      ctag = delimiters[1];
    }

    for (i = 0; i < len; i++) {
      if (state == IN_TEXT) {
        if (tagChange(otag, text, i)) {
          --i;
          addBuf();
          state = IN_TAG_TYPE;
        } else {
          if (text.charAt(i) == '\n') {
            filterLine(seenTag);
          } else {
            buf += text.charAt(i);
          }
        }
      } else if (state == IN_TAG_TYPE) {
        i += otag.length - 1;
        tag = tagTypes[text.charAt(i + 1)];
        tagType = tag ? text.charAt(i + 1) : '_v';
        if (tagType == '=') {
          i = changeDelimiters(text, i);
          state = IN_TEXT;
        } else {
          if (tag) {
            i++;
          }
          state = IN_TAG;
        }
        seenTag = i;
      } else {
        if (tagChange(ctag, text, i)) {
          tokens.push({tag: tagType, n: trim(buf), otag: otag, ctag: ctag,
                       i: (tagType == '/') ? seenTag - ctag.length : i + otag.length});
          buf = '';
          i += ctag.length - 1;
          state = IN_TEXT;
          if (tagType == '{') {
            if (ctag == '}}') {
              i++;
            } else {
              cleanTripleStache(tokens[tokens.length - 1]);
            }
          }
        } else {
          buf += text.charAt(i);
        }
      }
    }

    filterLine(seenTag, true);

    return tokens;
  }

  function cleanTripleStache(token) {
    if (token.n.substr(token.n.length - 1) === '}') {
      token.n = token.n.substring(0, token.n.length - 1);
    }
  }

  function trim(s) {
    if (s.trim) {
      return s.trim();
    }

    return s.replace(/^\s*|\s*$/g, '');
  }

  function tagChange(tag, text, index) {
    if (text.charAt(index) != tag.charAt(0)) {
      return false;
    }

    for (var i = 1, l = tag.length; i < l; i++) {
      if (text.charAt(index + i) != tag.charAt(i)) {
        return false;
      }
    }

    return true;
  }

  function buildTree(tokens, kind, stack, customTags) {
    var instructions = [],
        opener = null,
        token = null;

    while (tokens.length > 0) {
      token = tokens.shift();
      if (token.tag == '#' || token.tag == '^' || isOpener(token, customTags)) {
        stack.push(token);
        token.nodes = buildTree(tokens, token.tag, stack, customTags);
        instructions.push(token);
      } else if (token.tag == '/') {
        if (stack.length === 0) {
          throw new Error('Closing tag without opener: /' + token.n);
        }
        opener = stack.pop();
        if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) {
          throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
        }
        opener.end = token.i;
        return instructions;
      } else {
        instructions.push(token);
      }
    }

    if (stack.length > 0) {
      throw new Error('missing closing tag: ' + stack.pop().n);
    }

    return instructions;
  }

  function isOpener(token, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].o == token.n) {
        token.tag = '#';
        return true;
      }
    }
  }

  function isCloser(close, open, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].c == close && tags[i].o == open) {
        return true;
      }
    }
  }

  Hogan.generate = function (tree, text, options) {
    var code = 'var _=this;_.b(i=i||"");' + walk(tree) + 'return _.fl();';
    if (options.asString) {
      return 'function(c,p,i){' + code + ';}';
    }

    return new Hogan.Template(new Function('c', 'p', 'i', code), text, Hogan, options);
  }

  function esc(s) {
    return s.replace(rSlash, '\\\\')
            .replace(rQuot, '\\\"')
            .replace(rNewline, '\\n')
            .replace(rCr, '\\r');
  }

  function chooseMethod(s) {
    return (~s.indexOf('.')) ? 'd' : 'f';
  }

  function walk(tree) {
    var code = '';
    for (var i = 0, l = tree.length; i < l; i++) {
      var tag = tree[i].tag;
      if (tag == '#') {
        code += section(tree[i].nodes, tree[i].n, chooseMethod(tree[i].n),
                        tree[i].i, tree[i].end, tree[i].otag + " " + tree[i].ctag);
      } else if (tag == '^') {
        code += invertedSection(tree[i].nodes, tree[i].n,
                                chooseMethod(tree[i].n));
      } else if (tag == '<' || tag == '>') {
        code += partial(tree[i]);
      } else if (tag == '{' || tag == '&') {
        code += tripleStache(tree[i].n, chooseMethod(tree[i].n));
      } else if (tag == '\n') {
        code += text('"\\n"' + (tree.length-1 == i ? '' : ' + i'));
      } else if (tag == '_v') {
        code += variable(tree[i].n, chooseMethod(tree[i].n));
      } else if (tag === undefined) {
        code += text('"' + esc(tree[i]) + '"');
      }
    }
    return code;
  }

  function section(nodes, id, method, start, end, tags) {
    return 'if(_.s(_.' + method + '("' + esc(id) + '",c,p,1),' +
           'c,p,0,' + start + ',' + end + ',"' + tags + '")){' +
           '_.rs(c,p,' +
           'function(c,p,_){' +
           walk(nodes) +
           '});c.pop();}';
  }

  function invertedSection(nodes, id, method) {
    return 'if(!_.s(_.' + method + '("' + esc(id) + '",c,p,1),c,p,1,0,0,"")){' +
           walk(nodes) +
           '};';
  }

  function partial(tok) {
    return '_.b(_.rp("' +  esc(tok.n) + '",c,p,"' + (tok.indent || '') + '"));';
  }

  function tripleStache(id, method) {
    return '_.b(_.t(_.' + method + '("' + esc(id) + '",c,p,0)));';
  }

  function variable(id, method) {
    return '_.b(_.v(_.' + method + '("' + esc(id) + '",c,p,0)));';
  }

  function text(id) {
    return '_.b(' + id + ');';
  }

  Hogan.parse = function(tokens, text, options) {
    options = options || {};
    return buildTree(tokens, '', [], options.sectionTags || []);
  },

  Hogan.cache = {};

  Hogan.compile = function(text, options) {
    // options
    //
    // asString: false (default)
    //
    // sectionTags: [{o: '_foo', c: 'foo'}]
    // An array of object with o and c fields that indicate names for custom
    // section tags. The example above allows parsing of {{_foo}}{{/foo}}.
    //
    // delimiters: A string that overrides the default delimiters.
    // Example: "<% %>"
    //
    options = options || {};

    var key = text + '||' + !!options.asString;

    var t = this.cache[key];

    if (t) {
      return t;
    }

    t = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
    return this.cache[key] = t;
  };
})(typeof exports !== 'undefined' ? exports : Hogan);


if (typeof define === 'function' && define.amd) {
  define('hogan',Hogan);
}
;
define('text',{});
define('hgn',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define("hgn!streamhub-sdk/views/templates/list-view", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"hub-list\"></div>");_.b("\n" + i);_.b("<div class=\"hub-list-footer\">");_.b("\n" + i);_.b("	<a class=\"hub-list-more\"></a>");_.b("\n" + i);_.b("</div>");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/views/list-view',[
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'inherits',
    'streamhub-sdk/debug',
    'stream/writable',
    'streamhub-sdk/views/streams/more',
    'streamhub-sdk/views/show-more-button',
    'hgn!streamhub-sdk/views/templates/list-view'],
function($, View, inherits, debug, Writable, More, ShowMoreButton, ListViewTemplate) {
    

    var log = debug('streamhub-sdk/views/list-view');

    /**
     * A simple View that displays Content in a list (`<ul>` by default).
     *
     * @param [opts] {Object} A set of options to config the view with
     * @param [opts.el] {HTMLElement} The element in which to render the streamed content
     * @param [opts.comparator] {function(view, view): number}
     * @param [opts.autoRender] Whether to call #render in the constructor
     * @exports streamhub-sdk/views/list-view
     * @constructor
     */
    var ListView = function(opts) {
        opts = opts || {};
        opts.autoRender = opts.autoRender === undefined ? true : opts.autoRender;

        this.views = [];

        View.call(this, opts);
        Writable.call(this, opts);

        this.comparator = opts.comparator || this.comparator;
        this._moreAmount = opts.showMore || 50;
        this.more = opts.more || this._createMoreStream(opts);
        this.showMoreButton = opts.showMoreButton || this._createShowMoreButton(opts);
        this.showMoreButton.setMoreStream(this.more);

        //TODO(ryanc): This is out of convention to call #render
        // in the constructor. However it is convenient/intuitive
        // in the public API to instantiate a ListView and have it be visible.
        // Removing this to require an explicit invocation would alter
        // the public API siginificantly, so for now render stays in the
        // constructor. To avoid this behavior, opts.autoRender == false.
        if (opts.autoRender) {
            this.render();
        }

        this._pipeMore();
    };

    inherits(ListView, View);
    inherits.parasitically(ListView, Writable);


    ListView.prototype.events = View.prototype.events.extended({
        // .showMoreButton will trigger showMore.hub when it is clicked
        'showMore.hub': function () {
            this.showMore();
        },
        // When a subview .remove()s itself, it should fire this event
        'removeView.hub': function (event, view) {
            this.remove(view);
        }
    });

    ListView.prototype.template = ListViewTemplate;


    /**
     * Selector of .el child that contentViews should be inserted into
     */
    ListView.prototype.listElSelector = '.hub-list';


    /**
     * Selector of .el child in which to render a show more button
     */
    ListView.prototype.showMoreElSelector = '.hub-list-more';


    /**
     * Keys are views that were forcibly indexed into this view.
     * @type {Object.<string, boolean>}
     * @private
     */
    ListView.prototype._indexedViews = {};


    ListView.prototype.setElement = function (element) {
        View.prototype.setElement.apply(this, arguments);
        this.$listEl = this.$el;
    };


    /**
     * Render the ListView in its .el, and call .setElement on any subviews
     */
    ListView.prototype.render = function () {
        View.prototype.render.call(this);
        this.$listEl = this.$el.find(this.listElSelector);

        this.showMoreButton.setElement(this.$el.find(this.showMoreElSelector));
        this.showMoreButton.render();
        if (this.showMoreButton.isHolding()) {
            this.showMoreButton.$el.show();
        }
    };


    /**
     * Called automatically by the Writable base class when .write() is called
     * @private
     * @param view {View} View to display in the ListView
     * @param requestMore {function} A function to call when done writing, so
     *     that _write will be called again with more data
     */
    ListView.prototype._write = function (view, requestMore) {
        this.add(view);
        requestMore();
    };


    /**
     * Comparator function to determine ordering of Views.
     * Your subclass should implement this if you want ordering
     * @param a {view}
     * @param b {view}
     * @returns {Number} < 0 if a before b, 0 if same ordering, > 0 if b before a
     */
    ListView.prototype.comparator = null;


    /**
     * Returns true if the view is listed on the indexedViews list.
     * @param view {!View}
     * @returns {!boolean}
     * @protected
     */
    ListView.prototype._isIndexedView = function(view) {
        return (view && view.uid && this._indexedViews[view.uid]) ? true : false;
    };

    /**
     * Adds a view to _indexedViews
     * @param view {!View}
     * @private
     */
    ListView.prototype._recordIndexedView = function(view) {
        this._indexedViews[view.uid] = true;
    };

    /**
     * Returns the index where newView should be inserted.
     * Requires this.comparator to be defined.
     * @private
     * @param newView {view} View that will be added.
     * @param [array] {[]} Array to search through. Defaults to this.views.
     * @return {!number}
     */
    ListView.prototype._binarySearch = function(newView, array) {
        array = array || this.views;
        if (!this.comparator) {
            throw new Error("Tried to _binarySearch without this.comparator.");
        }

        var low = 0, high = array.length, mid, comp, origMid;
        while (low < high) {
            origMid = mid = (low + high) >>> 1;
            comp = array[mid];

            while (this._isIndexedView(comp) && mid > low) {
            //Try to get a comp that isn't indexed
            //Move lower looking for a comparable view
                comp = array[--mid];
            }
            if (this._isIndexedView(comp)) {
            //If nothing was found...
                if (low === 0) {
                //...and we're at the beginning, then just add it to the beginning
                    high = low;
                } else {
                //...and we aren't at the beginning, continue to move towards the end
                    low = origMid + 1;
                }
            } else {
            //Set new low or high and start again
                if (this.comparator(comp, newView) < 0) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
        }

        return Math.max(0, low);//Incase of miscalculations, use max() to assure minimum of 0
    };


    /**
     * Add a view to the ListView
     *     insert the newView into this.el according to this.comparator
     * @param newView {View} A View to add to the ListView
     * @param [forcedIndex] {number} location for the new view
     * @returns the newly added View
     */
    ListView.prototype.add = function(newView, forcedIndex) {
        log("add", newView, forcedIndex);
        var index;

        if ( ! newView) {
            log("Called add with a falsy parameter, returning");
            return;
        }

        if (typeof(forcedIndex) !== 'number' || Math.abs(forcedIndex) > this.views.length) {
            if (this.comparator) {
                index = this._binarySearch(newView);
            } else {
                index = this.views.length;
            }
        } else {
            this._recordIndexedView(newView);
        }

        this.views.splice(forcedIndex || index, 0, newView);

        newView.render();
        // Add to DOM
        this._insert(newView, forcedIndex);
        this.emit('added', newView);
        return newView;
    };


    /**
     * Remove a View from this ListView
     * @param content {Content|ContentView} The ContentView or Content to be removed
     * @returns {boolean} true if Content was removed, else false
     */
    ListView.prototype.remove = function (view) {
        var viewIndex = this.views.indexOf(view);

        // Return false if the provided view is not managed by this ListView
        if (viewIndex === -1) {
            return false;
        }

        // Remove from DOM
        this._extract(view);

        // Remove from this.views[]
        this.views.splice(viewIndex, 1);

        return true;
    };


    /**
     * Remove a view from the DOM. Called by .remove();
     * @private
     * @param view {View} The View to remove from the DOM
     */
    ListView.prototype._extract = function (view) {
        view.$el.remove();
    };


    /**
     * Insert a contentView into the ListView's .el
     * @protected
     * @param view {View} The view to add to this.el
     * @param [forcedIndex] {number} Index of the view in this.views
     */
    ListView.prototype._insert = function (view, forcedIndex) {
        var newContentViewIndex,
            $previousEl;

        newContentViewIndex = forcedIndex || this.views.indexOf(view);

        if (newContentViewIndex === 0) {
            // Beginning!
            view.$el.prependTo(this.$listEl);
        } else {
            // Find it's previous view and insert new view after
            $previousEl = this.views[newContentViewIndex - 1].$el;
            view.$el.insertAfter($previousEl);
        }
    };


    /**
     * Show More content.
     * ContentListView keeps track of an internal ._newContentGoal
     *     which is how many more items he wishes he had.
     *     This increases that goal and marks the Writable
     *     side of ContentListView as ready for more writes.
     * @param numToShow {number} The number of items to try to add
     */
    ListView.prototype.showMore = function (numToShow) {
        if (typeof numToShow === 'undefined') {
            numToShow = this._moreAmount;
        }
        this.more.setGoal(numToShow);
    };


    /**
     * Create a Stream that extra content can be written into.
     * This will be used if an opts.moreBuffer is not provided on construction.
     * By default, this creates a streamhub-sdk/views/streams/more
     * @private
     */
    ListView.prototype._createMoreStream = function (opts) {
        opts = opts || {};
        return new More({
            highWaterMark: 0,
            goal: opts.initial || 50
        });
    };


    /**
     * Create a ShowMoreButton view to be used if one is not passed as
     *     opts.showMoreButton on construction
     * @private
     * @return {ShowMoreButton}
     */
    ListView.prototype._createShowMoreButton = function (opts) {
        return new ShowMoreButton();
    };


    /**
     * Register listeners to the .more stream so that the items
     * it reads out go somewhere useful.
     * By default, this .add()s the items
     * @private
     */
    ListView.prototype._pipeMore = function () {
        var self = this;
        this.more.on('readable', function () {
            var content;
            while (content = self.more.read()) {
                self.add(content);
            }
        });
    };

    /**
     * Detaches list item view elements.
     * Removes references to list item views.
     */
    ListView.prototype.clear = function () {
        for (var i=0; i < this.views.length; i++) {
            this.views[i].detach();
        }
        this.views = [];
    };

    ListView.prototype.destroy = function () {
        View.prototype.destroy.call(this);
        this.views = null;
    };

    return ListView;
});

define("hgn!streamhub-input/templates/attachment", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"lf-attachment-discard\"></div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-input/javascript/content-editor/attachment-view',['require','exports','module','inherits','streamhub-sdk/view','hgn!streamhub-input/templates/attachment'],function (require, exports, module) {var inherits = require('inherits');
var View = require('streamhub-sdk/view');



function AttachmentView () {
    View.apply(this, arguments);
}
inherits(AttachmentView, View);

/* Ensure thehat the image does not render with an unreasonable aspect ratio */
AttachmentView.prototype._loadImage = function () {
    var image = new Image();
    image.className = this.classes.THUMBNAIL;
    image.onload = this._handleImageLoaded.bind(this, image);
    image.src = this.opts.oembed.url;
    return image;
};

/*
 * Chose between displaying as a imge with fixed height and scaled width,
 * or a div with fixed height and width.
 */
AttachmentView.prototype._handleImageLoaded = function (image) {
    View.prototype.render.call(this);
    if (image.height / image.width < 0.5) {
        image = document.createElement('div');
        image.className = this.classes.THUMBNAIL_CONTAINED;
        image.style = 'background-image: ' + this.opts.oembed.url;
    }
    this.$el.append(image);
    this.$el.show();
    return image;
};

/** @enum {string} */
AttachmentView.prototype.classes = {
    THUMBNAIL: 'lf-attachment-thumbnail',
    THUMBNAIL_CONTAINED: 'lf-attachment-thumbnail-contained'
};

/** @override */
AttachmentView.prototype.elClass = 'lf-attachment';

/** @override */
AttachmentView.prototype.render = function () {
    this.$el.hide();
    this._loadImage();
};

/** @override */
AttachmentView.prototype.template = require('hgn!streamhub-input/templates/attachment');

module.exports = AttachmentView;

});

define('streamhub-input/javascript/content-editor/attachment-list-view',['require','exports','module','inherits','streamhub-sdk/views/list-view','streamhub-input/javascript/content-editor/attachment-view'],function (require, exports, module) {var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var AttachmentView = require('streamhub-input/javascript/content-editor/attachment-view');



// docs
function AttachmentListView() {
    ListView.apply(this, arguments);

    /**
     * View ids -> views
     * @type {object}
     */
    this._viewMap = {};
}
inherits(AttachmentListView, ListView);

/** @enum {string} */
AttachmentListView.prototype.classes = {
    DATA_ID: 'data-lf-id',
    DISCARD_X: 'lf-attachment-discard'
};

/** @override */
AttachmentListView.prototype.elClass = 'lf-attachment-list-view';

/** @override */
AttachmentListView.prototype.events = (function () {
    var events = {};
    events['click .' + AttachmentListView.prototype.classes.DISCARD_X] = '_handleRemove';
    return events;
})();

AttachmentListView.prototype._handleRemove = function (ev) {
    var id = ev.target.parentNode.getAttribute(this.classes.DATA_ID);
    this.remove(this._viewMap[id]);
    this._viewMap[id] = null;
};

/** @override */
AttachmentListView.prototype.add = function (content) {
    var newView = new AttachmentView({
        oembed: content.attachments[0]
    });
    newView.$el.attr(this.classes.DATA_ID, newView.uid);
    this._viewMap[newView.uid] = newView;

    return ListView.prototype.add.call(this, newView);
};

/**
 * Clear all currently displayed attachments
 */
AttachmentListView.prototype.clearAttachments = function () {
    while (this.views.length) {
        this.remove(this.views[0]);
    }
    this._viewMap = {};
};

/** @override */
AttachmentListView.prototype.render = function () {
    ListView.prototype.render.call(this);
    for (var i = 0; i < this.views.length; i++) {
        ListView.prototype._insert.call(this, this.views[i]);
    }
};

/**
 * Get all the attachments in view
 * @return {Array.<Oembed>}
 */
AttachmentListView.prototype.getAttachments = function () {
    var attachments = [];
    for (var i = 0; i < this.views.length; i++) {
        attachments.push(this.views[i].opts.oembed);
    }
    return attachments;
};

module.exports = AttachmentListView;

});

define('streamhub-sdk/auth/auth-optional',['require','exports','module'],function (require, exports, module) {/**
 * auth-optional
 * A stub of `auth` that will work as if
 * no delegate is registered and no user
 * is logged in.
 */
module.exports = {
    get: function () {},
    login: function () {},
    logout: function () {},
    hasDelegate: function () {},
    on: function () {},
    isAuthenticated: function () {}
};

});

define('auth/main',['require','exports','module','streamhub-sdk/auth/auth-optional'],function (require, exports, module) {var authOptional = require('streamhub-sdk/auth/auth-optional');
var auth;

auth = authOptional;
console.log('stub');

if (typeof Livefyre !== 'undefined' &&
    typeof Livefyre['auth'] === 'object') {
    auth = Livefyre['auth'];
}

module.exports = auth;

});

define('auth', ['auth/main'], function (main) { return main; });

define('streamhub-sdk/auth/main',['auth', 'inherits', 'event-emitter', 'streamhub-sdk/debug'],
function (auth, inherits, EventEmitter, debug) {
    


    var log = debug('streamhub-sdk/auth');


    /**
     * An object that knows about the authenticated user
     */
    var Auth = new EventEmitter();


    /**
     * Set the Auth token
     * This is deprecated now. You should use the `auth` module's
     * `.authenticate({ livefyre: token })` method
     * But will be supported in streamhub-sdk v2 for backward compatability
     * @param token {string} A Livefyre authentication token,
     *     as described at http://bit.ly/17SYaoT
     */
    Auth.setToken = function (token) {
        log('.setToken', token);
        this._token = token;
        this.emit('token', token);
    };


    /**
     * Get the Auth token
     * @return A token, if one has been set, else undefined
     */
    Auth.getToken = function () {
        var livefyreUser = auth.get('livefyre');
        if ( ! livefyreUser) {
            return this._token;
        }
        return livefyreUser.get('token');
    };


    /**
     * An Error that represents that an operation could not be performed
     * because the user has not been authorized. Semantics like HTTP 401
     */
    var UnauthorizedError = function (message) {
        Error.apply(this, arguments);
        this.message = message;
    };
    inherits(UnauthorizedError, Error);
    UnauthorizedError.prototype.name = "UnauthorizedError";


    Auth.UnauthorizedError = UnauthorizedError;
    return Auth;
});

define('streamhub-sdk/auth', ['streamhub-sdk/auth/main'], function (main) { return main; });

define('streamhub-sdk/ui/command',['require','exports','module','event-emitter','inherits'],function (require, exports, module) {

var EventEmitter = require('event-emitter');
var inherits = require('inherits');

/**
 * Does work
 * @constructor
 * @param fn {function} The work to do
 * @param [opts] {Object}
 * @param [opts.enable] {boolean} Set false to disable this command be default.
 */
function Command (fn, opts) {
    opts = opts || {};
    if (!fn) {
        throw 'A function needs to be specified to construct a Command';
    }

    // Allow for passing another command as fn
    if (fn instanceof Command) {
        var fnCommand = fn;
        fn = function () {
            fnCommand.execute.apply(fnCommand, arguments);
        }.bind(this);
    }

    this._execute = fn;
    this._canExecute = (opts.enable !== false) ? true : false;
    EventEmitter.call(this);
}
inherits(Command, EventEmitter);

/**
 * Execute the Command
 */
Command.prototype.execute = function (errback) {
    this.canExecute() && this._execute.apply(this, arguments);
};

/**
 * Enable the Command
 */
Command.prototype.enable = function () {
    this._changeCanExecute(true);
};

/**
 * Disable the Command, discouraging its Execution
 */
Command.prototype.disable = function () {
    this._changeCanExecute(false);
};

/**
 * Change whether the Command can be executed
 * @protected
 * @param canExecute {!boolean}
 */
Command.prototype._changeCanExecute = function (canExecute) {
    this._canExecute = canExecute;
    this._emitChangeCanExecute();
};

/**
 * Emits a change of whether the Command can be executed
 * @protected
 */
Command.prototype._emitChangeCanExecute = function () {
    this.emit('change:canExecute', this.canExecute());
};

/**
 * Check whether the Command can be executed
 * @returns {!boolean}
 */
Command.prototype.canExecute = function () {
    return this._canExecute;
};

module.exports = Command;

});

define('streamhub-sdk/util',['streamhub-sdk/debug', 'streamhub-sdk/jquery'], function (debug, $) {
    

    var log = debug('util');

    /** 
     * A module containing utility methods.
     * @module streamhub-sdk/util
     */
    var exports = {};

    /**
     * Get outerWidth (jquery-style) of element
     * @deprecated
     */
    exports.outerWidth = function(el) {
        log('Deprecated: util.outerWidth');
        return $(el).outerWidth(true);
    };

    /**
     * Get outerHeight (jquery-style) of element
     * @deprecated
     */
    exports.outerHeight = function(el) {
        log('Deprecated: util.outerHeight');
        return $(el).outerHeight(true);
    };

    /**
     * Get innerWidth (jquery-style) of element
     * @deprecated
     */
    exports.innerWidth = function(el) {
        log('Deprecated: util.innerWidth');
        return $(el).innerWidth();
    };

    /**
     * Get innerHeight (jquery-style) of element
     * @deprecated
     */
    exports.innerHeight = function(el) {
        log('Deprecated: util.innerHeight');
        return $(el).innerHeight();
    };

    /**
     * Format a date object to be displayed to humans
     * @param date {Date} A JavaScript Date object
     * @return {string} A formatted timestamp like "5/27//06 • 3:26 AM"
     */
    var MONTH_STRINGS = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun','Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec'
    ];

    exports.formatDate = function (date, relativeTo) {
        relativeTo = relativeTo || new Date();
        var diffMs = date.getTime() - relativeTo.getTime(),
            dateString;
        // Future
        if (diffMs > 0) {
            return '';
        }
        // Less than 60s ago -> 5s
        if (diffMs > -60 * 1000) {
            return Math.round( -1 * diffMs / 1000) + 's';
        }
        // Less than 1h ago -> 5m
        if (diffMs > -60 * 60 * 1000) {
            return Math.round( -1 * diffMs / (1000 * 60)) + 'm';
        }
        // Less than 24h ago -> 5h
        if (diffMs > -60 * 60 * 24 * 1000) {
            return Math.round( -1 * diffMs / (1000 * 60 * 60)) + 'h';
        }
        // >= 24h ago -> 6 Jul
        dateString = date.getDate() + ' ' + MONTH_STRINGS[date.getMonth()];
        // or like 6 Jul 2012 if the year if its different than the relativeTo year
        if (date.getFullYear() !== relativeTo.getFullYear()) {
            dateString += ' ' + date.getFullYear();
        }
        return dateString;
    };

    exports.objectKeys = Object.keys || (function () {
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
            if (typeof o !== "object" && typeof o !== "function" || o === null) {
                throw new TypeError("objectKeys called on a non-object");
            }

            var result = [];
            for (var name in o) {
                if (hasOwnProperty.call(o, name)) {
                    result.push(name);
                }
            }

            if (hasDontEnumBug) {
                for (var i = 0; i < DontEnumsLength; i++) {
                    if (hasOwnProperty.call(o, DontEnums[i])) {
                        result.push(DontEnums[i]);
                    }
                }
            }

            return result;
        };
    })();

    Array.prototype.indexOf = Array.prototype.indexOf || function(val) {
        return $.inArray(val, this);
    };

    return exports;
});

define('streamhub-sdk/ui/auth-required-command',['require','exports','module','auth','streamhub-sdk/auth','streamhub-sdk/ui/command','inherits','streamhub-sdk/debug','streamhub-sdk/util'],function (require, exports, module) {var auth = require('auth');
var Auth = require('streamhub-sdk/auth');
var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('streamhub-sdk/ui/auth-required-command');
var util = require('streamhub-sdk/util');



/**
 * Wraps a command and only allows that command to be called if the user is
 * authenticated. If the user isn't authenticated and the developer provides
 * an authentication command, then the authentication command will be executed.
 * @param [command] {Command} Option function to replace the default function.
 * @param [opts] {Object}
 * @param [opts.authenticate] {function} Function that will authenticate a user,
 *      hasn't already authenticated, then call a provided callback
 * @constructor
 * @extends {Command}
 */
var AuthRequiredCommand = function (command, opts) {
    var self = this;
    opts = opts || {};
    this._authCmd = command || new Command(function () {});
    Command.call(this, this._authCmd, opts);
    if (opts.authenticate) {
        this._authenticate = opts.authenticate;
    }

    auth.on('delegate', function () {
        if (auth.hasDelegate()) {
            self.enable();
        }
    });
};
inherits(AuthRequiredCommand, Command);

/**
 * Execute the Command
 * @override
 */
AuthRequiredCommand.prototype.execute = function () {
    var self = this;
    var executeArgs = arguments;

    function isAuthenticated () {
        return auth.get('livefyre');
    }

    /**
     * This callback executes this command, wrapped so that it can be passed
     * to an authenticating command to be called after authentication.
     */
    function doWorkWithAuth() {
        Command.prototype.execute.apply(self, arguments);
    }

    if (isAuthenticated()) {
        doWorkWithAuth.apply(self, executeArgs);
    } else {
        auth.login(function (err, user) {
            if (err) {
                this.emit('loginError.hub', err);
                return;
            }
            doWorkWithAuth.apply(self, executeArgs);
        });
    }
};

/**
 * Check whether the Command can be executed.
 * 
 * return | _command.canExecute() | auth.isAuthenticated() | _authCmd.canExecute()
 * -------|-----------------------|------------------------|----------------------
 *  false |         false         |                        |
 *  true  |         true          |     truthy             |
 *  false |         true          |     falsy              |      false
 *  true  |         true          |     falsy              |      true
 * -------------------------------------------------------------------------------
 * @returns {!boolean}
 */
AuthRequiredCommand.prototype.canExecute = function () {
    if (! auth.hasDelegate('login')) {
        return false;
    }
    return Command.prototype.canExecute.apply(this, arguments) && this._authCmd.canExecute();
};

/**
 * Prepares this command for trash collection.
 */
AuthRequiredCommand.prototype.destroy = function () {
    this._listeners = null;//EventEmitter
};

module.exports = AuthRequiredCommand;

});

define("hgn!streamhub-sdk/ui/templates/button", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("buttonUrl",c,p,1),c,p,0,14,87,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <a href=\"");_.b(_.t(_.f("buttonUrl",c,p,0)));_.b("\" target=\"_blank\">");_.b(_.t(_.f("buttonLabel",c,p,0)));_.b("</a>");_.b("\n");});c.pop();}if(!_.s(_.f("buttonUrl",c,p,1),c,p,1,0,0,"")){_.b("    ");_.b(_.t(_.f("buttonLabel",c,p,0)));_.b("\n");};return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/ui/button',['require','exports','module','hgn!streamhub-sdk/ui/templates/button','streamhub-sdk/ui/command','inherits','view'],function (require, exports, module) {

var ButtonTemplate = require('hgn!streamhub-sdk/ui/templates/button');
var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var View = require('view');

/**
 * A View that, when clicked, executes a Command
 */
function Button (command, opts) {
    opts = opts || {};
    if (opts.elClassPrefix) {
        this.elClassPrefix = opts.elClassPrefix;
    }
    if (opts.className) {
        this.elClass += ' '+opts.className;
    }
    if (this.elClassPrefix) {
        this.elClass = distributeClassPrefix(this.elClassPrefix, this.elClass);
    }
    this._disabled = false;
    this._label = opts.label || '';
    this._errback = opts.errback;

    View.call(this, opts);

    if (typeof command === 'function') {
        command = new Command(command);
    }
    if (command) {
        this._setCommand(command);
    }
}
inherits(Button, View);

function distributeClassPrefix(prefix, classAttr) {
    var classTemplate = "{prefix}-{class}";
    var classes = classAttr
        .split(' ')
        .filter(function (s) { return s; })
        .map(function (oneClass) {
            var prefixedClass = classTemplate
                .replace('{prefix}', prefix)
                .replace('{class}', oneClass);
            return prefixedClass;
        });
    return classes.join(' ');
}

// DOM Event Listeners
Button.prototype.events = View.prototype.events.extended({
    click: '_execute'
});

Button.prototype.elClassPrefix = 'lf';
Button.prototype.elClass += 'btn';
Button.prototype.template = ButtonTemplate;

/**
 * The CSS Class to put on this.$el when the command is
 * not allowed to be executed
 */
Button.prototype.disabledClass = 'disabled';

/** Disable the button */
Button.prototype.disable = function () {
    this._setEnabled(false);
};

/** Enable the button */
Button.prototype.enable = function () {
    this._setEnabled(true);
};

Button.prototype.updateLabel = function (label) {
    this._label = label;
    this.render();
};

Button.prototype.render = function () {
    View.prototype.render.call(this);
};

Button.prototype.getTemplateContext = function () {
    var context = {};
    context.buttonLabel = this._label;

    return context;
};

/**
 * Execute the button's command
 * @protected
 */
Button.prototype._execute = function () {
    !this._disabled && this._command.execute(this._errback);
};

/**
 * Set the Command that the Button executes.
 * Only intended to be called once
 * @protected
 * @param command {Command}
 */
Button.prototype._setCommand = function (command) {
    var self = this;
    this._command = command;
    this._setEnabled(this._command.canExecute());
    this._command.on('change:canExecute', function (canExecute) {
        self._setEnabled(canExecute);
    });
};

/**
 * Set whether the Button is enabled or not
 * @protected
 * @param {boolean} isEnabled - Whether the button should be enabled
 */
Button.prototype._setEnabled = function (isEnabled) {
    this.$el.toggleClass(this.disabledClass, ! isEnabled);
    this._disabled = !isEnabled;
};

module.exports = Button;

});

define('streamhub-sdk/content/main',[
    'streamhub-sdk/jquery',
    'event-emitter',
    'inherits'
], function($, EventEmitter, inherits, Enums) {
    

    /**
     * A piece of Web Content
     * @param body {!string|{body: string}} A string of HTML, the Content body.
     *     If an object, it should have a .body property
     * @fires Content#attachment
     * @fires Content#removeAttachment
     * @exports streamhub-sdk/content
     * @constructor
     */
    var Content = function(bodyOrObj) {
        var body = bodyOrObj;
        var obj = {};
        EventEmitter.call(this);
        if (typeof bodyOrObj === 'object') {
            body = body.body;
            obj = bodyOrObj;
        }
        this.body = body;
        var vis = (typeof obj.visibility === 'number') ? obj.visibility :
            (typeof obj.vis === 'number') ? obj.vis : 1;
        this.visibility = Content.enums.visibility[vis];
        this.attachments = obj.attachments || [];
        this.replies = obj.replies || [];
        this.opines = obj.opines || [];
    };
    inherits(Content, EventEmitter);

    Content.prototype.typeUrn = 'urn:livefyre:js:streamhub-sdk:content';

    /**
     * Attach an Oembed to the Content
     * @param obj {Oembed} An Oembed Content instance to attach
     * @fires Content#attachment
     */
    Content.prototype.addAttachment = function(obj) {
        this.attachments.push(obj);
        this.emit('attachment', obj);
    };

    /**
     * Remove an Oembed from the Content
     * @param obj {Oembed} An Oembed Content instance to attach
     * @fires Content#removeAttachment
     */
    Content.prototype.removeAttachment = function(obj) {
        this.attachments.splice(this.attachments.indexOf(obj), 1);
        this.emit('removeAttachment', obj);
    };

    /**
     * Add a reply to the Content
     * @param obj {Content} A piece of Content in reply to this one
     * @fires Content#addReply
     */
    Content.prototype.addReply = function(obj) {
        this.replies.push(obj);
        this.emit('reply', obj);
    };

    /**
     * Set some properties and emit 'change' and 'change:{property}' events
     * @param newProperties {Object} An object of properties to set on this Content
     * @param silence [boolean] Mute any events that would be fired
     * @fires Content#change
     * @fires Content#event:change:_property_
     */
    Content.prototype.set = function (newProperties, silence) {
        newProperties = newProperties || {};
        var oldProperties = {};
        var oldVal, newVal, changed;
        for (var key in newProperties) {
            if (newProperties.hasOwnProperty(key) && key.charAt(0) !== '_') {//ignore _listeners and others
                oldVal = oldProperties[key] = this[key];
                newVal = this[key] = newProperties[key];
                if (newVal !== oldVal || typeof newVal === 'object') {
                    silence || this.emit('change:'+key, newVal, oldVal);//Will emit 'change:visibility'
                    changed = true;
                }
            }
        }
        if (changed) {
            silence || this.emit('change', newProperties, oldProperties);
        }
    };

    Content.enums = {};
    /**
     * The StreamHub APIs use enumerations to define
     * the visibility of messages sent down the wire. All levels of
     * visibility should be in this enumeration.
     * @enum visibility
     * @property {string} visibility.NONE - Should not be displayed.
     * @property {string} visibility.EVERYONE - Visible to all.
     * @property {string} visibility.OWNER - Visible only to the author.
     * @property {string} visibility.GROUP - Visible to privileged users.
     */
    Content.enums.visibility = [
        'NONE',
        'EVERYONE',
        'OWNER',
        'GROUP'
    ];

    return Content;
});

define('streamhub-sdk/content', ['streamhub-sdk/content/main'], function (main) { return main; });

define("hgn!streamhub-input/templates/content-editor", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<section class=\"lf-content-editor\">");_.b("\n" + i);_.b("    <div class=\"lf-user-info\">");_.b("\n" + i);_.b("        <span class=\"lf-name\">");_.b(_.v(_.d("strings.username",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"lf-editor-container\">");_.b("\n" + i);_.b(_.rp("editor",c,p,"        "));_.b("    </div>");_.b("\n" + i);if(_.s(_.f("mediaEnabled",c,p,1),c,p,0,229,286,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <div class=\"lf-attachment-list-view\"></div>");_.b("\n");});c.pop();}_.b("    <div class=\"lf-btn-wrapper\">");_.b("\n" + i);if(_.s(_.f("mediaEnabled",c,p,1),c,p,0,362,420,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <div class=\"lf-editor-upload\"></div>");_.b("\n");});c.pop();}_.b("        <button class=\"lf-btn lf-input-btn lf-content-editor-post\">");_.b(_.v(_.d("strings.post",c,p,0)));_.b(" </button>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("</section>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define("hgn!streamhub-editor/templates/editorerror", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"lf-editor-error\">");_.b("\n" + i);_.b("    <a class=\"lf-close fycon-x\"></a>");_.b("\n" + i);_.b("    <span class=\"lf-error-message\">");_.b(_.t(_.f("msg",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-editor/util',['require','exports','module'],function (require, exports, module) {/**
 * @fileoverview Util functions that are useful the other modules.
 */

var util = {};

/**
 * Abstract function. This is wicked awesome for ensuring that all of the
 * functions get overridden when using the inheritance pattern.
 */
util.abstractMethod = function() {
    throw 'Function must be implemented.';
};

/**
 * Convert newline chars to <p> tags
 * @param {string} content
 * @returns {string}
 */
util.normalizeNewlines = function (content) {
    content = content.replace(/(\s*)$/, '');
    content = '<p>' + content.split('\n').join('</p><p>') + '</p>';
    return content;
};

/**
 * Focus a textarea and place the cursor at the end of the text.
 * @param {jQuery.Element}
 */
util.focusAndPlaceCursorAtEnd = function ($textareaEl) {
    var textareaEl = $textareaEl[0];
    $textareaEl.focus();
    if (textareaEl.setSelectionRange) {
        var len = $textareaEl.val().length * 2;  // * 2 works to force the final char.
        textareaEl.setSelectionRange(len, len);
    } else {
        $textareaEl.val($textareaEl.val());
    }
};

module.exports = util;

});

define("hgn!streamhub-editor/templates/editor", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"lf-editor-resize\" />");_.b("\n" + i);_.b("<textarea class='lf-editor-field'></textarea>");_.b("\n" + i);_.b("<a class='lf-editor-post-btn'>");_.b(_.v(_.d("strings.postBtn",c,p,0)));_.b("</a>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-editor/editor',['require','exports','module','jquery','hgn!streamhub-editor/templates/editorerror','view/event-map','inherits','streamhub-editor/util','view','hgn!streamhub-editor/templates/editor'],function (require, exports, module) {/**
 * @fileOverview The editor view class. This contains the editor box and any
 * buttons that go along with it.
 */

var $ = require('jquery');
var errorTemplate = require('hgn!streamhub-editor/templates/editorerror');
var EventMap = require('view/event-map');
var inherits = require('inherits');
var util = require('streamhub-editor/util');
var View = require('view');

/**
 * Editor view.
 * @constructor
 * @extends {View}
 * @param {Object} opts Config options.
 */
var Editor = function(opts) {
    View.call(this, opts);

    /**
     * The original height of the editor. This is set in the render function
     * so that we know how big to reset the height to.
     * @type {?number}
     * @private
     */
    this._originalHeight = null;

    /**
     * Whether placeholders are supported or not.
     * @type {boolean}
     * @private
     */
    this._placeholderSupported = true;

    // overridable strings
    this._i18n = $.extend(true, {}, this._i18n, opts.i18n);
};
inherits(Editor, View);

/** @enum {string} */
Editor.prototype._i18n = {
    PLACEHOLDERTEXT: 'The Call of the Comment',
    POST: 'Post',
    ERRORS: {
        BODY: 'Please add a message',
        GENERIC: 'There was an error'
    }
};

/** @enum {string} */
Editor.prototype.classes = {
    FIELD: 'lf-editor-field',
    FOCUS: 'lf-editor-focus',
    RESIZE: 'lf-editor-resize',
    POST_BTN: 'lf-editor-post-btn'
};

/** @override */
Editor.prototype.events = new EventMap((function() {
    var classes = Editor.prototype.classes;
    var events = {};
    events['blur .' + classes.FIELD] = '_handleEditorBlur';
    events['click .' + classes.POST_BTN] = '_handlePostBtnClick';
    events['focus .' + classes.FIELD] = '_handleEditorFocus';
    events['keydown .' + classes.FIELD] = '_handleEditorKeydown';
    events['keyup .' + classes.FIELD] = '_handleEditorKeyup';
    return events;
})());

/**
 * Get the contents of the editor and do any processing required.
 * @return {string}
 * @private
 */
Editor.prototype._getContents = function () {
    return util.normalizeNewlines(this.$textareaEl.val());
};

/**
 * Handle the blur event in the textarea.
 * @private
 */
Editor.prototype._handleEditorBlur = function () {
    this.$el.toggleClass(this.classes.FOCUS, false);

    if (this._placeholderSupported || this.$textareaEl.val() !== '') {
        return;
    }
    this.$textareaEl.val(this._i18n.PLACEHOLDERTEXT);
};

/**
 * Handle the focus event in the textarea.
 * @private
 */
Editor.prototype._handleEditorFocus = function () {
    this.$el.toggleClass(this.classes.FOCUS, true);

    if (this._placeholderSupported) {
        return;
    }

    if (this.$textareaEl.val() !== this._i18n.PLACEHOLDERTEXT) {
        return;
    }
    this.$textareaEl.val('');
};

/**
 * Handle the keydown event in the textarea.
 * @param {jQuery.Event} ev
 * @private
 */
Editor.prototype._handleEditorKeydown = function (ev) {
    ev.stopPropagation();
    this._resize();
    var isEnter = ev.keyCode === 13;
    if (!isEnter || ev.shiftKey) {
        return;
    }
    ev.preventDefault();
    this.handlePostBtnClick();
};

/**
 * Handle the keyup event in the textarea.
 * @param {jQuery.Event} ev
 * @private
 */
Editor.prototype._handleEditorKeyup = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this._resize();
};

/**
 * Handle the post button click event. This should validate the data and
 * dispatch a post event that a controller can handle.
 */
Editor.prototype._handlePostBtnClick = function() {
    var data = this.buildPostEventObj();
    if (!this._validate(data)) {
        return;
    }
    this.sendPostEvent(data);
};

/**
 * Post failure callback.
 * @param {Object} data The response data.
 */
Editor.prototype._handlePostFailure = util.abstractMethod;

/**
 * Post success callback.
 * @param {Object} data The response data.
 */
Editor.prototype._handlePostSuccess = util.abstractMethod;

/**
 * Process the placeholder shenanigans that need to happen because IE 9- doesn't
 * support placeholders on textareas.
 * @private
 */
Editor.prototype._processPlaceholders = function () {
    if (this.$textareaEl[0].placeholder !== undefined) {
        this.$textareaEl.attr('placeholder', this._i18n.PLACEHOLDERTEXT);
        return;
    }
    this._placeholderSupported = false;
    this.$textareaEl.val(this._i18n.PLACEHOLDERTEXT);
};

/**
 * Resize the editor.
 * @private
 */
Editor.prototype._resize = function () {
    var content = this.$textareaEl.val();
    var height = 0;
    this.$resizeEl.html(util.normalizeNewlines(content));
    $.each(this.$resizeEl.children(), function (i, child) {
        height += $(child).height();
    });
    this.$textareaEl.height(height);
};

/**
 * Validate the post data.
 * @param {Object} data The post data to be validated.
 * @return {boolean} Whether the post data is valid or not.
 */
Editor.prototype._validate = function(data) {
    if (!data.body) {
        this.showError(this._i18n.ERRORS.BODY);
        return false;
    }
    return true;
};

/**
 * Build the post event object that will be dispatched from the editor.
 * @return {Object} The post event object.
 */
Editor.prototype.buildPostEventObj = function() {
    var event = {};
    event.body = this.$textareaEl.val();
    event.failure = $.proxy(this._handlePostFailure, this);
    event.success = $.proxy(this._handlePostSuccess, this);
    return event;
};

/**
 * Focus on the textarea.
 */
Editor.prototype.focus = function () {
    util.focusAndPlaceCursorAtEnd(this.$textareaEl);
};

/**
 * Initialize the editor view. This keeps track of the original height of the
 * field and focuses on the textarea.
 * This should be called once the editor is in the DOM.
 */
Editor.prototype.initialize = function () {
    this._originalHeight = this.$textareaEl.height();
    this.focus();
};

/** @override */
Editor.prototype.getTemplateContext = function () {
    return {
        strings: {
            post: this._i18n.POST
        }
    };
};

/** @override */
Editor.prototype.render = function() {
    View.prototype.render.call(this);
    this.$resizeEl = this.getElementsByClass(this.classes.RESIZE);
    this.$textareaEl = this.getElementsByClass(this.classes.FIELD);
    this.$errorContainer = this.$el;
    this._processPlaceholders();
};

/**
 * Reset the editor back to it's original state.
 */
Editor.prototype.reset = function () {
    this.$resizeEl.html('');
    this.$textareaEl.val('');
    this.$textareaEl.height(this._originalHeight);
};

/** @override */
Editor.prototype.template = require('hgn!streamhub-editor/templates/editor');

/**
 * Send the post event.
 * @param {Object} data The post data to send.
 */
Editor.prototype.sendPostEvent = util.abstractMethod;

/**
 * Show an error message to the user.
 * @param {string} msg The error message to display.
 */
Editor.prototype.showError = function (msg) {
    if (this.$errorEl) {
        return;
    }

    // TODO (mark): Eventually we'll want to have a map for error event types
    // but the SDK only returns error message strings which are useless to us.
    this.$errorEl = $(errorTemplate({msg: msg}));
    this.$errorContainer.append(this.$errorEl);
    this.$errorEl.fadeTo(500, 0.98);
    this.$textareaEl.blur();

    this.$errorEl.one('click', $.proxy(function (ev) {
        ev.stopPropagation();
        this.$errorEl.remove();
        this.$errorEl = null;
        this.focus();
    }, this));
};

module.exports = Editor;

});

define('observer',[],function() {

    var listenIds = 0;

    /**
     * An Observable mixin for use with EventEmitter
     * @param {Object} that
     * @exports streamhub-sdk/observer
     */
    function Observer(that) {
        that._listeningTo = {};
        that.listenTo = listenTo;
        that.stopListening = stopListening;
        return that;
    };

    /**
     * Listen to the event on the provided object
     * @param {EventEmitter} obj
     * @param {string} name
     * @param {function()} callback
     */
    function listenTo(obj, name, callback) {
        var id = obj._listenId || (obj._listenId = listenIds++ + '');

        // TODO: simplify
        this._listeningTo[id] = this._listeningTo[id] || {};
        this._listeningTo[id].obj = obj;
        this._listeningTo[id].listeners = this._listeningTo[id].listeners || {};
        this._listeningTo[id].listeners[name] = this._listeningTo[id].listeners[name] || [];
        this._listeningTo[id].listeners[name].push(callback);

        obj.on(name, callback);
    }

    /**
     * Stop listening to the provided object
     * @param {?EventEmitter} obj
     */
    function stopListening(obj) {
        if (obj) {
            removeListenersForObj.call(this, obj._listenId);
            return;
        }
        // TODO: name/callback granularity
        for (var id in this._listeningTo) {
            if (!this._listeningTo.hasOwnProperty(id)) {
                continue;
            }
            removeListenersForObj.call(this, id)
        }
    }

    function removeListenersForObj(id) {
        if (!this._listeningTo[id]) {
            return;
        }

        var obj = this._listeningTo[id].obj;
        var listeners = this._listeningTo[id].listeners;
        var callbacks;
        for (var name in listeners) {
            if (!listeners.hasOwnProperty(name)) {
                continue;
            }

            callbacks = listeners[name];
            for (var i = 0; i < callbacks.length; i++) {
                obj.removeListener(name, callbacks[i]);
            }
        }
        delete this._listeningTo[id];
    }

    return Observer;
});

define('streamhub-input/javascript/pipeable',['require','exports','module'],function (require, exports, module) {/**
 * An input specific implementation of a readable that actively writes new content to a destination.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 */
function Pipeable(opts) {
    opts = opts || {};
    this._destination = opts.destination || null;
}

/**
 * @param {Writable} writable
 */
Pipeable.prototype.pipe = function (writable) {
    this._destination = writable;
};

/**
 * Set the destination to null
 */
Pipeable.prototype.unpipe = function () {
    this._destination = null;
};

/**
 * @param {Object} data
 * @param {function(?Error, Object)} cb
 */
Pipeable.prototype.writeToDestination = function (data, cb) {
    if (!this._destination) {
        debugger
        throw 'No destination to write to';
        return;
    }
    this._destination.write(data, cb);
};

module.exports = Pipeable;

});

define('streamhub-input/javascript/button',['require','exports','module','streamhub-sdk/ui/auth-required-command','streamhub-sdk/ui/button','inherits'],function (require, exports, module) {var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var inherits = require('inherits');



/**
 * @param command {Command} Command to execute.
 * @param [opts] {Object}
 * @param [opts.input] {Pipeable} The Input source.
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @constructor
 * @extends {Button}
 */
 function InputButton(command, opts) {
    opts = opts || {};
    /**
     * @type {?Pipeable}
     */
    this._input = opts.input || null;

    opts.destination && this.pipe(opts.destination);

    if (opts.authRequired !== false) {
        command = new AuthRequiredCommand(command);
    }

    Button.call(this, command, opts);
}
inherits(InputButton, Button);

/** @override */
InputButton.prototype.elClass += ' input-btn';

/** @override */
InputButton.prototype.elTag = 'button';

/**
 * Facade for button's input.
 * @param {Writable} writable
 */
InputButton.prototype.pipe = function (writeable) {
    this._input && this._input.pipe(writeable);
};

/**
 * Facade for button's input.
 * @param {Writable} writable
 */
InputButton.prototype.unpipe = function (writeable) {
    this._input && this._input.unpipe(writeable);
};

module.exports = InputButton;

});

define('streamhub-input/javascript/util',['require','exports','module'],function (require, exports, module) {module.exports = {
    nullFunction: function () {}
};

});

define('streamhub-input/javascript/modal/modal-input-command',['require','exports','module','streamhub-sdk/ui/command','inherits','streamhub-input/javascript/util'],function (require, exports, module) {var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var util = require('streamhub-input/javascript/util');



/**
 * A command that, when executed, shows the modal version of an Input view. Requires that
 * the view implements LaunchableModal
 * @param view {LaunchableModal} View to launch as a modal
 * @param [opts] {Object}
 * @param [opts.callback] {function(err: Object, data: Object)}
 *      Called when the modal view has accomplished its goal.
 * @constructor
 * @extends {Command}
 */
function ModalInputCommand(view, opts) {
    opts = opts || {};
    if (!view) {
        throw 'Can\'t instanciate a ModalInputCommand without specifying a view';
    }
    var self = this;
    function cmd(cb) {
        self.view.launchModal(cb || opts.callback || util.nullFunction);
    }

    /**
     * The Input instance that will be launched into a modal
     * @type {!Input}
     */
    this.view = view;

    Command.call(this, cmd, opts);
}
inherits(ModalInputCommand, Command);

/** @override */
ModalInputCommand.prototype.canExecute = function () {
    return (this.view) ? true : false;
};

module.exports = ModalInputCommand;

});

define("hgn!streamhub-sdk/content/templates/oembed-photo", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachment\">");_.b("\n" + i);_.b("    <div class=\"content-attachment-frame\"></div>");_.b("\n" + i);_.b("    <div class=\"content-attachment-photo\" style=\"background-image: url('");_.b(_.t(_.f("url",c,p,0)));_.b("');\">");_.b("\n" + i);_.b("        <img class=\"content-attachment-actual-image\" src=\"");_.b(_.t(_.f("url",c,p,0)));_.b("\"/>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define("hgn!streamhub-sdk/content/templates/oembed-video", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachment\">");_.b("\n" + i);_.b("    <div class=\"content-attachment-frame\"></div>");_.b("\n" + i);_.b("    <div class=\"content-attachment-photo\" style=\"background-image: url(");_.b(_.t(_.f("thumbnail_url",c,p,0)));_.b(");\">");_.b("\n" + i);_.b("        <div class=\"content-attachment-controls content-attachment-controls-play\"></div>");_.b("\n" + i);_.b("        <img class=\"content-attachment-actual-image\" src=\"");_.b(_.t(_.f("thumbnail_url",c,p,0)));_.b("\"/>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"content-attachment-video\">");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define("hgn!streamhub-sdk/content/templates/oembed-link", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachment content-attachment-link\">");_.b("\n" + i);_.b("    <div class=\"content-attachment-frame\"></div>");_.b("\n" + i);if(_.s(_.f("thumbnail_url",c,p,1),c,p,0,128,218,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <img class=\"content-attachment-link-thumbnail\" src=\"");_.b(_.t(_.f("thumbnail_url",c,p,0)));_.b("\"/>");_.b("\n");});c.pop();}_.b("    <div class=\"content-attachment-link-body\">");_.b("\n" + i);_.b("        <a href=\"");_.b(_.t(_.f("url",c,p,0)));_.b("\" target=\"_blank\">");_.b(_.t(_.f("title",c,p,0)));_.b("</a>");_.b("\n" + i);_.b("        <p class=\"content-attachment-provider\">via ");_.b(_.t(_.f("provider_name",c,p,0)));_.b("</p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define("hgn!streamhub-sdk/content/templates/oembed-rich", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachment content-attachment-rich\">");_.b("\n" + i);_.b("    <div class=\"content-attachment-frame\"></div>");_.b("\n" + i);_.b("    ");_.b(_.t(_.f("html",c,p,0)));_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/content/views/oembed-view',[
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'hgn!streamhub-sdk/content/templates/oembed-photo',
    'hgn!streamhub-sdk/content/templates/oembed-video',
    'hgn!streamhub-sdk/content/templates/oembed-link',
    'hgn!streamhub-sdk/content/templates/oembed-rich',
    'inherits'
],
function($, View, OembedPhotoTemplate, OembedVideoTemplate, OembedLinkTemplate, OembedRichTemplate, inherits) {
    

    /**
     * A view that renders oembed attachments
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.oembed {Object} The oembed attachment object to display
     * @fires OembedView#imageLoaded.hub
     * @fires OembedView#imageError.hub
     * @exports streamhub-sdk/content/views/oembed-view
     * @constructor
     */
    var OembedView = function(opts) {
        this.oembed = opts.oembed || {};
        View.call(this, opts);

        if (!this.oembed) {
            return;
        }
        this.template = this.OEMBED_TEMPLATES[this.oembed.type];
    };
    inherits(OembedView, View);

    /**
     * A mapping of oembed type to its mustache template for rendering 
     * @readonly
     * @enum {Template}
     */
    OembedView.prototype.OEMBED_TEMPLATES = {
        'photo': OembedPhotoTemplate,
        'video': OembedVideoTemplate,
        'link':  OembedLinkTemplate,
        'rich':  OembedRichTemplate
    };

    /**
     * Renders the template and appends itself to this.el
     * For oembed types with thumbnails attach image load/error handlers
     */
    OembedView.prototype.render = function() {
        // YouTube oembed thumbnails (hqdefault.jpg) include a letterbox for 16:9 aspect ratio
        // videos. Use mqdefault.jpg instead as it does not have letterboxing.
        // http://kb.oboxsites.com/knowledgebase/how-to-remove-black-bars-on-youtube-oembed-thumbnails/
        if (this.oembed.provider_name === 'YouTube') {
            var re = /(hqdefault.jpg)$/;
            if (re.test(this.oembed.thumbnail_url)) {
                this.oembed.thumbnail_url = this.oembed.thumbnail_url.replace(re, 'mqdefault.jpg');
            }
        }
        var context = $.extend({}, this.oembed);
        this.$el.html(this.template(context));

        if (this.oembed.type !== 'photo' && this.oembed.type !== 'video') {
            return;
        }

        // handle oembed loading gracefully
        var self = this;
        var newImg = this.$el.find('img.content-attachment-actual-image');
        newImg.hide();
        newImg.on('load', function() {
            if (newImg.parent().is('.content-attachment-photo')) {
                newImg.parent().fadeIn();
            } else {
                newImg.fadeIn();
            }
            /**
             * Image load success
             * @event OembedView#imageLoaded.hub
             */
            self.$el.trigger('imageLoaded.hub');
        });
        newImg.on('error', function() {
            /**
             * Image load error
             * @event OembedView#imageError.hub
             */
            self.$el.trigger('imageError.hub', self.oembed);
        });
    };

    return OembedView;
});

define("hgn!streamhub-sdk/content/templates/attachment-list", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachments-stacked\"></div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/content/views/attachment-list-view',[
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'streamhub-sdk/content/views/oembed-view',
    'hgn!streamhub-sdk/content/templates/attachment-list',
    'inherits'],
function($, View, OembedView, AttachmentListTemplate, inherits) {
    
   
    /**
     * A simple View that displays Content in a list (`<ul>` by default).
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.content {Content} The content instance with which to display its attachments
     * @exports streamhub-sdk/views/attachment-list-view
     * @constructor
     */
    var AttachmentListView = function(opts) {
        opts = opts || {};

        this.oembedViews = [];
        this._rendered = false;

        View.call(this, opts);
        
        if (opts.content) {
            this.setContent(opts.content);
        }
    };
    inherits(AttachmentListView, View);

    AttachmentListView.prototype.template = AttachmentListTemplate;
    AttachmentListView.prototype.stackedAttachmentsSelector = '.content-attachments-stacked';
    AttachmentListView.prototype.contentAttachmentSelector = '.content-attachment';
    AttachmentListView.prototype.listLengthAttribute = 'data-hub-list-length';

    /**
     * Set the element for the view to render in.
     * You will probably want to call .render() after this, but not always.
     * @param content {HTMLElement} The element to render this View in
     */
    AttachmentListView.prototype.setContent = function (content) {
        var self = this;

        if (! content) {
            return;
        }

        // If this was previously managing different Content
        if (this.content) {
            // Remove existing attachment views
            this.$el.find(this.contentAttachmentSelector).remove();
            this.oembedViews = [];
        }

        this.content = content;
        
        // Add attachments that already exist
        for (var i=0; i < this.content.attachments.length; i++) {
            this.add(this.content.attachments[i]);
        }
        // Add attachments added later
        this.content.on('attachment', function (attachment) {
            self.add(attachment);
        });
        this.content.on('removeAttachment', function (attachment) {
            self.remove(attachment);
        });
    };

    /**
     * Set the element for the view to render in.
     * You will probably want to call .render() after this, but not always.
     * @param element {HTMLElement} The element to render this View in
     * @returns this
     */
    AttachmentListView.prototype.setElement = function (element) {
        var ret = View.prototype.setElement.apply(this, arguments);
        this.$el.attr(this.listLengthAttribute, this.count());
        return ret;
    };

    AttachmentListView.prototype.render = function () {
        var self = this;
        View.prototype.render.call(this);
        this._rendered = true;
        $.each(self.oembedViews, function (i, oembedView) {
            if ( ! self.$el.has(oembedView.$el).length) {
                // oembedView needs to be a descendant of AttachmentListView#.el
                self._insert(oembedView);
            }
            oembedView.render();
        });
    };

    /**
     * A count of the number of attachments for this content item
     * @returns {int} The number of attachments for this content item
     */
    AttachmentListView.prototype.count = function () {
        return this.oembedViews.length;
    };

    /**
     * Appends a new OembedView given an Oembed instance to the view
     * @param oembed {Oembed} A Oembed instance to insert into the view
     * @returns {OembedView} The OembedView associated with the newly inserted oembed
     */
    AttachmentListView.prototype._insert = function (contentView) {
        contentView.$el.appendTo(this.$el.find(this.stackedAttachmentsSelector));
    };

    /**
     * Add a Oembed attachment to the Attachments view. 
     * @param oembed {Oembed} A Oembed instance to render in the View
     * @returns {AttachmentListView} By convention, return this instance for chaining
     */
    AttachmentListView.prototype.add = function(oembed) {
        var oembedView = this._createOembedView(oembed);

        this.oembedViews.push(oembedView);

        // Insert in .el
        if (this.el) {
            this._insert(oembedView);
            // Update list length attribute
            this.$el.attr(this.listLengthAttribute, this.count());
        }

        if (this._rendered) {
            oembedView.render();
        }

        return oembedView;
    };

    /**
     * Remove a piece of Content from this ListView
     * @param content {Content} The Content to be removed
     * @returns {boolean} true if Content was removed, else false
     */
    AttachmentListView.prototype.remove = function (oembed) {
        var oembedView = this.getOembedView(oembed);
        if (! oembedView) {
            return false;
        }
        oembedView.$el.remove();
        // Remove from this.oembedViews[]
        this.oembedViews.splice(this.oembedViews.indexOf(oembedView), 1);
        return true;
    };

    /**
     * Creates the view to render the oembed content object
     * @param oembed {Oembed} A Oembed instance to render in the View
     * @returns {OembedView} 
     */
    AttachmentListView.prototype._createOembedView = function(oembed) {
        var oembedView = new OembedView({
            oembed: oembed
        });
        return oembedView;
    };

    /**
     * Given a new Content instance, return an existing contentView that
     * should be used to update the content (based on identity or content.id).
     * @param newOembed {Content} The piece of content to find the view for.
     * @returns {OembedView | null} The oembedView for the content, or null.
     */
    AttachmentListView.prototype.getOembedView = function (newOembed) {
        for (var i=0; i < this.oembedViews.length; i++) {
            var oembedView = this.oembedViews[i];
            if ((newOembed === oembedView.oembed) || (newOembed.id && oembedView.oembed.id === newOembed.id)) {
                return oembedView;
            }
        }
        return null;
    };

    AttachmentListView.prototype.destroy = function () {
        View.prototype.destroy.call(this);
        this.oembedViews = null;
    };

    return AttachmentListView;
});

define("hgn!streamhub-sdk/content/templates/tiled-attachment-list", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachments-interactive-gallery\"></div>");_.b("\n" + i);_.b("<div class=\"content-attachments-tiled\"></div>");_.b("\n" + i);_.b("<div class=\"content-attachments-stacked\"></div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/content/views/tiled-attachment-list-view',[
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'streamhub-sdk/content/views/attachment-list-view',
    'streamhub-sdk/content/views/oembed-view',
    'hgn!streamhub-sdk/content/templates/tiled-attachment-list',
    'inherits'],
function ($, View, AttachmentListView, OembedView, TiledAttachmentListTemplate, inherits) {
    

    
    /**
     * A simple View that displays Content in a list (`<ul>` by default).
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.content {Content} The content instance with which to display its attachments
     * @fires TiledAttachmentListView#focusContent.hub
     * @exports streamhub-sdk/views/tiled-attachment-list-view
     * @constructor
     */
    var TiledAttachmentListView = function (opts) {
        opts = opts || {};
        this.oembedViews = [];
        AttachmentListView.call(this, opts);
    };
    inherits(TiledAttachmentListView, AttachmentListView);

    TiledAttachmentListView.prototype.template = TiledAttachmentListTemplate;
    TiledAttachmentListView.prototype.tiledAttachmentsSelector = '.content-attachments-tiled';
    TiledAttachmentListView.prototype.stackedAttachmentsSelector = '.content-attachments-stacked';
    TiledAttachmentListView.prototype.squareTileClassName = 'content-attachment-square-tile';
    TiledAttachmentListView.prototype.horizontalTileClassName = 'content-attachment-horizontal-tile';
    TiledAttachmentListView.prototype.contentAttachmentSelector = '.content-attachment';

    TiledAttachmentListView.prototype.events = AttachmentListView.prototype.events.extended({
        'click': function (e, opts) {
            opts = opts || {};
            this.$el.trigger('focusContent.hub', { content: this.content, attachmentToFocus: opts.oembed });
        }
    });

    TiledAttachmentListView.prototype.render = function () {
        AttachmentListView.prototype.render.call(this);
        this.retile();
    };


    /**
     * Checks whether attachment is tileable
     * @returns {boolean} Whether an attachment is tileable
     */
    TiledAttachmentListView.prototype.isTileableAttachment = function (oembed) {
        if (oembed.type === 'photo' || oembed.type === 'video') {
            return true;
        }
        return false;
    };

    /**
     * A count of the number of tileable attachments for this content item
     * @returns {boolean} The number of tileable attachments for this content item
     */
    TiledAttachmentListView.prototype.tileableCount = function () {
        var attachmentsCount = 0;

        for (var i=0; i < this.oembedViews.length; i++) {
            if (this.isTileableAttachment(this.oembedViews[i].oembed)) {
                attachmentsCount++;
            }
        }
        return attachmentsCount;
    };

    /**
     * Add a Oembed attachment to the Attachments view. 
     * @param oembed {Oembed} A Oembed instance to render in the View
     * @returns {AttachmentListView} By convention, return this instance for chaining
     */
    TiledAttachmentListView.prototype.add = function (oembed) {
        AttachmentListView.prototype.add.call(this, oembed);
        this.retile();
        return this;
    };

    TiledAttachmentListView.prototype._insert = function (oembedView) {
        var tiledAttachmentsEl = this.$el.find(this.tiledAttachmentsSelector);
        var stackedAttachmentsEl = this.$el.find(this.stackedAttachmentsSelector);
        if (this.isTileableAttachment(oembedView.oembed)) {
            oembedView.$el.appendTo(tiledAttachmentsEl);
        } else {
            oembedView.$el.appendTo(stackedAttachmentsEl);
        }
    };

    /**
     * Removes a Oembed attachment from the Attachments view. 
     * @param oembed {Oembed} A Oembed instance to remove
     */
    TiledAttachmentListView.prototype.remove = function (oembed) {
        AttachmentListView.prototype.remove.call(this, oembed);
        this.retile();
    };

    /**
     * Retiles all attachments of the content 
     */
    TiledAttachmentListView.prototype.retile = function () {
        if ( ! this.el) {
            return;
        }
        var tiledAttachmentsEl = this.$el.find(this.tiledAttachmentsSelector);

        // Add classes to make thumbnails tile
        var attachmentsCount = this.tileableCount(this.oembedViews);
        tiledAttachmentsEl
            .removeClass('content-attachments-1')
            .removeClass('content-attachments-2')
            .removeClass('content-attachments-3')
            .removeClass('content-attachments-4');
        if (attachmentsCount && attachmentsCount <= 4) {
            // Only tile for <= 4 photo or video attachments
            tiledAttachmentsEl.addClass('content-attachments-' + attachmentsCount);
        }
        tiledAttachmentsEl.find(this.contentAttachmentSelector).addClass(this.squareTileClassName);
        if (attachmentsCount === 3) {
            tiledAttachmentsEl.find(this.contentAttachmentSelector + ':first')
                .removeClass(this.squareTileClassName)
                .addClass(this.horizontalTileClassName);
        } else if (attachmentsCount > 4) {
            tiledAttachmentsEl.find(this.contentAttachmentSelector)
                .removeClass(this.squareTileClassName)
                .addClass(this.horizontalTileClassName);
        } else {
            tiledAttachmentsEl.find(this.contentAttachmentSelector)
                .removeClass(this.horizontalTileClassName)
                .addClass(this.squareTileClassName);
        }
    };

    return TiledAttachmentListView;
});

define("hgn!streamhub-sdk/content/templates/gallery-attachment-list", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-attachments-meta\">");_.b("\n" + i);_.b("    <div class=\"content-attachments-meta-avatar\"></div>");_.b("\n" + i);_.b("    <div class=\"content-attachments-meta-name\"></div>");_.b("\n" + i);_.b("    <div class=\"content-attachments-meta-subname\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"content-attachments-gallery\">");_.b("\n" + i);_.b("    <div class=\"content-attachments-gallery-focused\"></div>");_.b("\n" + i);_.b("    <div class=\"content-attachments-gallery-thumbnails\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"content-attachments-gallery-prev\">");_.b("\n" + i);_.b("    <div class=\"content-attachments-gallery-prev-btn\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"content-attachments-gallery-next\">");_.b("\n" + i);_.b("    <div class=\"content-attachments-gallery-next-btn\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"content-attachments-gallery-count\">");_.b("\n" + i);_.b("    <span class=\"content-attachments-gallery-current-page\"></span> of <span class=\"content-attachments-gallery-total-pages\"></span>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define("hgn!streamhub-sdk/content/templates/content-byline", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"content-header-inner\">");_.b("\n" + i);if(_.s(_.d("author.avatar",c,p,1),c,p,0,57,163,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <a class=\"content-author-avatar\">");_.b("\n" + i);_.b("            <img src=\"");_.b(_.v(_.d("author.avatar",c,p,0)));_.b("\" />");_.b("\n" + i);_.b("        </a>");_.b("\n");});c.pop();}_.b("    <div class=\"content-byline\">");_.b("\n" + i);if(_.s(_.d("author.url",c,p,1),c,p,0,238,359,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <a class=\"content-author-name\" href=\"");_.b(_.v(_.d("author.url",c,p,0)));_.b("\" target=\"_blank\">");_.b(_.v(_.d("author.displayName",c,p,0)));_.b("</a>");_.b("\n");});c.pop();}if(!_.s(_.d("author.url",c,p,1),c,p,1,0,0,"")){if(_.s(_.d("author.profileUrl",c,p,1),c,p,0,433,876,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                <div class=\"content-author-name\">");_.b("\n" + i);_.b("                    <a href=\"");_.b(_.v(_.d("author.profileUrl",c,p,0)));_.b("\" target=\"_blank\">");_.b(_.v(_.d("author.displayName",c,p,0)));_.b("</a>");_.b("\n" + i);_.b("                </div>");_.b("\n" + i);if(_.s(_.d("author.twitterUserId",c,p,1),c,p,0,647,838,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                	<a class=\"content-author-username\" href=\"https://twitter.com/intent/user?user_id=");_.b(_.v(_.d("author.twitterUserId",c,p,0)));_.b("\" target=\"_blank\">@");_.b(_.v(_.d("author.twitterUsername",c,p,0)));_.b("</a>");_.b("\n");});c.pop();}});c.pop();}if(!_.s(_.d("author.profileUrl",c,p,1),c,p,1,0,0,"")){_.b("                <span class=\"content-author-name\">");_.b(_.v(_.d("author.displayName",c,p,0)));_.b("</span>");_.b("\n");};};_.b("    </div>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/content/views/gallery-attachment-list-view',[
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'streamhub-sdk/content/views/tiled-attachment-list-view',
    'streamhub-sdk/content/views/oembed-view',
    'hgn!streamhub-sdk/content/templates/gallery-attachment-list',
    'hgn!streamhub-sdk/content/templates/content-byline',
    'inherits'],
function($, View, TiledAttachmentListView, OembedView, GalleryAttachmentListTemplate, contentBylineTemplate, inherits) {
    

    /**
     * A view that displays a content's attachments as a gallery
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.content {Content} The content containing attachments to display as a gallery
     * @param opts.attachmentToFocus {Oembed} The attachment to focus in the gallery
     * @param opts.userInfo {boolean} Whether to display the user info
     * @param opts.pageButtons {boolean} Whether to display next/previous page buttons
     * @param opts.pageCount {boolean} Whether to display the page count/index
     * @param opts.thumbnails {boolean} Whether to display the thumbnails of all attachments
     * @param opts.proportionalThumbnails {boolean} Whether the thumbnail widths are proportional to the gallery container
     * @fires GalleryAttachmentListView#hideModal.hub
     * @exports streamhub-sdk/views/gallery-attachment-list-view
     * @constructor
     */
    var GalleryAttachmentListView = function(opts) {
        opts = opts || {};
        View.call(this, opts);

        this.userInfo = opts.userInfo === undefined ? true : opts.userInfo;
        this.pageButtons = opts.pageButtons === undefined ? true : opts.pageButtons;
        this.pageCount = opts.pageCount === undefined ? true : opts.pageCount;
        this.thumbnails = opts.thumbnails === undefined ? false : opts.thumbnails;
        this.proportionalThumbnails = opts.proportionalThumbnails === undefined ? false : opts.proportionalThumbnails;
        this.focusedIndex = 0;
        this.oembedViews = [];

        if (opts.content) {
            this.setContent(opts.content);
        }
        
        if (opts.attachmentToFocus) {
            this.setFocusedAttachment(opts.attachmentToFocus);
        }

        var self = this;
        $(window).on('resize', function(e) {
            self.resizeFocusedAttachment();
        });

        $(window).on('keyup', function(e) {
            e.preventDefault();
            if (!self.pageButtons) {
                return;
            }
            if (e.keyCode === 37) {
                // left arrow
                self.prev();
            } else if (e.keyCode === 39) {
                // right arrow
                self.next();
            }
        });
    };
    inherits(GalleryAttachmentListView, View);
    $.extend(GalleryAttachmentListView.prototype, TiledAttachmentListView.prototype);

    GalleryAttachmentListView.prototype.template = GalleryAttachmentListTemplate;
    GalleryAttachmentListView.prototype.attachmentsGallerySelector = '.content-attachments-gallery';
    GalleryAttachmentListView.prototype.focusedAttachmentsSelector = '.content-attachments-gallery-focused';
    GalleryAttachmentListView.prototype.galleryThumbnailsSelector = '.content-attachments-gallery-thumbnails';
    GalleryAttachmentListView.prototype.galleryPrevSelector = '.content-attachments-gallery-prev';
    GalleryAttachmentListView.prototype.galleryNextSelector = '.content-attachments-gallery-next';
    GalleryAttachmentListView.prototype.galleryCloseSelector = '.content-attachments-gallery-close';
    GalleryAttachmentListView.prototype.galleryCountSelector = '.content-attachments-gallery-count';
    GalleryAttachmentListView.prototype.galleryCurrentPageSelector = '.content-attachments-gallery-current-page';
    GalleryAttachmentListView.prototype.galleryTotalPagesSelector = '.content-attachments-gallery-total-pages';
    GalleryAttachmentListView.prototype.focusedAttachmentClassName = 'content-attachments-focused';
    GalleryAttachmentListView.prototype.attachmentMetaSelector = '.content-attachments-meta';
    GalleryAttachmentListView.prototype.actualImageSelector = '.content-attachment-actual-image';

    GalleryAttachmentListView.prototype.events = TiledAttachmentListView.prototype.events.extended({
        click: function (e) {
            /**
             * Hide modal
             * @event GalleryAttachmentListView#hideModal.hub
             */
            this.$el.trigger('hideModal.hub');
        },
        'focusContent.hub': function(e, context) {
            if (context.content) {
                for (var i=0; i < context.content.attachments; i++) {
                    this.add(context.content.attachments[i]);
                }
            }
            this.setFocusedAttachment(context.attachmentToFocus);
            this.render();
        }
    }, function (events) {
        var pagingSelectors = [
            this.attachmentMetaSelector,
            this.galleryNextSelector,
            this.galleryPrevSelector,
            this.actualImageSelector
        ].join(',');

        events['click '+pagingSelectors] = function (e) {
            e.stopPropagation();
            if (!this.pageButtons) {
                return;
            }
            if ($(e.currentTarget).hasClass(this.galleryNextSelector.substring(1)) || $(e.currentTarget).hasClass(this.actualImageSelector.substring(1))) {
                this.next();
            } else if ($(e.currentTarget).hasClass(this.galleryPrevSelector.substring(1))) {
                this.prev();
            }
        };
    });

    /**
     * Set the attachment instance to be displayed as the focused item in the gallery
     * @param element {Oembed} The attachment to focus in the gallery
     */
    GalleryAttachmentListView.prototype.setFocusedAttachment = function (attachment) {
        attachment = attachment.el ? attachment.oembed : attachment;
        this._focusedAttachment = attachment;
    };

    /**
     * Set the element for the view to render in.
     * You will probably want to call .render() after this, but not always.
     * @param element {HTMLElement} The element to render this View in
     * @returns this
     */
    GalleryAttachmentListView.prototype.setElement = function (element) {
        return View.prototype.setElement.call(this, element);
    };

    /**
     * Creates DOM structure of gallery to be displayed
     */
    GalleryAttachmentListView.prototype.render = function () {
        TiledAttachmentListView.prototype.render.call(this);

        var attachmentsGalleryEl = this.$el.find(this.attachmentsGallerySelector);
        var self = this;
        $.each(this.oembedViews, function (i, oembedView) {
            oembedView.$el.appendTo(attachmentsGalleryEl.find(self.galleryThumbnailsSelector));
            oembedView.$el.on('click', function(e) {
                $(e.target).trigger('focusContent.hub', { content: self.content, attachmentToFocus: oembedView.oembed });
            });
            oembedView.render();
        });

        var contentMetaEl = this.$el.find(this.attachmentMetaSelector);
        contentMetaEl[ this.userInfo ? 'show' : 'hide' ]();

        var pageButtonEls = this.$el.find([this.galleryPrevSelector, this.galleryNextSelector].join(','));
        pageButtonEls[ this.pageButtons ? 'show' : 'hide' ]();

        var pageCountEl = this.$el.find(this.galleryCountSelector);
        pageCountEl[ this.pageCount ? 'show' : 'hide' ]();

        var thumbnailsEl = this.$el.find(this.galleryThumbnailsSelector);

        if (this.proportionalThumbnails) {
            var thumbnailTileEls = thumbnailsEl.children();
            for (var i=0; i < thumbnailTileEls.length; i++) {
                thumbnailTileEls.eq(i).width(100 / thumbnailTileEls.length + '%').height(75);
            }
        }

        this.focus();
        this._rendered = true;
    };


    GalleryAttachmentListView.prototype.setContent = function (content, opts) {
        opts = opts || {};
        TiledAttachmentListView.prototype.setContent.apply(this, arguments);
        if (opts.attachment) {
            this.setFocusedAttachment(opts.attachment);
        }
        if (this._rendered) {
            this.render();
        }
    };


    /**
     * Appends a new OembedView given an Oembed instance to the view
     * @param oembed {Oembed} A Oembed instance to insert into the view
     * @returns {OembedView} The OembedView associated with the newly inserted oembed
     */
    GalleryAttachmentListView.prototype._insert = function (oembedView) {
        var self = this;
        var stackedAttachmentsEl = this.$el.find(this.stackedAttachmentsSelector);
        var attachmentsGalleryEl = this.$el.find(this.attachmentsGallerySelector);

        if (this.isTileableAttachment(oembedView.oembed)) {
            oembedView.$el.appendTo(attachmentsGalleryEl.find(this.galleryThumbnailsSelector));
            oembedView.$el.on('click', function(e) {
                /**
                 * Focus content
                 * @event TiledAttachmentListView#focusContent.hub
                 */
                $(e.target).trigger('focusContent.hub', { content: self.content, attachmentToFocus: oembedView.oembed });
            });
        } else {
            oembedView.$el.appendTo(stackedAttachmentsEl);
        }

        return oembedView;
    };

    /**
     * Add a Oembed attachment to the Attachments view. 
     * @param oembed {Oembed} A Oembed instance to render in the View
     * @returns {AttachmentListView} By convention, return this instance for chaining
     */
    GalleryAttachmentListView.prototype.add = function (oembed) {
        // Gallery doesn't display non-tileable attachments (e.g. links)
        if (! this.isTileableAttachment(oembed)) {
            return this;
        }
        var oembedView = TiledAttachmentListView.prototype.add.call(this, oembed);

        this.focus();

        return oembedView;
    };

    /**
     * Displays the focused attachment in the gallery, updates
     * page count/index, and prev/next button visibility.
     * @param oembed {Oembed} A Oembed instance to render in the View
     */
    GalleryAttachmentListView.prototype.focus = function (oembed) {
        if (!oembed && !this.oembedViews.length) {
            return;
        }
        oembed = oembed ? oembed : this._focusedAttachment || this.oembedViews[0].oembed;

        if ( ! this._focusedAttachment) {
            this.setFocusedAttachment(oembed);
        }

        // Render focused attachment
        var focusedAttachmentsEl = this.$el.find(this.focusedAttachmentsSelector);
        focusedAttachmentsEl.empty();

        var oembedView = new OembedView({ oembed: oembed });
        oembedView.render();
        var focusedEl = oembedView.$el.clone();
        focusedEl.appendTo(focusedAttachmentsEl);

        var photoContentEl = focusedEl.find('.content-attachment-photo');
        photoContentEl.addClass(this.focusedAttachmentClassName);
        if (this._focusedAttachment.type === 'video') {
            var playButtonEl = focusedEl.find('.content-attachment-controls-play');
            playButtonEl.hide();
            photoContentEl.hide().removeClass(this.focusedAttachmentClassName);
            var videoContentEl = focusedEl.find('.content-attachment-video');
            videoContentEl.addClass(this.focusedAttachmentClassName);
            videoContentEl.html(this._focusedAttachment.html);
            if (this.tile) {
                videoContentEl.find('iframe').css({'width': '100%', 'height': '100%'});
            }
            videoContentEl.show();
        }

        // Update page count and focused index
        var attachmentsCount = this.tileableCount();
        if (this.pageCount) {
            var newIndex = 0;
            for (var i=0; i < this.oembedViews.length; i++) {
                if (this.oembedViews[i].oembed === this._focusedAttachment) {
                    this.focusedIndex = newIndex;
                    break;
                }
                if (this.isTileableAttachment(this.oembedViews[i].oembed)) {
                    newIndex++;
                }
            }
            this.$el.find(this.galleryCurrentPageSelector).html(this.focusedIndex + 1);
            this.$el.find(this.galleryTotalPagesSelector).html(attachmentsCount);

            var galleryCountEl = this.$el.find(this.galleryCountSelector);
            
            if (attachmentsCount > 1) {
                galleryCountEl.show();
            } else {
                galleryCountEl.hide();
            }
        }

        // Prev/Next buttons
        if (attachmentsCount === 1) {
            this.$el.find(this.galleryPrevSelector).hide();
            this.$el.find(this.galleryNextSelector).hide();
        } else if (this.focusedIndex + 1 === attachmentsCount) {
            this.$el.find(this.galleryPrevSelector).show();
            this.$el.find(this.galleryNextSelector).hide();
        } else if (this.focusedIndex === 0) {
            this.$el.find(this.galleryPrevSelector).hide();
            this.$el.find(this.galleryNextSelector).show();
        } else {
            this.$el.find(this.galleryPrevSelector).show();
            this.$el.find(this.galleryNextSelector).show();
        }

        // Meta
        var contentMetaEl = this.$el.find(this.attachmentMetaSelector);
        contentMetaEl.html(contentBylineTemplate(this.content));

        // Update gallery size
        var self = this;
        var focusedAttachmentEl = this.$el.find('.'+this.focusedAttachmentClassName + '> *');
        if (!focusedAttachmentEl.length) {
            return;
        }
        if (focusedAttachmentEl[0].tagName === 'IMG') {
            focusedAttachmentEl.on('load', function(e) {
                self.resizeFocusedAttachment();
            });
        } else {
            this.resizeFocusedAttachment();
        }
    };

    /**
     * Resizes the focused attachment to fit within the content view
     */
    GalleryAttachmentListView.prototype.resizeFocusedAttachment = function() {
        // Set direct child of focused attachment to expand to itself
        var focusedAttachmentEl = this.$el.find('.'+this.focusedAttachmentClassName);
        focusedAttachmentEl.children().eq(0).width('100%').height('100%');

        this.$el.trigger('galleryResize.hub');
    };

    /**
     * Focuses the next attachment if it is not the last attachment
     */
    GalleryAttachmentListView.prototype.next = function() {
        var tileableIndex = 0;
        for (var i=0; i < this.oembedViews.length; i++) {
            if (!this.isTileableAttachment(this.oembedViews[i].oembed)) {
                continue;
            }
            if (this.focusedIndex+1 === tileableIndex) {
                this.focusedIndex = tileableIndex;
                this._focusedAttachment = this.oembedViews[i].oembed;
                this.render();
                break;
            }
            tileableIndex++;
        }
    };

    /**
     * Focuses the previous attachment if it is not the first attachment
     */
    GalleryAttachmentListView.prototype.prev = function() {
        var tileableIndex = 0;
        for (var i=0; i < this.oembedViews.length; i++) {
            if (!this.isTileableAttachment(this.oembedViews[i].oembed)) {
                continue;
            }
            if (this.focusedIndex-1 === tileableIndex) {
                this.focusedIndex = tileableIndex;
                this._focusedAttachment = this.oembedViews[i].oembed;
                this.render();
                break;
            }
            tileableIndex++;
        }
    };

    return GalleryAttachmentListView;
});
 

define("hgn!streamhub-sdk/modal/templates/modal", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"hub-modal-close\">&times;</div>");_.b("\n" + i);_.b("<div class=\"hub-modal-content\">");_.b("\n" + i);_.b("    <div class=\"hub-modal-content-view\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-sdk/modal/main',[
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'streamhub-sdk/content/views/gallery-attachment-list-view',
    'hgn!streamhub-sdk/modal/templates/modal',
    'inherits'
], function($, View, GalleryAttachmentListView, ModalTemplate, inherits) {
    

    /**
     * A view that overlays over the entire viewport to display some content
     *
     * @param opts {Object} A set of options to config the view with
     * @fires GalleryAttachmentListView#hideModal.hub
     * @fires GalleryAttachmentListView#error
     * @exports streamhub-sdk/modal
     * @constructor
     */
    var ModalView = function (opts) {
        opts = opts || {};
        this.visible = false;
        this._attached = false;
        this._modalSubView = opts.modalSubView || null;

        View.call(this);

        var self = this;
        $(window).keyup(function (e) {
            // Escape
            if (e.keyCode === 27 && self.visible) {
                self.hide();
            }
        });

        ModalView.instances.push(this);
    };
    inherits(ModalView, View);


    // Store all instances of modal to ensure that only one is visible
    ModalView.instances = [];

    // A stack pointing to instances that should be re-shown
    ModalView._stackedInstances = [];

    // A singleton container element houses all modals
    ModalView.$el = $('<div class="hub-modals"></div>');
    ModalView.el = ModalView.$el[0];

    // insert it on domReady
    ModalView.insertEl = function () {
        $('body').append(ModalView.el);
    };
    $(document).ready(ModalView.insertEl);


    ModalView.prototype.template = ModalTemplate;
    ModalView.prototype.elClass = ' hub-modal';


    ModalView.prototype.modalElSelector = '.hub-modal';
    ModalView.prototype.closeButtonSelector = '.hub-modal-close';
    ModalView.prototype.containerElSelector = '.hub-modal-content';
    ModalView.prototype.contentViewElSelector = '.hub-modal-content-view';


    /**
     * Makes the modal and its content visible
     * @param [modalSubView] {View} The view to be displayed in the by the modal.
     *      Defaults to this._modalSubView
     * @param [stack] {boolean=} Set true to start a stacked set of modals.
     *          Set false to exclude from a current stack. Leave undefined
     *          for normal stackless behavior.
     */
    ModalView.prototype.show = function (modalSubView, stack) {
        if (stack || ModalView._stackedInstances.length && stack !== false) {
            this._stack();
        }

        // First hide any other modals
        $.each(ModalView.instances, function (i, modal) {
            modal.hide();
        });

        $('body').css('overflow', 'hidden');

        this.$el.show();
        if ( ! this._attached) {
            this._attach();
        }

        this._modalSubView = modalSubView || this._modalSubView;

        this.render();

        this.visible = true;
    };


    /**
     * Makes the modal and its content not visible
     */
    ModalView.prototype.hide = function () {
        this.$el.hide();
        this._detach();
        this.visible = false;
        $('body').css('overflow', 'auto');
    };


    /**
     * Creates DOM structure of gallery to be displayed
     */
    ModalView.prototype.render = function () {
        View.prototype.render.call(this);

        this._modalSubView.setElement(this.$el.find(this.contentViewElSelector));
        this._modalSubView.render();
    };


    /**
     * Set the element for the view to render in.
     * ModalView construction takes care of creating its own element in
     *     ModalView.el. You probably don't want to call this manually
     * @private
     * @param element {HTMLElement} The element to render this View in
     * @returns this
     */
    ModalView.prototype.setElement = function (element) {
        View.prototype.setElement.call(this, element);
        var self = this;

        this.$el.addClass(this.elClass);

        this.$el.on('hideModal.hub', function (e) {
            self.hide();
            self._unstack();
        });

        this.$el.on('click', this.closeButtonSelector, function (e) {
            self.$el.trigger('hideModal.hub');
        });

        this.$el.on('click', function (e) {
            /**
             * Hide modal
             * @event GalleryAttachmentListView#hideModal.hub
             */
            if ($(e.target).hasClass('hub-modal-content') || $(e.target).hasClass('hub-modal-close')) {
                self.$el.trigger('hideModal.hub');
            }
        });

        return this;
    };


    /**
     * Attach .el to the DOM
     * @private
     */
    ModalView.prototype._attach = function () {
        this.$el.appendTo(ModalView.$el);
        this._attached = true;
    };


    /**
     * Detach .el from the DOM
     * This may be useful when the modal is hidden, so that
     *     the browser doesn't have to lay it out, and it doesn't
     *     somehow intercept DOM events
     * @private
     */
    ModalView.prototype._detach = function () {
        this.$el.detach();
        this._attached = false;
    };

    /**
     * Pushes this instance onto a stack of instances
     * @private
     */
    ModalView.prototype._stack = function () {
        ModalView._stackedInstances.push(this);
    };

    /**
     * If we're stacking modals, remove this modal from the stack and show the
     * next modal.
     * @private
     */
    ModalView.prototype._unstack = function () {
        var stackLength = ModalView._stackedInstances.length,
            top;
        if (stackLength === 0) {
        //Return early if the stack is empty
            return;
        }

        //Check that this is the top item and pop it off if it is
        top = ModalView._stackedInstances[stackLength - 1];
        this === top && ModalView._stackedInstances.pop() && stackLength--;

        if (stackLength > 0) {
        //If there is a next modal, show it
            ModalView._stackedInstances[stackLength - 1].show(undefined, false);
        }
    };

    return ModalView;
});

define('streamhub-sdk/modal', ['streamhub-sdk/modal/main'], function (main) { return main; });

define('streamhub-input/javascript/modal/launchable-modal',['require','exports','module','streamhub-sdk/modal','streamhub-input/javascript/util'],function (require, exports, module) {var ModalView = require('streamhub-sdk/modal');
var util = require('streamhub-input/javascript/util');



/**
 * A view that can be displayed and interacted with in an otherwise generic modal.
 * @constructor
 */
function LaunchableModal() {};

/**
 * Displays and operates this view as a modal.
 * @param [callback] {function(err: Object, data: Object)}
 *      Called after a successful interaction
 */
LaunchableModal.prototype.launchModal = function(callback) {
    /**
     * Function to call after a successful interaction.
     * @type {!function(err: Object, data: Object)}
     */
    this._callback = callback || util.nullFunction;

    /**
     * Modal representation of this view.
     * @type {!ModalView}
     */
    this._modal = this._modal || new ModalView();
    this._modal.show(this, true);  // Will .render() and stack
};

/**
 * Called when the modal view has competed its task and can be closed/hidden.
 * @param [err] {Object}
 * @param [data] {Object}
 */
LaunchableModal.prototype.returnModal = function (err, data) {
    this._returnModal(err, data);
};

/**
 * Called by returnModal to hand closing necessities.
 * @param [err] {Object}
 * @param [data] {Object}
 * @private
 */
LaunchableModal.prototype._returnModal = function (err, data) {
    if (!this._modal || !this._callback) {
        return;
    }

    this._callback(err, data);
    this._callback = null;
    this._modal.$el.trigger('hideModal.hub');  // Will _modal.hide()
};

module.exports = LaunchableModal;

});

define("hgn!streamhub-input/templates/upload", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<iframe id=\"");_.b(_.v(_.f("container",c,p,0)));_.b("\" class=\"hub-upload\" />");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-input/javascript/upload/view',['require','exports','module','jquery','streamhub-sdk/content','inherits','streamhub-input/javascript/modal/launchable-modal','streamhub-sdk/debug','streamhub-input/javascript/pipeable','streamhub-sdk/view','hgn!streamhub-input/templates/upload'],function (require, exports, module) {var $ = require('jquery');
var Content = require('streamhub-sdk/content');
var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var log = require('streamhub-sdk/debug')('streamhub-input/javascript/upload/view');
var Pipeable = require('streamhub-input/javascript/pipeable');
var View = require('streamhub-sdk/view');



/**
 * The reference to window.filepicker is stored here once loaded.
 * @private
 */
var picker = null;

/**
 * A view that handles the display of and data returned by FilePicker.
 * Parasitically inherits from Readable, allowing it to pipe returned data
 * to a Writable.
 * @param [opts] {Object}
 * @param [opts.filepicker] {{key: !string, cache: !string}} If you intend to use
 *      a different api key, you will also need to provide the cache url.
 * @param [opts.name] {string} Assigned to provider_name for returned data
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @constructor
 * @extends {View}
 */
function Upload(opts) {
    opts = $.extend({}, Upload.DEFAULT_OPTS, opts);
    View.call(this, opts);
    LaunchableModal.call(this);
    Pipeable.call(this, opts);

    if (opts.filepicker) {
        this._filepickerKey = opts.filepicker.key;
        this._cacheUrl = opts.filepicker.cache;
    }
    this.name = opts.name || this.name;
}
inherits(Upload, View);
inherits.parasitically(Upload, LaunchableModal);
inherits.parasitically(Upload, Pipeable);

/**
 * provider_name attribute assigned to written data
 * @type {!string}
 */
Upload.prototype.name = 'Streamhub-Input/Upload';

/** @override */
Upload.prototype.elTag = 'iframe';

/** @override */
Upload.prototype.template = require('hgn!streamhub-input/templates/upload');

/**
 * Get contextual data for a template.
 * @override
 * @returns {!Object}
 */
Upload.prototype.getTemplateContext = function () {
    return {
        container: this.opts.pick.container
    };
};

/**
 * Loads the filepicker script if picker is undefined
 * @param {function()} cb
 * @private
 */
Upload.prototype._initFilepicker = function () {
    if (picker) {
        return;
    }

    var src = this.opts.src;
    $.getScript(src, scriptLoadCallback);

    var self = this;
    function scriptLoadCallback(script, status) {
        if (status !== 'success') {
            picker = false;
            throw 'There was an error loading ' + src;
        }

        picker = window.filepicker;
        picker.setKey(self._filepickerKey);
        self.emit('pickerLoaded');
    }
};

/**
 * Key for FilePicker API.
 * @type {!string}
 * @private
 */
Upload.prototype._filepickerKey = 'AtvGm2B6RR9mDKb8bImIHz';

/**
 * The URL where uploads are cached
 * @type {!string}
 * @private
 */
Upload.prototype._cacheUrl = 'http://dazfoe7f6de09.cloudfront.net/';

/**
 * The default options for using FilePicker and pickAndStore
 * @type {!Object}
 */
Upload.DEFAULT_OPTS = {
    packageAs: 'content',
    pick: {
        'container': 'picker',
        'maxSize': 4*1024*1024, // allows files < 4MB
        'mimetypes': ['image/*'],
        'multiple': true,
        'services': ['COMPUTER', 'WEBCAM', 'IMAGE_SEARCH', 'FACEBOOK', 'INSTAGRAM', 'FLICKR', 'PICASA', 'BOX', 'DROPBOX', 'GOOGLE_DRIVE']
    },
    store: {
        'location': 'S3',
        'access': 'public'
    },
    src: '//api.filepicker.io/v1/filepicker.js'
};

/**
 * Default callback to pickAndStore()
 * @param [err] {Object}
 * @param [inkBlob] {Object}
 */
Upload.prototype._processResponse = function (err, inkBlob) {
    if (err) {
        if (err.code !== 101) {//101 when dialog closed using x-box.
            this.showError('There was an error storing the file.');
        }
        return;
    }

    var contents = [];
    var self = this;
    if (inkBlob) {
        if (!inkBlob.length) {
            inkBlob = [inkBlob];
        }

        $.each(inkBlob, function (i, blob) {
            var content = self._packageInput(blob);
            contents.push(content);
            self.writeToDestination(content);
        });
    }
    return contents;
};

/**
 * Displays and operates this view as a modal.
 * @param [callback] {function(err: Object, data: Object)}
 *      Called after a successful interaction
 * @override
 */
Upload.prototype.launchModal = function(callback) {
    var self = this;
    if (!picker) {
        this.once('pickerLoaded', this.launchModal.bind(this, callback));
        return this._initFilepicker();
    }

    LaunchableModal.prototype.launchModal.apply(this, arguments);

    function errBack(err, data) {
        self._processResponse(err, data);
        self.returnModal();
    }
    function successFn(inkBlob) {
        errBack(null, inkBlob);
    }
    function errorFn(err) {
        errBack(err);
    }

    picker.pickAndStore(this.opts.pick, this.opts.store, successFn, errorFn);
};

/**
 * Creates and returns a Content object based on the input.
 * @param input {Object} Usually the data retrieved from getInput().
 * @returns {Content}
 * @protected
 * @override
 */
Upload.prototype._packageInput = function (input) {
    var url = this._cacheUrl + input.key;
    var attachment = {
        type: 'photo',
        url: url,
        link: url,
        provider_name: this.name
        //TODO (joao) images dimensions?!!!!
    };
    var content = new Content({body: ''});
    content.attachments.push(attachment);
    return content;
};

/** @override */
Upload.prototype.showError = function (msg) {
    //TODO (joao) Real implementation
    log(msg);
};

module.exports = Upload;

});

define("hgn!streamhub-input/templates/upload-button", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b(_.v(_.d("strings.post",c,p,0)));_.b("<span class=\"fycon-composer-photo\" />");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-input/javascript/upload/button',['require','exports','module','inherits','streamhub-input/javascript/button','streamhub-input/javascript/modal/modal-input-command','streamhub-input/javascript/upload/view','jquery','hgn!streamhub-input/templates/upload-button'],function (require, exports, module) {var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');
var Upload = require('streamhub-input/javascript/upload/view');
var $ = require('jquery');



/**
 * @param [opts] {Object}
 * @constructor
 * @extends {InputButton}
 */
function UploadButton(opts) {
    opts = opts || {};
    this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));
    var input = new Upload();
    var command = new ModalInputCommand(input);

    InputButton.call(this, command, {
        el: opts.el,
        input: opts.input || input,
        destination: opts.destination,
        authRequired: opts.authRequired
    });
}
inherits(UploadButton, InputButton);

/** @enum {string} */
UploadButton.prototype._i18n = {
    POST_PHOTO: 'Post Your Photo'
};

/** @override */
UploadButton.prototype.getTemplateContext = function () {
    return {
        strings: {
            post: this._i18n.POST_PHOTO
        }
    };
};

/** @override */
UploadButton.prototype.template = require('hgn!streamhub-input/templates/upload-button');

/**
 * @override
 * @type {string}
 */
UploadButton.prototype.elClass += ' hub-upload-btn';

module.exports = UploadButton;

});

define("hgn!streamhub-input/templates/upload-button-icon", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<span class=\"fycon-composer-photo\" />");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-input/javascript/upload/button-icon',['require','exports','module','inherits','streamhub-input/javascript/upload/button','hgn!streamhub-input/templates/upload-button-icon'],function (require, exports, module) {/**
 * @fileoverview The upload button, as a mini icon
 */
var inherits = require('inherits');
var UploadButton = require('streamhub-input/javascript/upload/button');



/**
 * @constructor
 * @extends {UploadButton}
 */
function UploadButtonIcon(opts) {
    opts = opts || {};
    UploadButton.call(this, opts);
}
inherits(UploadButtonIcon, UploadButton);

/** @override */
UploadButtonIcon.prototype.elClass = 'editor-upload';

/** @override */
UploadButtonIcon.prototype.elTag = 'span';

/** @override */
UploadButtonIcon.prototype.template = require('hgn!streamhub-input/templates/upload-button-icon');

module.exports = UploadButtonIcon;

});

define('streamhub-input/javascript/content-editor/view',['require','exports','module','jquery','streamhub-input/javascript/content-editor/attachment-list-view','auth','streamhub-sdk/ui/auth-required-command','streamhub-sdk/ui/button','streamhub-sdk/ui/command','streamhub-sdk/content','hgn!streamhub-input/templates/content-editor','streamhub-editor/editor','hgn!streamhub-editor/templates/editor','inherits','observer','streamhub-input/javascript/pipeable','streamhub-input/javascript/upload/button-icon','streamhub-sdk/view'],function (require, exports, module) {var $ = require('jquery');
var AttachmentListView = require('streamhub-input/javascript/content-editor/attachment-list-view');
var Auth = require('auth');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var Editor = require('streamhub-editor/editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var Observer = require('observer');
var Pipeable = require('streamhub-input/javascript/pipeable');
var UploadButtonIcon = require('streamhub-input/javascript/upload/button-icon');
var View = require('streamhub-sdk/view');



/**
 * A view that takes text input from a user and posts it to a collection/Writable.
 * Implements Input.
 * @param [opts] {Object}
 * @param [opts.i18n] {Object.<string>} Display strng overrides
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @constructor
 * @extends {Editor}
 * @extends {Pipeable}
 */
function ContentEditor(opts) {
    opts = opts || {};
    Editor.call(this, opts);
    Pipeable.call(this, opts);
    Observer(this);

    this._postCmd = new Command(this._handlePostBtnClick.bind(this));
    this._authCmd = new AuthRequiredCommand(this._postCmd);

    this._user = Auth.get('livefyre');

    this.listenTo(Auth, 'login.livefyre', handleLogin.bind(this));
    this.listenTo(Auth, 'logout', handleLogout.bind(this));
}
inherits(ContentEditor, Editor);
inherits.parasitically(ContentEditor, Pipeable);

/**
 * Set the user and rerender
 * @param {?User} livefyreUser
 */
function handleLogin(livefyreUser) {
    this._user = livefyreUser;
    this.render();
}

/** Unset the user and rerender */
function handleLogout() {
    this._user = null;
    this.render();
}

/**
 * Render the upload button (camera icon) that launches filepicker, and
 * render the contianer where photo upload thumbnails will live.
 * @private
 */
ContentEditor.prototype._addUploadButton = function () {
    this._uploadButton = this._uploadButton || new UploadButtonIcon();
    this._attachmentsList = this._attachmentsList || new AttachmentListView();

    this._uploadButton.setElement(this.getElementsByClass(this.classes.EDITOR_UPLOAD));
    this._attachmentsList.setElement(this.getElementsByClass(this.classes.ATTACHMENT_LIST));
    this._uploadButton.render();
    this._attachmentsList.render();
    this._uploadButton.pipe(this._attachmentsList);
};

/** @override */
ContentEditor.prototype._i18n = (function () {
    var strings = $.extend(true, {}, Editor.prototype._i18n);
    strings.PLACEHOLDERTEXT = 'What would you like to say?';
    strings.POST = 'Post Your Comment';
    return strings;
})();

/**
 * Post failure callback.
 * @private
 */
ContentEditor.prototype._handlePostFailure = function () {
    this.showError(this._i18n.ERRORS.GENERIC);
    this._postButton.enable();
};

/**
 * Post success callback.
 * @private
 */
ContentEditor.prototype._handlePostSuccess = function () {
    this.reset();
    this._postButton.enable();
};

/** @override */
ContentEditor.prototype._validate = function(data) {
    var valid = !!(data.body || (data.attachments && data.attachments.length));
    if (!valid) {
        this.showError(this._i18n.ERRORS.BODY);
    }
    return valid;
};

/* @override */
ContentEditor.prototype.buildPostEventObj = function () {
    var event = Editor.prototype.buildPostEventObj.call(this);
    if (this.opts.mediaEnabled) {
        event.attachments = this._attachmentsList.getAttachments();
    }
    return event;
};

/** @enum {string} */
ContentEditor.prototype.classes = (function () {
    var classes = $.extend({}, Editor.prototype.classes);
    classes.EDITOR_UPLOAD = 'lf-editor-upload';
    classes.POST_BTN = 'lf-content-editor-post';
    classes.ATTACHMENT_LIST = 'lf-attachment-list-view';
    return classes;
})();

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
ContentEditor.prototype.elClass += ' lf-edit';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
ContentEditor.prototype.elTag = 'article';

/** @override */
ContentEditor.prototype.destroy = function () {
    View.prototype.destroy.call(this);
    this.stopListening();
    this._uploadButton && this._uploadButton.destroy();
    this._uploadButton = null;
    this._attachmentsList && this._attachmentsList.destroy();
    this._attachmentsList = null;
};

/**
 * Get contextual data for a template.
 * @type {function()}
 * @override
 */
ContentEditor.prototype.getTemplateContext = function () {
    var username = this._user && this._user.get('displayName') || '';
    return {
        mediaEnabled: this.opts.mediaEnabled,
        strings: {
            post: this._i18n.POST,
            username: username
        }
    };
};

/** @override */
ContentEditor.prototype.render = function () {
    Editor.prototype.render.call(this);
    this.$postEl = this.$('.' + this.classes.POST_BTN);

    this._postButton = new Button(this._authCmd, {el: this.$postEl});

    if (this.opts.mediaEnabled) {
        this._addUploadButton();
    }
};

/** @override */
ContentEditor.prototype.reset = function () {
    Editor.prototype.reset.call(this);
    this._attachmentsList && this._attachmentsList.clearAttachments();
};

/** @override */
ContentEditor.prototype.sendPostEvent = function (ev) {
    var newContent = new Content();
    newContent.body = ev.body;
    newContent.attachments = ev.attachments;
    this._postButton.disable();
    this.writeToDestination(newContent, function(err) {
        if (err) {
            ev.failure(err);
        }
        ev.success();
    });
};

/** @override */
ContentEditor.prototype.template = function (context) {
    return contentEditorTemplate(context, {
        editor: editorTemplate.template
    });
};

module.exports = ContentEditor;

});

define("hgn!streamhub-input/templates/content-editor-modal", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<article class=\"hub-modal-input-wrapper\">");_.b("\n" + i);_.b("    <header class=\"hub-modal-input-header\">");_.b(_.v(_.d("strings.post",c,p,0)));_.b("</header>");_.b("\n" + i);_.b("    <div class=\"lf-modal-body\"> ");_.b(_.rp("contentEditor",c,p,""));_.b("</div>");_.b("\n" + i);_.b("</article>");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('streamhub-input/javascript/content-editor/modal-view',['require','exports','module','streamhub-input/javascript/content-editor/view','hgn!streamhub-input/templates/content-editor','hgn!streamhub-editor/templates/editor','inherits','hgn!streamhub-input/templates/content-editor-modal','streamhub-input/javascript/modal/launchable-modal','jquery'],function (require, exports, module) {var ContentEditor = require('streamhub-input/javascript/content-editor/view');
var contentEditorTemplate = require('hgn!streamhub-input/templates/content-editor');
var editorTemplate = require('hgn!streamhub-editor/templates/editor');
var inherits = require('inherits');
var modalTemplate = require('hgn!streamhub-input/templates/content-editor-modal');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var $ = require('jquery');



/**
 * @constructor
 * @extends {ContentEditor}
 * @extends {LaunchableModal}
 */
function ModalContentEditor(opts) {
    opts = opts || {};
    ContentEditor.call(this, opts);
    LaunchableModal.call(this);
}
inherits(ModalContentEditor, ContentEditor);
inherits.parasitically(ContentEditor, LaunchableModal);

/** @override */
ModalContentEditor.prototype.classes = {
    EDITOR_SECTION: 'lf-content-editor'
};
$.extend(ModalContentEditor.prototype.classes, ContentEditor.prototype.classes);

/** @override */
ModalContentEditor.prototype.template = function (context) {
    return modalTemplate(context, {
        contentEditor: contentEditorTemplate.template,
        editor: editorTemplate.template
    });
};

/** @override */
ModalContentEditor.prototype._handlePostSuccess = function () {
    ContentEditor.prototype._handlePostSuccess.call(this);
    this.returnModal();
};

/** @override */
ModalContentEditor.prototype.render = function () {
    ContentEditor.prototype.render.call(this);
    var classes = ModalContentEditor.prototype.classes.EDITOR_SECTION;
    this.$errorContainer = this.getElementsByClass(classes);
};

module.exports = ModalContentEditor;

});

define('streamhub-input/javascript/content-editor/button',['require','exports','module','inherits','streamhub-input/javascript/button','streamhub-input/javascript/content-editor/modal-view','streamhub-input/javascript/modal/modal-input-command','jquery'],function (require, exports, module) {var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalContentEditor = require('streamhub-input/javascript/content-editor/modal-view');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');
var $ = require('jquery');



/**
 *
 * @param [opts] {Object}
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @constructor
 * @extends {InputButton}
 */
function ContentEditorButton(opts) {
    opts = opts || {};
    this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));
    var input = new ModalContentEditor({
        mediaEnabled: opts.mediaEnabled
    });
    var command = new ModalInputCommand(input);

    InputButton.call(this, command, {
        el: opts.el,
        input: opts.input || input,
        destination: opts.destination,
        authRequired: opts.authRequired
    });
}
inherits(ContentEditorButton, InputButton);

/** @enum {string} */
ContentEditorButton.prototype._i18n = {
    POST: 'Post Your Comment'
};

/** @override */
ContentEditorButton.prototype.template = function () {
    return this._i18n.POST
};

/**
 * @override
 * @type {string}
 */
ContentEditorButton.prototype.elClass += ' comment-btn';

module.exports = ContentEditorButton;

});

define('streamhub-input/javascript/main',['require','exports','module','streamhub-input/javascript/content-editor/view','streamhub-input/javascript/content-editor/button','streamhub-input/javascript/upload/button'],function (require, exports, module) {module.exports = {
    ContentEditor: require('streamhub-input/javascript/content-editor/view'),
    ContentEditorButton: require('streamhub-input/javascript/content-editor/button'),
    UploadButton: require('streamhub-input/javascript/upload/button')
};

});

define('streamhub-input', ['streamhub-input/javascript/main'], function (main) { return main; });
    //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('streamhub-input');
}));

//# sourceMappingURL=streamhub-input.js.map