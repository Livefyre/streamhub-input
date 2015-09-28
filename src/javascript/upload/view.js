var $ = require('jquery');
var Content = require('streamhub-sdk/content');
var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var log = require('streamhub-sdk/debug')('streamhub-input/javascript/upload/view');
var Pipeable = require('streamhub-input/javascript/pipeable');
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

    var protocol = window.location.protocol !== 'https:' ? 'http:' : 'https:';
    var src = protocol + this.opts.src;
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
        'multiple': false,
        'services': ['COMPUTER', 'WEBCAM', 'IMAGE_SEARCH', 'FACEBOOK', 'INSTAGRAM', 'FLICKR', 'PICASA', 'BOX', 'DROPBOX', 'GOOGLE_DRIVE']
    },
    store: {
        'location': 'S3',
        'access': 'public'
    },
    convert: {
        'rotate': 'exif'
    },
    src: '//api.filepicker.io/v2/filepicker.js'
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
            picker.convert(blob, self.opts.convert, self.opts.store, function (convertedBlob) {
                var content = self._packageInput(convertedBlob);
                contents.push(content);
                self.writeToDestination(content);
            });
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
