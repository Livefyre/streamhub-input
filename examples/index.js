require([
    'auth',
    'livefyre-auth',
    'auth/contrib/auth-button',
    'streamhub-sdk/debug',
    'streamhub-sdk/jquery',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk/collection',
    'streamhub-input/javascript/upload/button',
    'streamhub-input/javascript/content-editor/button'
],function (auth, livefyreAuth, createAuthButton, debug, $, ContentListView, Collection, UploadButton, ContentEditorButton) {
    livefyreAuth.plugin(auth);
    auth.delegate(livefyreAuth.createDelegate('http://www.qa-ext.livefyre.com'));

    $(function () {
        var opts = {
            "network": "livefyre.com",
            "siteId": "290596",
            "articleId": "136",
            "environment": "qa-ext.livefyre.com"
        };

        var listView = window.listView = new ContentListView({
            el: document.getElementById("listView"),
        });

        var collection = window.collection = new Collection(opts);
        collection.pipe(listView);

        createAuthButton(auth, document.getElementById('auth-button'));
        var uploadButton = window.uploadButton = new UploadButton({
            el: document.getElementById('upload-button')
        });
        var editorButton = window.editorButton = new ContentEditorButton({
            el: document.getElementById('editor-button'),
            mediaEnabled: true
        });

        uploadButton.render();
        editorButton.render();
        uploadButton.pipe(collection);
        editorButton.pipe(collection);
    });
});
