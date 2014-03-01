<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" type="text/css" href="/src/css/style.css">
    <style>
    #listView {
        width:500px;
    }
    </style>
    <script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
</head>
<body>
    <?php
        // include the library include(dirname(__FILE__) . “/livefyre-api/libs/php/Livefyre.php”); // set up some values

        $cms_content_id = "xbox-0";
        $cms_permalink_url = "http://www.url.com/xbox-0";
        $cms_title = "New Collection Title";
        $cms_tags = "";
        $NETWORK = "labs-t402.fyre.co";
        $NETWORK_KEY = ""; // Fill in with your key, this is the auth_clientkey for the domain you are working on
        $SITE_ID = "303827"; // Fill in with your site ID
        $SITE_KEY = ""; // Fill in with your site key, this is the site api_secret

        $metadata = array (
            "title" => $cms_title,
            "url" => $cms_permalink_url,
            "tags" => $cms_tags,
            "stream_type" => "livecomments"
        );

        $checksum = md5(json_encode($metadata));

        $metadata["checksum"] = $checksum;
        $metadata["articleId"] = $cms_content_id;
        $metadata["type"] = "livecomments";

        $collectionMeta = JWT::encode($metadata, $SITE_KEY);

    ?>
    <div id="listView"></div>

    <script src="../../lib/requirejs/require.js" type="text/javascript"></script>
    <script src="/requirejs.conf.js" type="text/javascript"></script>
    <script>
    require([
        'streamhub-sdk/content/views/content-list-view',
        'streamhub-sdk/collection',
        'streamhub-sdk/content'
    ],function (ListView, Collection, Content) {
        var opts = {
            "network": "<?php echo $NETWORK; ?>",
            "siteId": "<?php echo $SITE_ID; ?>",
            "articleId": "<?php echo $cms_content_id; ?>",
            "environment": "livefyre.com",
            "collectionMeta": "<?php echo $collectionMeta; ?>",
            "checksum" : "<?php echo $checksum; ?>",
            "signed": true
        };
        var listView = window.view = new ListView({
            initial: 1,
            showMore: 2,
            el: document.getElementById("listView")
        });

        var collection = window.collection =  new Collection(opts);

        collection.pipe(listView);

    });
    </script>
</body>
</html>
