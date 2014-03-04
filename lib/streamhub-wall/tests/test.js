require(['jasmine', 'jasmine-html', 'jquery'], function (jasmine, jasmineHtml, $) {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    // HTMLReporter
	var htmlReporter = new jasmine.HtmlReporter();
	jasmineEnv.addReporter(htmlReporter);
	jasmineEnv.specFilter = function(spec) {
		return htmlReporter.specFilter(spec);
	};

    // Copy jasmine globals
    ['spyOn', 'waitsFor', 'waits', 'runs', 'expect'].forEach(function (key) {
        window[key] = function () {
            var spec = jasmine.getEnv().currentSpec;
            return spec[key].apply(spec, arguments);
        };
    });
    ['beforeEach', 'afterEach', 'describe', 'it'].forEach(function (key) {
        window[key] = jasmineEnv[key].bind(jasmineEnv);
    });
    require(['tests/spec/MediaWallView'], function(){
        $(function(){
            jasmineEnv.execute();
        });
    });
});
