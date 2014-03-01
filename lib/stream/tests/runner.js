var phantom = require('phantom');

var child = require('child_process');

var serverProcess = child.spawn('./node_modules/http-server/bin/http-server',  ['.', '-p', '64646']);

phantom.create(function(ph) {
    ph.createPage(function(page) {
        page.set('onConsoleMessage', function(msg) {
            if (msg == "ConsoleReporter finished") {
                serverProcess.kill();
                process.exit();
                return;
            }
            console.log(msg);
        });
        
        page.open('http://localhost:64646/tests/index.html');
        setTimeout(function() {
            serverProcess.kill();
            process.exit();
            return;
        }, 1000 * 60);
    });
});
