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

// src/routes/uploads-routes.ts
var uploads_routes_exports = {};
__export(uploads_routes_exports, {
  uploadRoutes: () => uploadRoutes
});
module.exports = __toCommonJS(uploads_routes_exports);
var import_express = require("express");
var import_multer2 = __toESM(require("multer"));

// src/controllers/upload-controller.ts
var import_zod = require("zod");
var import_zod2 = require("zod");

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

// src/providers/disk-storage.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));

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

// src/controllers/upload-controller.ts
var UploadController = class {
  async create(req, res) {
    const diskStorage = new DiskStorage();
    try {
      const fileSchema = import_zod.z.object({
        filename: import_zod.z.string().min(1, "file is mandatory"),
        mimetype: import_zod.z.string().refine(
          (type) => upload_default.ACCEPTED_IMAGE_TYPES.includes(type),
          `Invalid file type. Accept only: ${upload_default.ACCEPTED_IMAGE_TYPES}`
        ),
        size: import_zod.z.number().positive().refine(
          (size) => size <= upload_default.MAX_FILE_SIZE,
          `file exceed max size ${upload_default.MAX_SIZE}`
        )
      }).passthrough();
      const file = fileSchema.parse(req.file);
      const filename = await diskStorage.saveFile(file.filename);
      res.json({ filename });
    } catch (error) {
      if (error instanceof import_zod2.ZodError) {
        if (req.file) {
          await diskStorage.deleteFile(req.file.filename, "tmp");
        }
        throw new AppError(error.issues[0].message);
      }
      throw error;
    }
  }
};

// src/routes/uploads-routes.ts
var uploadRoutes = (0, import_express.Router)();
var uploadController = new UploadController();
var upload = (0, import_multer2.default)(upload_default.MULTER);
uploadRoutes.post(
  "/",
  upload.single("file"),
  uploadController.create
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  uploadRoutes
});
