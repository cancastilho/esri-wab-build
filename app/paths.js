const path = require("path");

class Paths {
  constructor() {
    this._appRoot = process.cwd();
    this._appProfileJs = path.join(__dirname, "_app.profile.js");
    this._buildToolConfig = path.join(__dirname, "buildToolConfig.js");
  }
  set appRoot(path) {
    if (path.isAbsolute(path)) {
      this._appRoot = path;
    } else {
      this._appRoot = path.join(process.cwd(), path);
    }
  }
  get appRoot() {
    return this._appRoot;
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
    if (path.isAbsolute(pathToFile)) {
      this._appProfileJs = pathToFile;
    } else {
      this._appProfileJs = path.join(process.cwd(), pathToFile);
    }
  }
  get buildToolConfigJs() {
    return this._buildToolConfig;
  }
  set buildToolConfigJs(pathToFile) {
    if (path.isAbsolute(pathToFile)) {
      this._buildToolConfig = pathToFile;
    } else {
      this._buildToolConfig = path.join(process.cwd(), pathToFile);
    }
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
