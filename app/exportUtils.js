// Tools to export WAB applications from the WAB Dev Edition Server directory
const path = require("path");
const hjson = require("hjson");
const file = require("./file");

/*******************
 *  exportApp
 *
 *  summary:
 *      Given the path to a WAB Dev Edition Server directory,
 *          this function will export that application into a new temp directory
 *          The application will be prepared to allow for use outside of the builder.
 *
 *  input:  (String) serverDir
 *              Directory containing and app within WAB Dev Edition
 *
 *  output: (String)
 *              Path to a new temp directory containing the WAB Application
 *
 *******************/
exports.exportApp = function(/*String*/ serverDir) {
  this._cleanDist();
  const tempDir = this._copyApp(serverDir);

  const envFileContents = file.read(path.join(tempDir, "env.js"));
  const configFileContents = file.read(path.join(tempDir, "config.json"));

  const newEnvFile = this._replaceApiPath(envFileContents);
  const newConfigFileObj = this._replaceProxyConfig(
    hjson.parse(configFileContents)
  );

  file.write(newEnvFile, `${tempDir}/env.js`);
  file.writeJson(newConfigFileObj, `${tempDir}/config.json`);

  return tempDir;
};

/*******************
 *  _cleanDist
 *
 *  summary:
 *      Checks for an existing dist directory and deletes
 *          it if one exists.
 *
 *
 *******************/
exports._cleanDist = function() {
  const distDir = path.join(process.cwd(), "dist");

  if (file.exists(distDir)) {
    console.log("Cleaning dist directory...");
    file.remove(distDir);
  }
};

/*******************
 *  _copyApp
 *
 *  summary:
 *      Given the path to a WAB Dev Edition Server directory,
 *          this function will copy that directory into a new dist directory
 *
 *  input:  (String) serverDir
 *              Directory containing and app within WAB Dev Edition
 *
 *  output: (String)
 *              Path to a new temp directory containing the WAB Application
 *
 *******************/
exports._copyApp = function(/*String*/ serverDir) {
  const distDir = path.join(process.cwd(), "dist");
  const ignoreFilesFolders = [".svn", ".git", "buildOutput", "build-src"];
  file.copyIgnoring(serverDir, distDir, ignoreFilesFolders);
  return distDir;
};

/*******************
 *  _replaceApiPath
 *
 *  summary:
 *      Given the contents of an env.js file, this function replaces the apiUrl section
 *      in order to replicate WAB Export functionality and allow use out side of the builder.
 *
 *  input:  (String) envFile
 *              Contents of a base env.js file
 *
 *  output: (String)
 *              Same env.js file contents, but with the apiUrl replaced appropriately.
 *
 *******************/
exports._replaceApiPath = function(/*String*/ envFile) {
  return envFile.replace("//apiUrl", "apiUrl");
};

/*******************
 *  _replaceProxyConfig
 *
 *  summary:
 *      Given the contents of a config.json object, this function replaces the httpProxy section
 *      in order to replicate WAB Export functionality and allow use out side of the builder.
 *
 *  input:  (Object) configObj
 *              Contents of a base env.js file
 *
 *  output: (Object)
 *              Same config.js object, but with the httpProxy value replaced appropriately.
 *
 *******************/
exports._replaceProxyConfig = function(/*String*/ configObj) {
  configObj.httpProxy = {
    useProxy: true,
    alwaysUseProxy: false,
    url: "",
    rules: []
  };

  return configObj;
};
