const fs = require("fs-extra");
const path = require("path");
const utilscripts = require("./utilscripts");
const dodelete = require("./utilscripts").dodelete;
const docopy = require("./utilscripts").docopy;
const prepareScript = require("./prebuild");
const execSync = require("child_process").execSync;
const AdmZip = require("adm-zip");
const babylon = require("babylon");
const paths = require("./paths");
const file = require("./file");

const filesAndDirectories = [
  "jimu.js",
  "themes",
  "libs",
  "dynamic-modules",
  "config.json",
  "widgets",
  "META-INF",
  "WEB-INF",
  "index2.html"
];

exports.build = function(buildPath) {
  paths.setAppRoot(buildPath);
  let startTime = new Date();
  console.log(`########## BUILD START TIME: ${startTime} ##########`);
  createOrCleanDirectory(paths.buildSrc);
  copyFromAppRootToBuildSrc(filesAndDirectories);
  installDependenciesInBuildSrc(getBowerDependencies());
  createOrCleanDirectory(paths.buildOutput);
  generateAppProfileFile();
  generateAppConfigFile();
  defineDojoConfig();
  runDojoBuild();
  utilscripts.cleanUncompressedSource(paths.appPackages);
  createOrCleanDirectory(paths.appOutput);
  copyBuiltAppToAppOutput();
  utilscripts.cleanApp(paths.appOutput);
  utilscripts.cleanFilesInAppSource(paths.appRoot);
  dodelete(paths.appPackages);
  let promise = createZipFile();
  return promise;
};

function generateAppProfileFile() {
  prepareScript.prepare();
  console.log("Current location: " + paths.appRoot);
}

function generateAppConfigFile() {
  //currently done inside generateAppProfileFile
}

function createOrCleanDirectory(pathToDirectory) {
  dodelete(pathToDirectory);
  fs.mkdirSync(pathToDirectory);
}

function copyFromAppRootToBuildSrc(filesAndDirectories) {
  console.log(`Copying many files from ${paths.appRoot}`);
  console.log(filesAndDirectories);
  filesAndDirectories.forEach(function(name) {
    const from = path.join(paths.appRoot, name);
    const to = path.join(paths.buildSrc, name);
    fs.copySync(from, to);
  });
}

function getBowerDependencies() {
  const apiVersion = getArcgisJsApiVersion(paths.appRoot);
  return getDependenciesForApi(apiVersion);
}

function getArcgisJsApiVersion() {
  const envJsAsText = file.read(paths.envJsFile);
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

function defineDojoConfig() {
  let loadModule = "build";
  dojoConfig = {
    baseUrl: paths.buildSrc, // Where we will put our packages
    async: 1, // We want to make sure we are using the "modern" loader
    hasCache: {
      "host-node": 1, // Ensure we "force" the loader into Node.js mode
      dom: 0 // Ensure that none of the code assumes we have a DOM
    },
    // While it is possible to use config-tlmSiblingOfDojo to tell the
    // loader that your packages share the same root path as the loader,
    // this really isn't always a good idea and it is better to be
    // explicit about our package map.
    packages: [
      {
        name: "dojo",
        location: path.join(paths.buildSrc, "dojo")
      },
      {
        name: "pmm",
        location: path.join(paths.buildSrc, "widgets/pmm")
      },
      {
        name: "build",
        location: path.join(paths.buildSrc, "util/build")
      }
    ],
    deps: [loadModule] // And array of modules to load on "boot"
  };
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

function createZipFile() {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip();
      zip.addLocalFolder(paths.appOutput);
      zip.writeZip(paths.outputZip);
      console.log("########## BUILD END TIME: " + new Date() + " ##########");
      resolve({
        outputPath: paths.appOutput,
        outputZipPath: paths.outputZip
      });
    } catch (err) {
      console.log("Oh no! There was an error zipping the final build.", err);
      reject(err);
    }
  });
}

function copyBuiltAppToAppOutput() {
  console.log("Copying built app to " + paths.appOutput);
  createDirectory(paths.appOutput);
  createDirectory(paths.appOutputJimuJs);
  createDirectory(paths.appOutputArcgisJsApi);
  utilscripts.copyPartAppSrc(paths.appRoot, paths.appOutput);
  copyEnvJsAndReplaceApiUrl(paths.appOutput);
  utilscripts.copyAppBuildPackages(paths.appPackages, paths.appOutput);
  docopy(paths.appPackagesBuildReport, paths.appOutputBuildReport);
}

function createDirectory(path) {
  console.log("Creating  ", path);
  fs.mkdirsSync(path);
}

function copyEnvJsAndReplaceApiUrl(to) {
  var newApiUrl = "./arcgis-js-api";
  var oldApiRegEx = /(https:)?\/\/js.arcgis.com\/\d\.\d{1,2}/i;
  var fileContent = file.read(paths.envJsFile);
  fileContent = fileContent.replace(oldApiRegEx, newApiUrl);
  let toPath = path.join(to, "env.js");
  file.write(fileContent, toPath);
}
