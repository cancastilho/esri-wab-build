var path = require("path");
var fs = require("fs");
var requirejs = require("requirejs");
var fse = require("fs-extra");
const file = require("./file");

exports.writeWidgetResourceModule = writeWidgetResourceModule;
exports.writeThemeResourceModule = writeThemeResourceModule;
exports.visitElement = visitElement;
exports.addI18NFeatureActionsLabel = addI18NFeatureActionsLabel;
exports.addI18NLabel = addI18NLabel;
exports.getAmdFolderFromUri = getAmdFolderFromUri;
exports.copyPartAppSrc = copyPartAppSrc;
exports.copyAppBuildPackages = copyAppBuildPackages;
exports.docopy = docopy;
exports.dodelete = dodelete;
exports.findDuplicatedModules = findDuplicatedModules;
exports.cleanApp = cleanApp;
exports.cleanFilesInAppSource = cleanFilesInAppSource;
exports.cleanUncompressedSource = cleanUncompressedSource;

//basePath: the widgets folder's parent folder
//widget: same format with app config
function writeWidgetResourceModule(basePath, widget) {
  var modules = [];

  console.log("write widget [", widget.uri, "] resource.");

  widget.amdFolder = getAmdFolderFromUri(widget.uri);
  widget.basePath = basePath;

  if (getWidgetTemplateModule(widget)) {
    modules.push(getWidgetTemplateModule(widget));
  }
  if (getWidgetStyleModule(widget)) {
    modules.push(getWidgetStyleModule(widget));
  }
  if (getWidgetNlsModule(widget)) {
    modules.push(getWidgetNlsModule(widget));
  }
  if (getWidgetConfigModule(widget)) {
    modules.push(getWidgetConfigModule(widget));
  }

  var deps = modules.map(function(module) {
    return '"' + module + '"';
  });

  var str = "define([" + deps.join(",\n") + "], function(){});";
  let toPath = path.join(
    basePath,
    getAmdFolderFromUri(widget.uri),
    "_build-generate_module.js"
  );
  file.write(str, toPath);
}

function getWidgetTemplateModule(widget) {
  var str;
  if (
    fs.existsSync(path.join(widget.basePath, widget.amdFolder, "Widget.html"))
  ) {
    str = "dojo/text!./Widget.html";
  }
  return str;
}

function getWidgetStyleModule(widget) {
  var str;
  if (
    fs.existsSync(path.join(widget.basePath, widget.amdFolder, "css/style.css"))
  ) {
    str = "dojo/text!./css/style.css";
  }
  return str;
}

function getWidgetNlsModule(widget) {
  var str;
  if (
    fs.existsSync(
      path.join(widget.basePath, widget.amdFolder, "nls/strings.js")
    )
  ) {
    str = "dojo/i18n!./nls/strings";
  }
  return str;
}

function getWidgetConfigModule(widget) {
  var str;
  if (widget.config && typeof widget.config === "object") {
    return;
  } else if (
    widget.config &&
    fs.existsSync(path.join(widget.basePath, widget.config))
  ) {
    str = "dojo/text!" + widget.config;
  } else if (
    fs.existsSync(path.join(widget.basePath, widget.amdFolder, "config.json"))
  ) {
    str = "dojo/text!./config.json";
  } else {
    return;
  }
  return str;
}

function writeThemeResourceModule(basePath, options) {
  var modules = [].concat(
    getThemePanelModules(basePath, options),
    getThemeStyleModules(basePath, options),
    getThemeNlsModule(basePath, options)
  );

  var deps = modules.map(function(module) {
    return '"' + module + '"';
  });

  var str = "define([" + deps.join(",\n") + "], function(){});";

  var themeName;
  if (typeof options === "object") {
    themeName = options.theme.name;
  } else {
    themeName = options;
  }
  let toPath = path.join(
    basePath,
    "themes",
    themeName,
    "_build-generate_module.js"
  );
  file.write(str, toPath);
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

    visitElement(appConfig, function(e) {
      if (e.widgets && e.panel && e.panel.uri) {
        modules.push("./panels/" + getNameFromUri(e.panel.uri) + "/Panel");
      }
    });
  } else {
    themeName = options;
    if (fs.existsSync(path.join(basePath, themeName, "panels"))) {
      fs.readdirSync(path.join(basePath, themeName, "panels")).forEach(function(
        panelName
      ) {
        modules.push("./panels/" + panelName + "/Panel");
      });
    }
  }
  return modules;
}

function getThemeStyleModules(basePath, options) {
  var modules = [],
    appConfig,
    themeName;

  var commonCssFile, defaultStyleFileName;

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

  if (fs.existsSync(commonCssFile)) {
    modules.push("dojo/text!./common.css");
  }

  if (fs.existsSync(defaultStyleFile)) {
    modules.push("dojo/text!./styles/" + defaultStyleFileName + "/style.css");
  }
  return modules;
}

function getThemeNlsModule(basePath, options) {
  var modules = [],
    appConfig,
    themeName;

  if (typeof options === "object") {
    appConfig = options;
    themeName = appConfig.theme.name;
  } else {
    themeName = options;
  }

  var str;
  if (
    fs.existsSync(path.join(basePath, "themes", themeName, "nls/strings.js"))
  ) {
    str = "dojo/i18n!./nls/strings";
  }
  modules.push(str);
  return modules;
}

function addI18NFeatureActionsLabel(manifest) {
  if (!fs.existsSync(path.join(manifest.location, "nls"))) {
    return;
  }
  // get feature actions
  var featureActions = manifest.featureActions;
  featureActions.forEach(function(featureAction) {
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
        !fs.existsSync(path.join(manifest.location, "nls", p, "strings.js"))
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
  if (!fs.existsSync(path.join(manifest.location, "nls"))) {
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
        manifest.layouts.forEach(function(layout) {
          manifest["i18nLabels_layout_" + layout.name] = {};
          manifest["i18nLabels_layout_" + layout.name].defaultLabel =
            defaultStrings.root["_layout_" + layout.name];
        });
      }

      if (manifest.styles) {
        manifest.styles.forEach(function(style) {
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
    if (!fs.existsSync(path.join(manifest.location, "nls", p, "strings.js"))) {
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
        manifest.layouts.forEach(function(layout) {
          manifest["i18nLabels_layout_" + layout.name][p] =
            localeStrings["_layout_" + layout.name];
        });
      }

      if (manifest.styles) {
        manifest.styles.forEach(function(style) {
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

function copyPartAppSrc(from, to) {
  docopy(path.join(from, "index.html"), path.join(to, "index.html"));
  docopy(path.join(from, "init.js"), path.join(to, "init.js"));
  docopy(path.join(from, "simpleLoader.js"), path.join(to, "simpleLoader.js"));
  docopy(path.join(from, "web.config"), path.join(to, "web.config"));
  docopy(path.join(from, "images"), path.join(to, "images"));
  docopy(
    path.join(from, "config-readme.txt"),
    path.join(to, "config-readme.txt")
  );
  docopy(path.join(from, "readme.html"), path.join(to, "readme.html"));
  docopy(path.join(from, "configs"), path.join(to, "configs"), true);
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

function copyAppBuildPackages(from, to) {
  docopy(
    path.join(from, "dgrid/css"),
    path.join(to, "arcgis-js-api/dgrid/css")
  );
  docopy(
    path.join(from, "dijit/icons"),
    path.join(to, "arcgis-js-api/dijit/icons")
  );
  docopy(
    path.join(from, "dijit/themes/claro/claro.css"),
    path.join(to, "arcgis-js-api/dijit/themes/claro/claro.css")
  );
  docopy(
    path.join(from, "dijit/themes/claro"),
    path.join(to, "arcgis-js-api/dijit/themes/claro"),
    null,
    copyImageTest
  );
  docopy(
    path.join(from, "dojo/resources"),
    path.join(to, "arcgis-js-api/dojo/resources")
  );
  docopy(
    path.join(from, "dojo/dojo.js"),
    path.join(to, "arcgis-js-api/dojo/dojo.js")
  );
  docopy(path.join(from, "dojo/nls"), path.join(to, "arcgis-js-api/dojo/nls"));
  docopy(
    path.join(from, "dojox/gfx/svg.js"),
    path.join(to, "arcgis-js-api/dojox/gfx/svg.js")
  );
  docopy(
    path.join(from, "dojox/grid/resources"),
    path.join(to, "arcgis-js-api/dojox/grid/resources"),
    null,
    copyImageTest
  );
  docopy(
    path.join(from, "dojox/layout/resources"),
    path.join(to, "arcgis-js-api/dojox/layout/resources"),
    null,
    copyImageTest
  );
  docopy(
    path.join(from, "dojox/layout/resources/ResizeHandle.css"),
    path.join(to, "arcgis-js-api/dojox/layout/resources/ResizeHandle.css")
  );
  docopy(path.join(from, "esri/css"), path.join(to, "arcgis-js-api/esri/css"));
  docopy(
    path.join(from, "esri/dijit"),
    path.join(to, "arcgis-js-api/esri/dijit"),
    null,
    copyImageTest
  );
  docopy(
    path.join(from, "esri/images"),
    path.join(to, "arcgis-js-api/esri/images")
  );
  docopy(
    path.join(from, "esri/main.js"),
    path.join(to, "arcgis-js-api/esri/main.js")
  );
  docopy(
    path.join(from, "esri/layers/VectorTileLayerImpl.js"),
    path.join(to, "arcgis-js-api/esri/layers/VectorTileLayerImpl.js")
  );
  docopy(
    path.join(from, "esri/layers/vectorTiles"),
    path.join(to, "arcgis-js-api/esri/layers/vectorTiles")
  );
  // docopy(path.join(from, "esri/layers/nls"), path.join(to, "arcgis-js-api/esri/layers/nls")); wont work in api version 3.20
  docopy(path.join(from, "jimu"), path.join(to, "jimu.js"));
  docopy(path.join(from, "themes"), path.join(to, "themes"));
  docopy(path.join(from, "widgets"), path.join(to, "widgets"));
  docopy(path.join(from, "libs"), path.join(to, "libs"));
  docopy(path.join(from, "dynamic-modules"), path.join(to, "dynamic-modules"));
  docopy(
    path.join(from, "predefined-apps/default/config.json"),
    path.join(to, "predefined-apps/default/config.json"),
    true
  );
  docopy(path.join(from, "config.json"), path.join(to, "config.json"));

  //ColorPicker needed by draw widget
  docopy(
    path.join(from, "dojox/widget/ColorPicker"),
    path.join(to, "arcgis-js-api/dojox/widget/ColorPicker")
  );
}

function docopy(s, d, check, filterFunc) {
  if (check) {
    if (fs.existsSync(s)) {
      console.log("copy", s);
      fse.copySync(s, d);
    }
  } else {
    console.log("copy", s);
    fse.copySync(s, d, { filter: filterFunc });
  }
}

function dodelete(f) {
  if (fs.existsSync(f)) {
    console.log("delete", f);
    fse.removeSync(f);
  }
}

//visit all of the folder's file and its sub-folders.
//if callback function return true, stop visit.
function visitFolderFiles(folderPath, cb) {
  var files = fs.readdirSync(folderPath);
  files.forEach(function(fileName) {
    var filePath = path.normalize(folderPath + "/" + fileName);

    if (fs.statSync(filePath).isDirectory()) {
      if (!cb(filePath, fileName, true)) {
        visitFolderFiles(filePath, cb);
      }
    } else {
      cb(filePath, fileName, false);
    }
  });
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

    [].concat(ignoreLayers, discardLayers).forEach(function(layer) {
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

//clean files in the built output
function cleanApp(appPath) {
  //clean NLS files
  removeNlsSource(path.join(appPath, "dynamic-modules/nls"));
  cleanJimu();
  fs.readdirSync(path.join(appPath, "themes")).forEach(function(themeName) {
    removeNlsSource(path.join(appPath, "themes", themeName, "nls"));
    dodelete(path.join(appPath, "themes", themeName, "nls/strings.js"));

    var themeWidgetsPath = path.join(appPath, "themes", themeName, "widgets");
    if (fs.existsSync(themeWidgetsPath)) {
      removeWidgetsNls(themeWidgetsPath);
    }
  });

  removeWidgetsNls(path.join(appPath, "widgets"));

  //clean _build-generate_ files
  cleanBuildeGeneratedFiles(appPath);

  function removeWidgetsNls(widgetsPath) {
    fs.readdirSync(widgetsPath).forEach(function(widgetName) {
      removeNlsSource(path.join(widgetsPath, widgetName, "nls"));
      removeNlsSource(path.join(widgetsPath, widgetName, "setting/nls"));
      dodelete(path.join(widgetsPath, widgetName, "Widget.html"));
      dodelete(path.join(widgetsPath, widgetName, "manifest.json"));
      dodelete(path.join(widgetsPath, widgetName, "css/style.css"));
      dodelete(path.join(widgetsPath, widgetName, "nls/strings.js"));
      dodelete(path.join(widgetsPath, widgetName, "setting/Setting.html"));
      dodelete(path.join(widgetsPath, widgetName, "setting/css/style.css"));
      dodelete(path.join(widgetsPath, widgetName, "setting/nls/strings.js"));
    });
  }

  function cleanJimu() {
    removeNlsSource(path.join(appPath, "jimu.js/nls"));

    //remove dijit
    fs.readdirSync(path.join(appPath, "jimu.js/dijit")).forEach(function(file) {
      var filePath = path.join(appPath, "jimu.js/dijit", file);
      if (file !== "SymbolsInfo") {
        dodelete(filePath);
      }
    });

    dodelete(path.join(appPath, "jimu.js/LayerInfos"));

    //remove framework files
    fs.readdirSync(path.join(appPath, "jimu.js")).forEach(function(file) {
      var filePath = path.join(appPath, "jimu.js", file);
      if (
        fs.statSync(filePath).isFile() &&
        file !== "main.js" &&
        file !== "oauth-callback.html"
      ) {
        dodelete(filePath);
      }
    });
  }
}

function removeNlsSource(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return;
  }
  fs.readdirSync(folderPath).forEach(function(file) {
    var filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      dodelete(filePath);
    }
  });
}

function cleanFilesInAppSource(appPath) {
  cleanBuildeGeneratedFiles(appPath);
  dodelete(path.join(appPath, "dynamic-modules/nls"));
  dodelete(path.join(appPath, "dynamic-modules/themes"));
  dodelete(path.join(appPath, "dynamic-modules/widgets"));
}

function cleanBuildeGeneratedFiles(path) {
  //clean _build-generate_ files
  visitFolderFiles(path, function(filePath, fileName) {
    if (fs.statSync(filePath).isFile() && /^_build-generate_/.test(fileName)) {
      dodelete(filePath);
    }
  });
}

function cleanUncompressedSource(path) {
  visitFolderFiles(path, function(filePath) {
    if (
      !fs.statSync(filePath).isDirectory() &&
      /.uncompressed.js$/.test(filePath)
    ) {
      dodelete(filePath);
    }
  });
}
