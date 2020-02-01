const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const path = require("path");

const encoding = "utf-8";

exports.read = read;
exports.write = write;
exports.writeJson = writeJson;
exports.readJson = readJson;
exports.exists = exists;
exports.copyFilesFromTo = copyFilesFromTo;
exports.tryCopy = tryCopy;
exports.copy = copy;
exports.createZipFromTo = createZipFromTo;
exports.createOrCleanDirectory = createOrCleanDirectory;
exports.remove = remove;
exports.isDirectory = isDirectory;
exports.isFile = isFile;
exports.readDirectory = readDirectory;
exports.copyIgnoring = copyIgnoring;
exports.visitFolderFiles = visitFolderFiles;

function read(pathToFile) {
  return fs.readFileSync(pathToFile, encoding);
}

function readDirectory(pathToDir) {
  return fs.readdirSync(pathToDir);
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
  filesAndDirectories.forEach(name => {
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
    copy(from, to);
  } catch (error) {
    console.log(`Error copying ${from} to ${to}`);
  }
}

function copy(from, to) {
  if (exists(from)) {
    console.log("copy", from);
    fs.copySync(from, to);
  }
}

function copyIgnoring(from, to, ignoreFilesFolders) {
  if (exists(from)) {
    console.log("copy", from);
    fs.copySync(from, to, {
      filter: function(from, to) {
        let fromFileName = path.basename(from);
        let shouldCopy = !ignoreFilesFolders.includes(fromFileName);
        return shouldCopy;
      }
    });
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
  if (exists(path)) {
    // console.log("delete", path);
    fs.removeSync(path);
  }
}

function isDirectory(path) {
  return fs.statSync(path).isDirectory();
}

function isFile(path) {
  return fs.statSync(path).isFile();
}

//visit all of the folder's file and its sub-folders.
//if callback function return true, stop visit.
function visitFolderFiles(folderPath, callback) {
  let allPaths = createPaths(folderPath);
  while (allPaths.length > 0) {
    let currentPath = allPaths.pop();
    if (isDirectory(currentPath)) {
      let currentFileName = "";
      let stop = callback(currentPath, currentFileName);
      if (!stop) {
        let moreFilePaths = createPaths(currentPath);
        allPaths = allPaths.concat(moreFilePaths);
      }
    } else {
      let currentFileName = path.basename(currentPath);
      callback(currentPath, currentFileName);
    }
  }
}

function createPaths(folderPath) {
  let fileNames = readDirectory(folderPath);
  return fileNames.map(filename => path.join(folderPath, filename));
}
