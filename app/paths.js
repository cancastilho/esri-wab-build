const path = require("path");

var appRoot = process.cwd();

function setAppRoot(buildPath) {
  appRoot = buildPath || process.cwd();
}

module.exports = {
  setAppRoot: setAppRoot,
  appRoot: appRoot,
  buildSrc: path.join(appRoot, "build-src"),
  buildOutput: path.join(appRoot, "buildOutput"),
  appConfigFile: path.join(appRoot, "config.json"),
  appOutput: path.join(appRoot, "buildOutput", "app"),
  appPackages: path.join(appRoot, "buildOutput", "app-packages"),
  envJsFile: path.join(appRoot, "env.js"),
  outputZip: path.join(appRoot, "buildOutput", "app.zip"),
  appOutputJimuJs: path.join(appRoot, "buildOutput", "app", "jimu.js"),
  appOutputArcgisJsApi: path.join(
    appRoot,
    "buildOutput",
    "app",
    "arcgis-js-api"
  ),
  appPackagesBuildReport: path.join(
    appRoot,
    "buildOutput",
    "app-packages",
    "build-report.txt"
  ),
  appOutputBuildReport: path.join(
    appRoot,
    "buildOutput",
    "app",
    "build-report.txt"
  ),
  _appProfileJs: path.join(__dirname, "_app.profile.js"),
  generatedAppProfileJs: path.join(appRoot, "build-src", "app.profile.js")
};
