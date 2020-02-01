const path = require("path");
const vm = require("vm");
const util = require("./util");
const paths = require("./paths");
const file = require("./file");
const serialize = require("serialize-javascript");

module.exports.generateAppProfileFile = generateAppProfileFile;

function loadProfileFile() {
  let profileStr = file.read(paths._appProfileJs);
  let profile = vm.runInThisContext(profileStr);
  return profile;
}

function generateAppProfileFile(options) {
  let profile = loadProfileFile();
  if (options.withLocales) {
    console.log("Building considering locales: " + options.withLocales);
    profile.localeList = options.withLocales;
  }
  let appConfig = file.readJson(paths.appConfigFile);
  addBuildLayersToProfile(appConfig, profile);
  addBuildFilesToProfile(profile);
  util.writeThemeResourceModule(paths.buildSrc, appConfig);
  writeAllWidgetResourceModules(appConfig);
  mergeAndWriteWidgetManifests(appConfig);
  writeProfile(profile);
  file.writeJson(appConfig, paths.buildGeneratedConfig);
}

function writeProfile(profile) {
  let profileStr = `profile = ${serializeWithFunctions(profile)} ;`;
  let toPath = paths.generatedAppProfileJs;
  file.write(profileStr, toPath);
}

/**
 * Use serializeWithFunctions() to enable usage of functions with resourceTags in _app.profile.js.
 */
function serializeWithFunctions(profile) {
  return serialize(profile, { unsafe: true });
}

////////////////layers
function addBuildLayersToProfile(appConfig, profile) {
  var dynamicLayers = getAllWidgetsLayers(appConfig);
  dynamicLayers.push(getThemeLayer(appConfig));

  dynamicLayers.forEach(layer => {
    profile.layers[layer.name] = {
      include: layer.include,
      exclude: layer.exclude
    };
  });

  var preloadLayers = getPreloadLayers(appConfig);
  preloadLayers.forEach(layer => {
    profile.layers["dynamic-modules/preload"].include.push(layer.name);
  });

  var postloadLayers = getPostLoadLayers(appConfig);
  postloadLayers.forEach(layer => {
    profile.layers["dynamic-modules/postload"].include.push(layer.name);
  });
}

function getPreloadLayers(appConfig) {
  var layers = [];
  layers.push(getThemeLayer(appConfig));
  layers = layers.concat(getOffPanelWidgetLayers(appConfig));
  return layers;
}

function getOffPanelWidgetLayers(appConfig) {
  let layers = [];
  util.visitElement(appConfig, function(e) {
    if (offPanelWidgetTest(e)) {
      var layer = { name: e.uri };
      layers.push(layer);
    }
  });
  return layers;
}

function getPostLoadLayers(appConfig) {
  var layers = [];
  util.visitElement(appConfig, function(e) {
    let isThemeWidget = themeWidgetTest(appConfig, e);
    if (inPanelWidgetTest(e, isThemeWidget)) {
      var layer = { name: e.uri };
      layers.push(layer);
    }
  });
  return layers;
}

function themeWidgetTest(appConfig, widget) {
  let themeName = appConfig.theme.name;
  return widget.uri && widget.uri.indexOf(`themes/${themeName}`) > -1;
}

function getThemeLayer(appConfig) {
  let themeName = appConfig.theme.name;
  var layer = {
    name: `themes/${themeName}/main`,
    include: [`themes/${themeName}/_build-generate_module`],
    exclude: ["jimu/main", "libs/main", "esri/main"]
  };
  return layer;
}

function getAllWidgetsLayers(appConfig) {
  var layers = [];
  util.visitElement(appConfig, function(e) {
    if (widgetTest(e)) {
      let amdFolder = util.getAmdFolderFromUri(e.uri);
      var layer = {
        name: e.uri,
        include: [`${amdFolder}/_build-generate_module`],
        exclude: ["jimu/main", "libs/main", "esri/main"]
      };
      layers.push(layer);
    }
  });
  return layers;
}

/////////////build files
function addBuildFilesToProfile(profile) {
  if (!profile.files) {
    profile.files = [];
  }
  profile.files.push([
    "./widgets/_build-generate_widgets-manifest.json",
    "./widgets/widgets-manifest.json"
  ]);
  profile.files.push(["./_build-generate_config.json", "./config.json"]);
}

/////////////////widget module
function writeAllWidgetResourceModules(appConfig) {
  util.visitElement(appConfig, function(e) {
    if (widgetTest(e)) {
      writeWidgetResourceModule(paths.buildSrc, e);
    }
  });
}

function widgetTest(e) {
  return !e.widgets && e.uri && e.visible !== false;
}

function inPanelWidgetTest(e, isThemeWidget) {
  return widgetTest(e) && !isThemeWidget && widgetIsInPanel(e.uri);
}

function offPanelWidgetTest(e) {
  return widgetTest(e) && !widgetIsInPanel(e.uri);
}

//basePath: the widgets folder's parent folder
//widget: same format with app config
function writeWidgetResourceModule(basePath, widget) {
  console.log("write widget [", widget.uri, "] resource.");
  widget.amdFolder = util.getAmdFolderFromUri(widget.uri);
  widget.basePath = basePath;
  let modules = getWidgetModules(widget);
  let content = util.createModuleContent(modules);
  let toPath = path.join(
    basePath,
    widget.amdFolder,
    "_build-generate_module.js"
  );
  file.write(content, toPath);
}

function getWidgetModules(widget) {
  let modulesString = [];
  let possibleModules = [
    //moduleName, moduleString
    ["Widget.html", "dojo/text!./Widget.html"],
    ["css/style.css", "dojo/text!./css/style.css"],
    ["nls/strings.js", "dojo/i18n!./nls/strings"],
    ["config.json", "dojo/text!./config.json"],
    [`../${widget.config}`, `dojo/text!${widget.config}`] //alternative path
  ];
  possibleModules.forEach(function(parts) {
    let moduleName = parts[0];
    let pathToModule = path.join(widget.basePath, widget.amdFolder, moduleName);
    if (file.exists(pathToModule)) {
      let moduleString = parts[1];
      modulesString.push(moduleString);
    }
  });
  return modulesString;
}

//////////////////////widget manifest
function mergeAndWriteWidgetManifests(appConfig) {
  var generatedManifest = {};
  util.visitElement(appConfig, function(e) {
    if (e.uri) {
      var widgetFolder = util.getAmdFolderFromUri(e.uri);
      var manifestFile = path.join(
        paths.buildSrc,
        widgetFolder,
        "manifest.json"
      );
      var manifestJson = file.readJson(manifestFile);
      manifestJson.location = path.join(paths.buildSrc, widgetFolder);
      manifestJson.category = "widget";
      if (manifestJson.featureActions) {
        util.addI18NFeatureActionsLabel(manifestJson);
      }
      util.addI18NLabel(manifestJson);
      delete manifestJson.location;
      generatedManifest[e.uri] = manifestJson;
    }
  });

  appConfig._buildInfo = {
    widgetManifestsMerged: true
  };

  let toPath = paths.buildGeneratedManifest;
  file.writeJson(generatedManifest, toPath);
}

function widgetIsInPanel(uri) {
  var folder = util.getAmdFolderFromUri(uri);
  var manifestFile = path.join(paths.buildSrc, folder, "manifest.json");
  if (file.exists(manifestFile)) {
    var manifest = file.readJson(manifestFile);
    return manifest.properties && manifest.properties.inPanel === false;
  }
  return true;
}
