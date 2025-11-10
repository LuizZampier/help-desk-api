"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/providers/disk-storage.ts
var disk_storage_exports = {};
__export(disk_storage_exports, {
  DiskStorage: () => DiskStorage
});
module.exports = __toCommonJS(disk_storage_exports);
var import_node_fs = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));

// src/configs/upload.ts
var import_multer = __toESM(require("multer"));
var import_node_path = __toESM(require("path"));
var import_node_crypto = __toESM(require("crypto"));
var TMP_FOLDER = import_node_path.default.resolve(__dirname, "..", "..", "tmp");
var UPLOADS_FOLDER = import_node_path.default.resolve(TMP_FOLDER, "uploads");
var MAX_SIZE = 3;
var MAX_FILE_SIZE = 1024 * 1024 * MAX_SIZE;
var ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
var MULTER = {
  storage: import_multer.default.diskStorage({
    destination: TMP_FOLDER,
    filename(request, file, callback) {
      const fileHash = import_node_crypto.default.randomBytes(10).toString("hex");
      const fileName = `${fileHash}-${file.originalname}`;
      return callback(null, fileName);
    }
  })
};
var upload_default = {
  TMP_FOLDER,
  UPLOADS_FOLDER,
  MAX_FILE_SIZE,
  MAX_SIZE,
  ACCEPTED_IMAGE_TYPES,
  MULTER
};

// src/utils/AppError.ts
var AppError = class {
  message;
  statusCode;
  constructor(message, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
};

// src/providers/disk-storage.ts
var DiskStorage = class {
  async saveFile(file) {
    const tmpPath = import_node_path2.default.resolve(upload_default.TMP_FOLDER, file);
    const destPath = import_node_path2.default.resolve(upload_default.UPLOADS_FOLDER, file);
    try {
      await import_node_fs.default.promises.access(tmpPath);
    } catch (error) {
      throw new AppError(`file not found: ${tmpPath}`);
    }
    await import_node_fs.default.promises.mkdir(upload_default.UPLOADS_FOLDER, { recursive: true });
    await import_node_fs.default.promises.rename(tmpPath, destPath);
    return file;
  }
  async deleteFile(file, type) {
    const pathFile = type === "tmp" ? upload_default.TMP_FOLDER : upload_default.UPLOADS_FOLDER;
    const filePath = import_node_path2.default.resolve(pathFile, file);
    try {
      await import_node_fs.default.promises.stat(filePath);
    } catch (error) {
      return;
    }
    await import_node_fs.default.promises.unlink(filePath);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DiskStorage
});
