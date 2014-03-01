define(function() {

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
