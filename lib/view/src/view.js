var $ = require('jquery');
var EventEmitter = require('event-emitter');
var EventMap = require('view/event-map');
var inherits = require('inherits');

'use strict';

var viewCounts = 0;
function uniqueId () {
    return ++viewCounts + '';
}

/**
 * Defines a base view object that can be bound to any number of stream-managers. Content is
 * passed into a view via "add" event on "this". Subclasses are responsible for listening to
 * the "add" events and using them to display streamed content.
 * @param opts {Object} A set of options to config the view with
 * @param opts.streams {Object.<string, Stream>} A dictionary of streams to listen to
 * @param opts.el {HTMLElement} The element in which to render the streamed content
 * view instance.
 * @exports streamhub-sdk/view
 * @constructor
 */
var View = function(opts) {
    EventEmitter.call(this);
    opts = opts || {};
    this.opts = opts;
    this.uid = uniqueId();

    this.setElement(opts.el || document.createElement(this.elTag));
};
inherits(View, EventEmitter);

var delegateEventSplitter = /^(\S+)\s*(.*)$/;

View.prototype.$ = function(selector) {
    return this.$el.find(selector);
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
    this.undelegateEvents();
    if (events instanceof EventMap) {
        events = events.withContext(this);
    }
    for (var key in events) {
        if (events.hasOwnProperty(key)) {
            var method = events[key];
            if (typeof method === 'string') {
                method = this[method];
            }
            if (!method) {
                throw "Undefined method for: " + key;
            }
            method = $.proxy(method, this);

            var match = key.match(delegateEventSplitter);
            if (!match) {
                throw "Invalid event/selector pair: " + key;
            }
            var eventName = match[1];
            var selector = match[2];
            eventName += '.delegateEvents' + this.uid;
            if (selector === '') {
                this.$el.on(eventName, method);
            } else {
                this.$el.on(eventName, selector, method);
            }
        }
    }
    return this;
};

/**
 * Unbinds the events registered with .delegateEvents
 */
View.prototype.undelegateEvents = function() {
    this.$el.off('.delegateEvents' + this.uid);
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

View.prototype.destroy = function () {
    this.$el.remove();
    this.template = null;
    this.undelegateEvents();
};

module.exports = View;
