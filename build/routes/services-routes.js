"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/services-routes.ts
var services_routes_exports = {};
__export(services_routes_exports, {
  serviceRoutes: () => serviceRoutes
});
module.exports = __toCommonJS(services_routes_exports);
var import_express = require("express");

// src/controllers/services-controller.ts
var import_zod = require("zod");

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query"]
});

// src/utils/AppError.ts
var AppError = class {
  message;
  statusCode;
  constructor(message, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
};

// src/controllers/services-controller.ts
var ServiceController = class {
  async create(req, res) {
    const bodySchema = import_zod.z.object({
      title: import_zod.z.string().trim().min(8, { message: "Insira um t\xEDtulo com o m\xEDnimo de 8 caracteres" }),
      cost: import_zod.z.coerce.number()
    });
    const { title, cost } = bodySchema.parse(req.body);
    const titleAlreadyExists = await prisma.service.findFirst({ where: { title } });
    if (titleAlreadyExists) {
      throw new AppError("this title already exists");
    }
    if (cost <= 0) {
      throw new AppError("the cost must be greater than 0");
    }
    const service = await prisma.service.create({
      data: {
        title,
        cost
      }
    });
    return res.status(201).json(service);
  }
  async update(req, res) {
    const bodySchema = import_zod.z.object({
      title: import_zod.z.string().trim().min(8, { message: "Insira um t\xEDtulo com o m\xEDnimo de 8 caracteres" }).optional(),
      cost: import_zod.z.coerce.number().optional()
    });
    const { title, cost } = bodySchema.parse(req.body);
    const { id } = req.params;
    const serviceExists = await prisma.service.findFirst({ where: { id } });
    if (!serviceExists) {
      throw new AppError("this service doesn't exists");
    }
    const updatedService = await prisma.service.update({
      data: {
        title,
        cost
      },
      where: { id }
    });
    return res.status(200).json(updatedService);
  }
  async updateStatus(req, res) {
    const bodySchema = import_zod.z.object({
      isActive: import_zod.z.boolean()
    });
    const { isActive } = bodySchema.parse(req.body);
    const { id } = req.params;
    const serviceExists = await prisma.service.findFirst({ where: { id } });
    if (!serviceExists) {
      throw new AppError("this service doesn't exists");
    }
    if (serviceExists.isActive === isActive) {
      throw new AppError("attributed value is equal than the original");
    }
    const updatedStatus = await prisma.service.update({
      data: {
        isActive
      },
      where: { id }
    });
    return res.status(200).json(updatedStatus);
  }
  async index(req, res) {
    const services = await prisma.service.findMany({
      select: {
        id: true,
        title: true,
        cost: true,
        isActive: true
      }
    });
    return res.json(services);
  }
  async show(req, res) {
    const { id } = req.params;
    const service = await prisma.service.findFirst({
      select: {
        id: true,
        title: true,
        cost: true,
        isActive: true
      },
      where: { id }
    });
    return res.json(service);
  }
};

// src/middlewares/verifyUserAuthorization.ts
function verifyUserAuthenticated(role) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Unathorized", 401);
    }
    if (!role.includes(req.user.role)) {
      throw new AppError("Unathorized", 401);
    }
    return next();
  };
}

// src/routes/services-routes.ts
var serviceRoutes = (0, import_express.Router)();
var serviceController = new ServiceController();
serviceRoutes.post(
  "/",
  verifyUserAuthenticated(["admin"]),
  serviceController.create
);
serviceRoutes.patch(
  "/:id",
  verifyUserAuthenticated(["admin"]),
  serviceController.update
);
serviceRoutes.patch(
  "/:id/status",
  verifyUserAuthenticated(["admin"]),
  serviceController.updateStatus
);
serviceRoutes.get(
  "/",
  verifyUserAuthenticated(["admin", "technical"]),
  serviceController.index
);
serviceRoutes.get(
  "/:id",
  verifyUserAuthenticated(["admin"]),
  serviceController.show
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  serviceRoutes
});
