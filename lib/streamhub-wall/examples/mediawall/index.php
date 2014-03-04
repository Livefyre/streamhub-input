<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" type="text/css" href="../../lib/streamhub-sdk/src/css/style.css">
    <script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
    <style> body { margin: 0; padding: 0; background-color: #EFEFEF; }</style>
</head>
    <body>
        <?php
        // include the library include(dirname(__FILE__) . “/livefyre-api/libs/php/Livefyre.php”); // set up some values
            include(dirname(__FILE__) . "/JWT.php");

            $cms_content_id = "xbox-0";
            $cms_permalink_url = "http://www.url.com/xbox-0";
            $cms_title = "New Collection Title";
            $cms_tags = "";
            $NETWORK = "labs-t402.fyre.co";
            $NETWORK_KEY = "";// Fill in with your key, this is the auth_clientkey for the domain you are working on
            $SITE_ID = "303827"; // Fill in with your site ID
            $SITE_KEY = "";//""; // Fill in with your site key, this is the site api_secret

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
        
        <div id="view"></div>

        <script src="../../lib/requirejs/require.js" type="text/javascript"></script>
        <script src="/requirejs.conf.js" type="text/javascript"></script>
        <script>
            requirejs({
                baseUrl: "/"
            });
        </script>
        <script>
        require([
            'streamhub-sdk',
            'streamhub-sdk/collection',
            'streamhub-sdk/content',
            'streamhub-wall',
            'streamhub-sdk/collection/clients/stream-client'
        ],function (Hub, Collection, Content, MediaWallView, LivefyreStreamClient) {
            var opts = {
                "network": "<?php echo $NETWORK; ?>",
                "siteId": "<?php echo $SITE_ID; ?>",
                "articleId": "<?php echo $cms_content_id; ?>",
                "environment": "livefyre.com",
                "collectionMeta": "<?php echo $collectionMeta; ?>",
                "checksum" : "<?php echo $checksum; ?>",
                "signed": true
            };

            var view = window.view = new MediaWallView({
                el: document.getElementById("view"),
                minContentWidth: 300,
                //,columns: 6
                //,modal: false
                initial: 5,
                showMore: 2
            });

            var collection = new Collection(opts);
            collection.createArchive().pipe(view.more);
            collection.createUpdater().pipe(view);
            
/*             setInterval(function () {
                view.write(new Content({ body: 'poop' }));
            }, 5000); */
        });
        </script>
    </body>
</html>
