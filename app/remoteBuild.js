const exportUtils = require("./exportUtils");
const buildTool = require("./buildTool");

/*************************
 * buildApp
 *
 * input: path
 *      Location of WAB application to be exported
 *
 * Given a WAB application path, this function exports the
 *  application and builds it in place.  This allows users to avoid
 *  storing the entire application in source control, but still have
 *  an automated build as part of their CI process.
 *
 *************************/

exports.buildApp = function(options) {
  const tempPath = exportUtils.exportApp(options.path);
  // Get a promise from the buildTool
  options.path = tempPath;
  const buildCompletePromise = buildTool.build(options);

  // Return a promise so the caller knows when the build is complete
  return buildCompletePromise;
};
