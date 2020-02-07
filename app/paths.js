const path = require("path");

class Paths {
  constructor() {
    this._appRoot = process.cwd();
    this._appProfileJs = path.join(__dirname, "_app.profile.js");
  }
  setAppRoot(path) {
    this._appRoot = path;
  }
  get appRoot() {
    return this._appRoot || process.cwd();
  }
  get buildSrc() {
    return path.join(this.appRoot, "build-src");
  }
  get buildOutput() {
    return path.join(this.appRoot, "buildOutput");
  }
  get appConfigFile() {
    return path.join(this.appRoot, "config.json");
  }
  get generatedAppProfileJs() {
    return path.join(this.buildSrc, "app.profile.js");
  }
  get buildGeneratedManifest() {
    return path.join(
      this.buildSrc,
      "widgets/_build-generate_widgets-manifest.json"
    );
  }
  get buildGeneratedConfig() {
    return path.join(this.buildSrc, "_build-generate_config.json");
  }
  get appOutput() {
    return path.join(this.buildOutput, "app");
  }
  get appPackages() {
    return path.join(this.buildOutput, "app-packages");
  }
  get outputZip() {
    return path.join(this.buildOutput, "app.zip");
  }
  get appProfileJs() {
    return this._appProfileJs;
  }
  set appProfileJs(pathToFile) {
    this._appProfileJs = pathToFile;
  }
  get generatedBuildReport() {
    return path.join(this.appPackages, "build-report.txt");
  }
  get duplicatedModulesReport() {
    return path.join(this.appPackages, "duplicate-modules.txt");
  }
}

var singleton = new Paths();

module.exports = singleton;
