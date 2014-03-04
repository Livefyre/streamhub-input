var fs = require('fs');
if (process.env.BUILD_NUMBER) {
    var component = JSON.parse(fs.readFileSync('component.json'));

    component.version = component.version + (process.env.BUILD_EXT || "");

    fs.writeFileSync('component.json', JSON.stringify(component, null, "  "));
}
