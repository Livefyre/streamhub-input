// Package the CSS
var INPUT_STYLE = require('less!streamhub-input/styles/streamhub-input');

module.exports = {
    ContentEditor: require('streamhub-input/javascript/content-editor/view'),
    ContentEditorButton: require('streamhub-input/javascript/content-editor/button'),
    UploadButton: require('streamhub-input/javascript/upload/button')
};
