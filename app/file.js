const fs = require("fs-extra");

const encoding = "utf-8";

module.exports = {
  read: function(pathToFile) {
    return fs.readFileSync(pathToFile, encoding);
  },
  write: function(content, pathToFile) {
    return fs.writeFileSync(pathToFile, content, encoding);
  },
  writeJson: function(jsonObject, pathToJsonFile) {
    return fs.writeJsonSync(pathToJsonFile, jsonObject, encoding);
  },
  readJson: function(pathToJsonFile) {
    return fs.readJsonSync(pathToJsonFile, encoding);
  }
};
