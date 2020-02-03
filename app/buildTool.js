const path = require("path");
const util = require("./util");
const preparebuild = require("./prebuild");
const execSync = require("child_process").execSync;
const babylon = require("babylon");
const paths = require("./paths");
const file = require("./file");
const copyFilesFromTo = require("./file").copyFilesFromTo;
const buildToolConfig = require("./buildToolConfig");

exports.build = build;

function build(options) {
  return new Promise((resolve, reject) => {
    try {
      let result = buildSync(options);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

function buildSync(options) {
  paths.setAppRoot(options.path);
  let startTime = new Date();
  console.log(`########## BUILD START TIME: ${startTime} ##########`);
  if (!options.skipBowerInstall) {
    file.createOrCleanDirectory(paths.buildSrc);
    if (options.withApiVersion) {
      installBowerDependenciesForApi(options.withApiVersion);
    } else {
      installDefaultBowerDependencies();
    }
  }
  copyFilesToBuildFromTo(paths.appRoot, paths.buildSrc);
  file.createOrCleanDirectory(paths.buildOutput);
  preparebuild.generateAppProfileFile(options);
  runDojoBuild();
  util.cleanUncompressedSource(paths.appPackages);
  file.createOrCleanDirectory(paths.appOutput);
  copyBuiltAppTo(paths.appOutput);
  util.cleanFilesInAppOutput(paths.appOutput);
  util.cleanFilesInBuildSource(paths.buildSrc);

  //Some files just dont build right.
  copyUnbuiltFilesFromTo(paths.appRoot, paths.appOutput);
  file.remove(paths.appPackages);
  if (options.zipApp) {
    file.createZipFromTo(paths.appOutput, paths.outputZip);
  }
  console.log("########## BUILD END TIME: " + new Date() + " ##########");
  let result = {
    outputPath: paths.appOutput,
    outputZipPath: paths.outputZip
  };
  return result;
}

function copyFilesToBuildFromTo(fromPath, toPath) {
  let files = buildToolConfig.filesAndDirectoriesToBuild;
  copyFilesFromTo(files, fromPath, toPath);
}

function installDefaultBowerDependencies() {
  const apiVersion = getArcgisJsApiVersionFromEnvJs(paths.appRoot);
  let bowerDependencies = getDependenciesForApi(apiVersion);
  installDependenciesInBuildSrc(bowerDependencies);
}

function installBowerDependenciesForApi(apiVersion) {
  let bowerDependencies = getDependenciesForApi(apiVersion);
  installDependenciesInBuildSrc(bowerDependencies);
}

function getArcgisJsApiVersionFromEnvJs(folderPath) {
  const envJsAsText = file.read(getEnvJsPath(folderPath));
  const envJs = babylon.parse(envJsAsText);
  const apiVersionIndex = envJs.tokens.findIndex(function(token) {
    if (token.value === "apiVersion") {
      return true;
    }
    return false;
  });
  const apiVersion = envJs.tokens[apiVersionIndex + 2].value;
  console.log("Arcgis JS Api version found in env.js: " + apiVersion);
  return apiVersion;
}

function getEnvJsPath(folderPath) {
  return path.join(folderPath, "env.js");
}

function getDependenciesForApi(apiVersion) {
  // We always include the arcgis-js-api dependency. If the JS API version is greater than 3.25, we must include dijit-themes:
  // https://github.com/Esri/jsapi-resources/commit/7f26c7bc7a1ee305102cd7b1f95d1631df0edbd5#diff-265400d6fce2c9b60ecb6dbea36d979f
  let dependencies = [
    `esri=arcgis-js-api#${apiVersion}`,
    "dgauges=https://github.com/dmandrioli/dgauges.git#383a47f2216be432d866d1add0a95ce40f62da52"
  ];
  if (apiVersion > 3.25) {
    dependencies.push(
      "dijit-themes=https://github.com/dojo/dijit-themes.git#1.14.0"
    );
  }
  return dependencies;
}

function installDependenciesInBuildSrc(dependencies) {
  let deps = dependencies.join(" ");
  let command = `bower install ${deps} --force-latest --config.directory=.`;
  console.log("Installing dependencies in: " + paths.buildSrc);
  execute(command, paths.buildSrc);
}

function runDojoBuild() {
  try {
    let dojoJs = path.join("dojo", "dojo.js");
    let command = `node ${dojoJs} load=build profile=app.profile.js`;
    execute(command, paths.buildSrc);
    console.log("build finished");
  } catch (e) {
    console.log('build always "fails"');
  }
}

function execute(command, where) {
  const execArgs = {
    cwd: where,
    stdio: [0, 1, 2]
  };
  console.log("Running " + command);
  execSync(command, execArgs);
}

function copyBuiltAppTo(toPath) {
  copyEnvJsAndReplaceApiUrl(paths.appRoot, toPath);
  copyAppBuildPackagesToArcgisJsFolder(paths.appPackages, toPath);
  copyAppBuildPackagesToOutputAppRoot(paths.appPackages, toPath);
}

function copyUnbuiltFilesFromTo(fromPath, toPath) {
  let files = buildToolConfig.unbuiltFiles;
  copyFilesFromTo(files, fromPath, toPath);
}

function copyAppBuildPackagesToArcgisJsFolder(fromPath, toPath) {
  let files = buildToolConfig.builtFilesToCopyToArcgisJsFolder;
  let toArcgisJsPath = path.join(toPath, "arcgis-js-api");
  copyFilesFromTo(files, fromPath, toArcgisJsPath);
}

function copyAppBuildPackagesToOutputAppRoot(fromPath, toPath) {
  let files = buildToolConfig.builtFilesToCopyToAppOutput;
  copyFilesFromTo(files, fromPath, toPath);
}

function copyEnvJsAndReplaceApiUrl(from, to) {
  var newApiUrl = "./arcgis-js-api";
  var oldApiRegEx = /(https:)?\/\/js.arcgis.com\/\d\.\d{1,2}/i;
  var fileContent = file.read(getEnvJsPath(from));
  fileContent = fileContent.replace(oldApiRegEx, newApiUrl);
  let toPath = getEnvJsPath(to);
  file.write(fileContent, toPath);
}
