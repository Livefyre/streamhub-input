require([
    'auth',
    'livefyre-auth',
    'auth/contrib/auth-button',
    'livefyre-auth/livefyre-auth-delegate',
    'streamhub-sdk/debug',
    'streamhub-sdk/jquery',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk/collection',
    'streamhub-input/javascript/upload/button',
    'streamhub-input/javascript/content-editor/button'
],function (auth, livefyreAuth, createAuthButton, livefyreAuthDelegate, debug,
$, ListView, Collection, UploadButton, EditorButton) {

    livefyreAuth.plugin(auth);
    auth.delegate(livefyreAuth.createDelegate('http://www.qa-ext.livefyre.com'));

    $(function () {
        var opts = {
            "network": "livefyre.com",
            "siteId": "290596",
            "articleId": "136",
            "environment": "qa-ext.livefyre.com"
        };

        var listView = window.listView = new ListView({
            el: document.getElementById("listView"),
        });

        var collection = window.collection = new Collection(opts);
        collection.pipe(listView);

        createAuthButton(auth, document.getElementById('auth-button'));
        var uploadButton = window.uploadButton = new UploadButton({
            el: document.getElementById('upload-button')
        });
        var editorButton = window.editorButton = new EditorButton({
            el: document.getElementById('editor-button'),
            mediaEnabled: true
        });

        uploadButton.render();
        editorButton.render();
        uploadButton.pipe(collection);
        editorButton.pipe(collection);
    });

});
