var $ = require('jquery');
var inherits = require('inherits');
var Content = require('streamhub-sdk/content');
var Readable = require('stream/readable');
var LaunchableModal = require('streamhub-input/modal/launchable-modal');
var log = require('streamhub-sdk/debug')('streamhub-input/upload');
var ModalView = require('streamhub-sdk/modal');
var Oembed = require('streamhub-sdk/content/types/oembed');
var Util = require('streamhub-sdk/util');
var View = require('streamhub-sdk/view');

'use strict';

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
 * @constructor
 * @extends {View}
 */
function Upload(opts) {
    opts = $.extend({}, Upload.DEFAULT_OPTS, opts);
    View.call(this, opts);
    LaunchableModal.call(this);
    Readable.call(this);

    if (opts.filepicker) {
        this._filepickerKey = opts.filepicker.key;
        this._cacheUrl = opts.filepicker.cache;
    }
    this.name = opts.name || this.name;
    opts.destination && this.pipe(opts.destination);
};
inherits(Upload, View);
inherits.parasitically(Upload, LaunchableModal);
inherits.parasitically(Upload, Readable);

/**
 * privider_name attribute assigned to written data
 * @type {!string}
 */
Upload.prototype.name = 'Streamhub-Input/Upload';

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
Upload.prototype.class += ' hub-upload';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
Upload.prototype.elTag = 'iframe';

/** @override */
Upload.prototype._read = function () {
    return null;
};

/**
 * Template for el
 * @override
 * @param [context] {Object}
 */
Upload.prototype.template = function (context) {
    return ['<iframe id="',
            context.container,
            '" class="hub-upload">',
            '</iframe>'].join('');
};

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
    function scriptLoadCallback(script, status, data) {
        if (status !== 'success') {
            picker = false;
            throw 'There was an error loading ' + src;
            return;
        }

        picker = filepicker;
        picker.setKey(self._filepickerKey);
        self.emit('pickerLoaded');
    }
};

/**
 * Key for FilePicker API.
 * @type {!string}
 * @private
 */
Upload.prototype._filepickerKey = 'AtvGm2B6RR9mDKb8bImIHz';  // uhhh

/**
 * The URL where uploads are cached
 * @type {!string}
 * @private
 */
Upload.prototype._cacheUrl = 'http://dazfoe7f6de09.cloudfront.net/';  // mrr

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
    if (inkBlob) {
        if (!inkBlob.length) {
            inkBlob = [inkBlob];
        }

        inkBlob.forEach(function (blob) {
            var content = this._packageInput(blob);
            contents.push(content);
            //Perform the essential function of _read() for non-flowing mode
            this.push(content);
        }, this);
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
    callback = callback || this.onStore;
    if (!picker) {
        this.once('pickerLoaded', this.launchModal.bind(this, callback));
        return this._initFilepicker();
    }

    // ok...
    this.opts.pick.container = this.name + this.uid;

    LaunchableModal.prototype.launchModal.apply(this, arguments);
    var successFn = function(inkBlob) {
        self.returnModal(null, self._processResponse(undefined, inkBlob));
    };
    var errorFn = function(err) {
        self._processResponse(err);
        self.returnModal(err);  // TODO: (joao) Maybe don't do this. Need error flow.
    };

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

/**
 * Displays an error message to the user.
 * @param msg
 * @override
 */
Upload.prototype.showError = function (msg) {
    //TODO (joao) Real implementation
    log(msg);
};

module.exports = Upload;
