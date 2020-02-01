var util = require("./util");
var paths = require("paths");
var file = require("./file");

var modules = util.findDuplicatedModules(paths.generatedBuildReport);

var str = "";
for (var key in modules) {
  var line = key + ":\n  " + modules[key].join(",");
  str = str + "\n\n" + line;
}
if (str) {
  console.log(
    "build has duplicated modules.\
   Please see report here: \
   buildOutput/app-packages/duplicate-modules.txt"
  );
  let toPath = paths.duplicatedModulesReport;
  file.write(str, toPath);
}
