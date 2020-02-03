[![dependencies](https://david-dm.org/gbochenek/esri-wab-build.svg)](https://david-dm.org/cancastilho/esri-wab-build) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# esri-wab-build
Package used to build ESRI Web App Builder Apps for production.

Verified and designed for 2D Apps built using Web App Builder for Developers 2.11.

This task runs a full dojo build on any web app builder application, which will greatly improve performance.

Project derived from [esri/esri-wab-build](https://github.com/Esri/esri-wab-build).

## Requirements:

* Bower
* Nodejs (validated with 6.9.4)
* Java 7 or greater
* Git


## Install and Run Globally as CLI

````sh
npm install -g bower
npm install -g cancastilho/esri-wab-build#v1.2.0
````

````
Usage: esri-wab-build [options]

Options:
  -V, --version                    output the version number
  -p, --path <path>                Path to web appbuilder app source to be
                                   built
  -a, --with-api-version <number>  Create build with custom arcgis js api
                                   version. Default is version inside env.js
                                   file.
  -z, --zip-app                    Zip app final folder after building it
  -B, --skip-bower-install         Prevent (re)installing bower dependencies
  -L, --with-locales <locales>     Set custom localesList in the generated
                                   app.profile.js before dojo build.
  -h, --help                       output usage information
````

Sample usage:

````sh
# 1. Copy app to current directory dist folder and build it.
esri-wab-build -p "C:/arcgis-web-appbuilder-2.7/WebAppBuilderForArcGIS/server/apps/3"

# 2. Change to wab app folder and run esri-wab-build. 
cd C:/arcgis-web-appbuilder-2.7/WebAppBuilderForArcGIS/server/apps/3
esri-wab-build

# 3. Zip the built app.
esri-wab-build -z

# 3. Run build with the previous downloaded bower dependencies.
# Use this if you run build more than one time and don't want to
# download bower dependencies every time.
esri-wab-build -B

# 4. Set custom locales in app.profile.js before run dojo build.
esri-wab-build -L "pt-br,en-us"

# 5. Use diferent arcgis js api version to build the project.
esri-wab-build -a 3.31

# 6. Combined options
esri-wab-build -L "pt-br,en-us" -a 3.31 --zip-app -p "C:/arcgis-web-appbuilder-2.7/WebAppBuilderForArcGIS/server/apps/3"
````


## Install as project dependency:

````sh
# Change to your wab app directory, example:
cd "C:\arcgis-web-appbuilder-2.7\WebAppBuilderForArcGIS\server\apps\3"
# Run npm init to create package.json
npm init

# Install bower
npm install -g bower

# Install this package as dependency
npm install cancastilho/esri-wab-build#v1.2.0 --save-dev

# Open package.json and configure the build property:
{
  ...
  "scripts": {
    "build": "esri-wab-build"
  }
  ...
}

# Build your app
npm run build
````

The build output will be located in C:\arcgis-web-appbuilder-2.7\WebAppBuilderForArcGIS\server\apps\3\buildOut\app.

## Licensing

A copy of the license is available in the repository's [license.txt](license.txt) file.
