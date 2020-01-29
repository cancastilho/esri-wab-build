const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const path = require("path");
const utilscripts = require("./utilscripts");

const encoding = "utf-8";

exports.read = read;
exports.write = write;
exports.writeJson = writeJson;
exports.readJson = readJson;
exports.exists = exists;
exports.copyFilesFromTo = copyFilesFromTo;
exports.tryCopy = tryCopy;
exports.createZipFromTo = createZipFromTo;
exports.createOrCleanDirectory = createOrCleanDirectory;
exports.remove = remove;
exports.isDirectory = isDirectory;
exports.isFile = isFile;

function read(pathToFile) {
  return fs.readFileSync(pathToFile, encoding);
}

function write(content, pathToFile) {
  return fs.writeFileSync(pathToFile, content, encoding);
}

function writeJson(jsonObject, pathToJsonFile) {
  return fs.writeJsonSync(pathToJsonFile, jsonObject, encoding);
}

function readJson(pathToJsonFile) {
  return fs.readJsonSync(pathToJsonFile, encoding);
}

function exists(pathToFile) {
  return fs.existsSync(pathToFile);
}

function copyFilesFromTo(filesAndDirectories, fromPath, toPath) {
  console.log(`Copying many files from: ${fromPath}`);
  console.log(`To path:  ${toPath}`);
  console.log(filesAndDirectories.join("\n"));
  filesAndDirectories.forEach(function(name) {
    if (Array.isArray(name)) {
      const from = path.join(fromPath, name[0]);
      const to = path.join(toPath, name[1]);
      tryCopy(from, to);
    } else {
      const from = path.join(fromPath, name);
      const to = path.join(toPath, name);
      tryCopy(from, to);
    }
  });
}

function tryCopy(from, to) {
  try {
    //TODO: Extract method, thant inline method
    utilscripts.docopy(from, to);
  } catch (error) {
    console.log(error);
  }
}

function createZipFromTo(fromPath, toPath) {
  try {
    const zip = new AdmZip();
    console.log("Creating zipfile at " + toPath);
    zip.addLocalFolder(fromPath);
    zip.writeZip(toPath);
  } catch (err) {
    console.log("Erro when zipping file. ", err);
    reject(err);
  }
}

function createOrCleanDirectory(pathToDirectory) {
  remove(pathToDirectory);
  fs.mkdirSync(pathToDirectory);
}

function remove(path) {
  //TODO: Inline method
  utilscripts.dodelete(path);
}

function isDirectory(path) {
  return fs.statSync(path).isDirectory();
}

function isFile(path) {
  return fs.statSync(path).isFile();
}
