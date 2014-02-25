var $ = require('jquery');
var inherits = require('inherits');
var Content = require('streamhub-sdk/content');
var Input = require('input');
var LaunchableModal = require('modal/abstract/launchable-modal');
var log = require('streamhub-sdk/debug')
        ('upload');
var ModalView = require('streamhub-sdk/modal');
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
 * @param [key] {string} API key to use with FilePicker.io
 * @param [opts] {Object}
 * @param [opts.filepicker] {{key: !string, cache: !string}} If you intend to use
 *      a different api key, you will also need to provide the cache url.
 * @param [opts.name] {string} Assigned to provider_name for returned data
 * @constructor
 * @extends {View}
 */
var Upload = function(opts) {
    opts = opts || Upload.DEFAULT_OPTS;
    View.call(this, opts);
    Input.call(this, opts);
    LaunchableModal.call(this, opts);

    if (opts.filepicker) {
        this._filepickerKey = opts.filepicker.key;
        this._cacheUrl = opts.filepicker.cache;
    }
    this.name = opts.name || this.name;
    this.opts = opts;

    if (!picker) {
        this._initFilepicker();
    }
};
inherits(Upload, View);
inherits.parasitically(Upload, Input);
inherits.parasitically(Upload, LaunchableModal);

/**
 * privider_name attribute assigned to written data
 * @type {!string}
 */
Upload.prototype.name = 'Streamhub-input/Upload';

/**
 * Class to be added to the view's element.
 * @type {!string}
 */
Upload.prototype.class += ' lf-upload';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
Upload.prototype.elTag = 'iframe';

/**
 * Template for el
 * @override
 * @param [context] {Object}
 */
Upload.prototype.template = function (context) {
    return ['<iframe id="',
            context.container,
            //'" style="min-width:560px;min-height:432px;',
            '" class="lf-upload">',
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
        }

        picker = filepicker;
        picker.setKey(self._filepickerKey);
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
            var content = this._inputToContent(blob);
            //Perform the essential function of _read() for non-flowing mode
            this.push(contents.push(content));
        }, this);
    }
    this.reset();
    //For flowing mode
    this.emit('data', contents);
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
    if (picker === false) {
        throw 'The FilePicker script failed to load correctly.';
    }
    
    if (picker === null) {
    //Hasn't loaded yet
        //TODO (joao) Test this
        setTimeout(function() {
            self.launchModal(callback);
        }.bind(this), 150);
        return;
    }
    
    LaunchableModal.prototype.launchModal.apply(this, arguments);
    var successFn = function(inkBlob) {
        self.returnModal(undefined, self._processResponse(undefined, inkBlob));
    };
    var errorFn = function(err) {
        self._processResponse(err);
        self.returnModal(err);//TODO (joao) Maybe don't do this. Need error flow.
    };
    
    picker.pickAndStore(this.opts.pick, this.opts.store, successFn, errorFn);
};

/**
 * Reads the data that has been received from the user.
 * @returns {?Object}
 * @override
 */
Upload.prototype.getInput = function () {
    return null;
};

/**
 * Checks that the input from the user is valid.
 * Should call showError(msg) with
 * @param [data] {Object} Typically comes from .getInput()
 * @returns {!boolean}
 * @protected
 * @override
 */
Upload.prototype._validate = function () {/** The filepicker validates its input */};

/**
 * Resets the input display, typically by clearing out the current user input
 * from the screen.
 * @override
 */
Upload.prototype.reset = function () {/** The filepicker resets itself */};

/**
 * Creates and returns a Content object based on the input.
 * @param input {Object} Usually the data retrieved from getInput().
 * @returns {Content}
 * @protected
 * @override
 */
Upload.prototype._inputToContent = function (input) {
        var content = new Content({body: ''});
        var url = this._cacheUrl + input.key;
        content.attachments.push({
            type: 'photo',
            url: url,
            link: url,
            provider_name: this.name
            //TODO (joao) images dimensions?
        });
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