require([
    'livefyre-auth',
    'auth/contrib/auth-button',
    'streamhub-sdk/debug',
    'streamhub-sdk/jquery',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk/collection',
    'streamhub-input',
],function (livefyreAuth, createAuthButton, debug, $, ContentListView, Collection, Input) {
    var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaXNwbGF5X25hbWUiOiJTaXRlIFVzZXIiLCJkb21haW4iOiJhZHZhbmNlZGlnaXRhbC1pbnQtMC5meXJlLmNvIiwiZXhwaXJlcyI6MTQ1NjIwNjg2Ni4wLCJ1c2VyX2lkIjoiM2M0MGMzNmM2NGRiNGFkYWFmNzNiNzEyZjBmYjU1ZDUifQ.bVCSwFmYh2iu4MdASUguM4QJM8xdSFCwnc4udblveBI'; 
    var delegate = {
        login: function (loginCallback) {
            var goLogin = confirm("Log in?"); 
            if (goLogin) {
              loginCallback(null, { 'livefyre': token });
            }
        },
        logout: function (logoutCallback) {
            logoutCallback(null);
        },
        viewProfile: function (user) {
            console.log(user);
        },
        editProfile: function (user) {
            console.log(user);
        }
    };
    livefyreAuth.delegate(delegate);

    $(function () {
        var opts = {
          network: "advancedigital-int-0.fyre.co",
          siteId: "304502",
          articleId: '9f208857901c8609d5c7cb21b69e2f8c'
        };

        var listView = window.listView = new ContentListView({
            el: document.getElementById("listView"),
        });

        var collection = window.collection = new Collection(opts);
        collection.pipe(listView);

        createAuthButton(livefyreAuth, document.getElementById('auth-button'));
        var uploadButton = window.uploadButton = new Input.UploadButton({
            el: document.getElementById('upload-button'),
            mimetypes: ['image/*', 'video/mp4']
        });
        var editorButton = window.editorButton = new Input.ContentEditorButton({
            el: document.getElementById('editor-button'),
            mediaEnabled: true,
            maxAttachmentsPerPost: 1,
            mimetypes: ['image/*', 'video/mp4']
        });
        var contentEditor = window.editorButton = new Input.ContentEditor({
            el: document.getElementById('content-editor')
        });

        uploadButton.render();
        editorButton.render();
        contentEditor.render();
        uploadButton.pipe(collection);
        editorButton.pipe(collection);
        contentEditor.pipe(collection);
    });
});
