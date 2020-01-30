const path = require("path");
const fs = require("fs");
const requirejs = require("requirejs");
const file = require("./file");

exports.writeWidgetResourceModule = writeWidgetResourceModule;
exports.writeThemeResourceModule = writeThemeResourceModule;
exports.visitElement = visitElement;
exports.addI18NFeatureActionsLabel = addI18NFeatureActionsLabel;
exports.addI18NLabel = addI18NLabel;
exports.getAmdFolderFromUri = getAmdFolderFromUri;
exports.findDuplicatedModules = findDuplicatedModules;
exports.cleanFilesInBuildOutput = cleanFilesInBuildOutput;
exports.cleanFilesInAppSource = cleanFilesInAppSource;
exports.cleanUncompressedSource = cleanUncompressedSource;

//basePath: the widgets folder's parent folder
//widget: same format with app config
function writeWidgetResourceModule(basePath, widget) {
  console.log("write widget [", widget.uri, "] resource.");
  widget.amdFolder = getAmdFolderFromUri(widget.uri);
  widget.basePath = basePath;
  let modules = getWidgetModules(widget);
  let content = createModuleContent(modules);
  let toPath = path.join(
    basePath,
    widget.amdFolder,
    "_build-generate_module.js"
  );
  file.write(content, toPath);
}

function createModuleContent(modules) {
  var deps = modules.map(function (module) {
    return '"' + module + '"';
  });
  let dependencies = deps.join(",\n");
  content = `define([ ${dependencies} ], function(){});`;
  return content;
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
  possibleModules.forEach(function (partes) {
    let moduleName = partes[0];
    let pathToModule = path.join(widget.basePath, widget.amdFolder, moduleName);
    if (file.exists(pathToModule)) {
      let moduleString = partes[1];
      modulesString.push(moduleString);
    }
  });
  return modulesString;
}

function writeThemeResourceModule(basePath, options) {
  let modules = [].concat(
    getThemePanelModules(basePath, options),
    getThemeStyleModules(basePath, options),
    getThemeNlsModule(basePath, options)
  );
  let content = createModuleContent(modules);
  let themeName = getThemeNameFrom(options);
  let toPath = path.join(
    basePath,
    "themes",
    themeName,
    "_build-generate_module.js"
  );
  file.write(content, toPath);
}

function getThemeNameFrom(options) {
  if (typeof options === "object") {
    themeName = options.theme.name;
  } else {
    themeName = options;
  }
  return themeName;
}

function getThemePanelModules(basePath, options) {
  var modules = [],
    appConfig,
    themeName;
  if (typeof options === "object") {
    appConfig = options;
    if (appConfig.widgetOnScreen.panel && appConfig.widgetOnScreen.panel.uri) {
      modules.push(
        "./panels/" +
        getNameFromUri(appConfig.widgetOnScreen.panel.uri) +
        "/Panel"
      );
    }
    if (appConfig.widgetPool.panel && appConfig.widgetPool.panel.uri) {
      modules.push(
        "./panels/" + getNameFromUri(appConfig.widgetPool.panel.uri) + "/Panel"
      );
    }

    visitElement(appConfig, function (e) {
      if (e.widgets && e.panel && e.panel.uri) {
        modules.push("./panels/" + getNameFromUri(e.panel.uri) + "/Panel");
      }
    });
  } else {
    themeName = options;
    if (file.exists(path.join(basePath, themeName, "panels"))) {
      fs.readdirSync(path.join(basePath, themeName, "panels")).forEach(function (
        panelName
      ) {
        modules.push("./panels/" + panelName + "/Panel");
      });
    }
  }
  return modules;
}

function getThemeStyleModules(basePath, options) {
  let appConfig;
  let themeName;
  let commonCssFile
  let defaultStyleFileName;

  if (typeof options === "object") {
    appConfig = options;
    themeName = appConfig.theme.name;
  } else {
    themeName = options;
  }
  commonCssFile = path.join(basePath, "themes", themeName, "common.css");
  if (appConfig) {
    defaultStyleFileName =
      appConfig.theme.styles && appConfig.theme.styles[0]
        ? appConfig.theme.styles && appConfig.theme.styles[0]
        : "default";
  } else {
    defaultStyleFileName = "default";
  }

  var defaultStyleFile = path.join(
    basePath,
    "themes",
    themeName,
    "styles",
    defaultStyleFileName,
    "style.css"
  );

  let modules = [];
  if (file.exists(commonCssFile)) {
    modules.push("dojo/text!./common.css");
  }
  if (file.exists(defaultStyleFile)) {
    modules.push("dojo/text!./styles/" + defaultStyleFileName + "/style.css");
  }
  return modules;
}

function getThemeNlsModule(basePath, options) {
  let modules = [];
  let appConfig;
  let themeName;

  if (typeof options === "object") {
    appConfig = options;
    themeName = appConfig.theme.name;
  } else {
    themeName = options;
  }

  var str;
  if (
    file.exists(path.join(basePath, "themes", themeName, "nls/strings.js"))
  ) {
    str = "dojo/i18n!./nls/strings";
  }
  modules.push(str);
  return modules;
}

function addI18NFeatureActionsLabel(manifest) {
  if (!file.exists(path.join(manifest.location, "nls"))) {
    return;
  }
  // get feature actions
  var featureActions = manifest.featureActions;
  featureActions.forEach(function (featureAction) {
    manifest["i18nLabels_featureAction_" + featureAction.name] = {};
    //theme or widget label
    var key = "_featureAction_" + featureAction.name;
    var defaultStrings = requirejs(
      path.join(manifest.location, "nls/strings.js")
    );
    if (defaultStrings.root && defaultStrings.root[key]) {
      manifest["i18nLabels_featureAction_" + featureAction.name].defaultLabel =
        defaultStrings.root[key];
    }
    for (var p in defaultStrings) {
      if (p === "root" || !defaultStrings[p]) {
        continue;
      }
      if (
        !file.exists(path.join(manifest.location, "nls", p, "strings.js"))
      ) {
        continue;
      }

      var localeStrings = requirejs(
        path.join(manifest.location, "nls", p, "strings.js")
      );
      if (localeStrings[key]) {
        manifest["i18nLabels_featureAction_" + featureAction.name][p] =
          localeStrings[key];
      }
    }
  });
}

function addI18NLabel(manifest) {
  manifest.i18nLabels = {};
  if (!file.exists(path.join(manifest.location, "nls"))) {
    return;
  }
  //theme or widget label
  var key = manifest.category === "widget" ? "_widgetLabel" : "_themeLabel";
  var defaultStrings = requirejs(
    path.join(manifest.location, "nls/strings.js")
  );
  if (defaultStrings.root && defaultStrings.root[key]) {
    manifest.i18nLabels.defaultLabel = defaultStrings.root[key];

    //theme's layout and style label
    if (manifest.category === "theme") {
      if (manifest.layouts) {
        manifest.layouts.forEach(function (layout) {
          manifest["i18nLabels_layout_" + layout.name] = {};
          manifest["i18nLabels_layout_" + layout.name].defaultLabel =
            defaultStrings.root["_layout_" + layout.name];
        });
      }

      if (manifest.styles) {
        manifest.styles.forEach(function (style) {
          manifest["i18nLabels_style_" + style.name] = {};
          manifest["i18nLabels_style_" + style.name].defaultLabel =
            defaultStrings.root["_style_" + style.name];
        });
      }
    }
  }
  for (var p in defaultStrings) {
    if (p === "root" || !defaultStrings[p]) {
      continue;
    }
    if (!file.exists(path.join(manifest.location, "nls", p, "strings.js"))) {
      continue;
    }

    var localeStrings = requirejs(
      path.join(manifest.location, "nls", p, "strings.js")
    );
    if (localeStrings[key]) {
      manifest.i18nLabels[p] = localeStrings[key];
    }

    //theme's layout and style label
    if (manifest.category === "theme") {
      if (manifest.layouts) {
        manifest.layouts.forEach(function (layout) {
          manifest["i18nLabels_layout_" + layout.name][p] =
            localeStrings["_layout_" + layout.name];
        });
      }

      if (manifest.styles) {
        manifest.styles.forEach(function (style) {
          manifest["i18nLabels_style_" + style.name][p] =
            localeStrings["_style_" + style.name];
        });
      }
    }
  }
}

function getNameFromUri(uri) {
  var segs = uri.split("/");
  segs.pop();
  return segs.pop();
}

function getAmdFolderFromUri(uri) {
  var segs = uri.split("/");
  segs.pop();
  return segs.join("/");
}

function visitElement(config, cb) {
  visitBigSection("widgetOnScreen", cb);
  visitBigSection("widgetPool", cb);

  function visitBigSection(section, cb) {
    var i, j, isThemeWidget;
    if (config[section]) {
      if (config[section].groups) {
        for (i = 0; i < config[section].groups.length; i++) {
          cb(config[section].groups[i], i, false, section === "widgetOnScreen");
          for (j = 0; j < config[section].groups[i].widgets.length; j++) {
            isThemeWidget =
              config[section].groups[i].widgets[j].uri &&
              config[section].groups[i].widgets[j].uri.indexOf(
                "themes/" + config.theme.name
              ) > -1;
            cb(
              config[section].groups[i].widgets[j],
              j,
              isThemeWidget,
              section === "widgetOnScreen"
            );
          }
        }
      }

      if (config[section].widgets) {
        for (i = 0; i < config[section].widgets.length; i++) {
          isThemeWidget =
            config[section].widgets[i].uri &&
            config[section].widgets[i].uri.indexOf(
              "themes/" + config.theme.name
            ) > -1;
          cb(
            config[section].widgets[i],
            i,
            isThemeWidget,
            section === "widgetOnScreen"
          );
        }
      }
    }
  }
}

function copyImageTest(src, dest) {
  //directory
  if (/^((?!\.[a-zA-Z]{1,4}).)*$/.test(src)) {
    console.log(src);
    return true;
  }
  if (/(images|icons)/.test(src)) {
    console.log(src);
    return true;
  }
  return false;
}

//visit all of the folder's file and its sub-folders.
//if callback function return true, stop visit.
function visitFolderFiles(folderPath, callback) {
  let allPaths = createPaths(folderPath);
  while (allPaths.length > 0) {
    let currentPath = allPaths.pop();
    let currentFileName = path.basename(currentPath);
    let stop = callback(currentPath, currentFileName);
    if (file.isDirectory(currentPath)) {
      if (!stop) {
        let moreFilePaths = createPaths(currentPath);
        allPaths = allPaths.concat(moreFilePaths);
      }
    }
  }
}

function createPaths(folderPath) {
  let fileNames = fs.readdirSync(folderPath);
  return fileNames.map(filename => path.join(folderPath, filename));
}

function findDuplicatedModules(buildReportFile) {
  var modules = {};
  var report = fs.readFileSync(buildReportFile, "utf-8");
  var splitor;
  if (report.indexOf("\r\n") > -1) {
    splitor = "\r\n";
  } else {
    splitor = "\n";
  }
  var lines = report.split(splitor);
  var startLine = -1;
  var layers = [],
    currentLayer;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i] === "Layer Contents:") {
      startLine = i;
    }
    if (lines[i] === "Optimizer Messages:") {
      break;
    }
    if (lines[i] === "") {
      continue;
    }
    //this is the layer contents
    if (startLine > 0 && i > startLine) {
      if (!/^\s/.test(lines[i])) {
        //it's layer
        currentLayer = {
          name: lines[i],
          modules: []
        };
        layers.push(currentLayer);
      } else {
        //it's module
        var m = lines[i].replace(/\s/g, "");
        currentLayer.modules.push(m);
        if (modules[m]) {
          modules[m].push(currentLayer.name);
        } else {
          modules[m] = [currentLayer.name];
        }
      }
    }
  }
  var duplicatedModules = {};
  for (var key in modules) {
    fixLayers(modules[key]);
    if (modules[key].length > 1) {
      duplicatedModules[key] = modules[key];
    }
  }

  function fixLayers(layers) {
    //some layers we ignore them
    var ignoreLayers = [
      "dynamic-modules/preload:",
      "dynamic-modules/postload:"
    ];
    var discardLayers = [
      "jimu/dijit-all:",
      "esri/main:",
      "dgrid/main:",
      "xstyle/main:"
    ];

    [].concat(ignoreLayers, discardLayers).forEach(function (layer) {
      var i = layers.indexOf(layer);
      if (i > -1) {
        layers.splice(i, 1);
      }
    });

    if (layers.length === 2) {
      //we ignore same module in widget and it's setting page
      var segs1 = layers[0].split("/");
      var segs2 = layers[1].split("/");
      if (segs1[0] === "widgets" && segs1[1] === segs2[1]) {
        layers.splice(0, 2);
      }
    }
  }
  return duplicatedModules;
}

function cleanFilesInBuildOutput(appOutput) {
  removeNlsSource(path.join(appOutput, "dynamic-modules/nls"));
  //cleanJimu(appOutput);
  fs.readdirSync(path.join(appOutput, "themes")).forEach(function (themeName) {
    removeNlsSource(path.join(appOutput, "themes", themeName, "nls"));
    file.remove(path.join(appOutput, "themes", themeName, "nls/strings.js"));
    var themeWidgetsPath = path.join(appOutput, "themes", themeName, "widgets");
    if (file.exists(themeWidgetsPath)) {
      removeWidgetsNls(themeWidgetsPath);
    }
  });
  removeWidgetsNls(path.join(appOutput, "widgets"));
  cleanBuildeGeneratedFiles(appOutput);
}

function removeWidgetsNls(widgetsPath) {
  fs.readdirSync(widgetsPath).forEach(function (widgetName) {
    let pathToWidget = path.join(widgetsPath, widgetName);
    removeNlsSource(path.join(pathToWidget, "nls"));
    removeNlsSource(path.join(pathToWidget, "setting/nls"));
    let widgetFiles = [
      "Widget.html",
      "manifest.json",
      "css/style.css",
      "nls/strings.js",
      "setting/Setting.html",
      "setting/css/style.css",
      "setting/nls/strings.js"
    ];
    widgetFiles.forEach(widgetFile => {
      file.remove(path.join(pathToWidget, widgetFile));
    });
  });
}

function cleanJimu(appOutput) {
  removeNlsSource(path.join(appOutput, "jimu.js/nls"));
  //remove dijit
  fs.readdirSync(path.join(appOutput, "jimu.js/dijit")).forEach(function (
    fileName
  ) {
    var filePath = path.join(appOutput, "jimu.js/dijit", fileName);
    if (fileName !== "SymbolsInfo") {
      file.remove(filePath);
    }
  });
  file.remove(path.join(appOutput, "jimu.js/LayerInfos"));
  //remove framework files
  fs.readdirSync(path.join(appOutput, "jimu.js")).forEach(function (fileName) {
    var filePath = path.join(appOutput, "jimu.js", fileName);
    if (
      file.isFile(filePath) &&
      fileName !== "main.js" &&
      fileName !== "oauth-callback.html"
    ) {
      file.remove(filePath);
    }
  });
}

function removeNlsSource(folderPath) {
  if (!file.exists(folderPath)) {
    return;
  }
  fs.readdirSync(folderPath).forEach(function (fileName) {
    var filePath = path.join(folderPath, fileName);
    if (file.isDirectory(filePath)) {
      file.remove(filePath);
    }
  });
}

function cleanFilesInAppSource(appPath) {
  cleanBuildeGeneratedFiles(appPath);
  file.remove(path.join(appPath, "dynamic-modules/nls"));
  file.remove(path.join(appPath, "dynamic-modules/themes"));
  file.remove(path.join(appPath, "dynamic-modules/widgets"));
}

function cleanBuildeGeneratedFiles(path) {
  console.log(`Removing _build-generate_ files in ${path}`);
  //clean _build-generate_ files
  visitFolderFiles(path, function (filePath, fileName) {
    if (isBuildGeneratedFile(filePath, fileName)) {
      file.remove(filePath);
    }
  });
}

function isBuildGeneratedFile(filePath, fileName) {
  return file.isFile(filePath) && /^_build-generate_/.test(fileName);
}

function cleanUncompressedSource(path) {
  console.log(`Removing uncompressed.js files in ${path}`);
  visitFolderFiles(path, function (filePath) {
    if (isUncompressedFile(filePath)) {
      file.remove(filePath);
    }
  });
}

function isUncompressedFile(filePath) {
  return !file.isDirectory(filePath) && /.uncompressed.js$/.test(filePath);
}