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

// src/routes/available-hours-routes.ts
var available_hours_routes_exports = {};
__export(available_hours_routes_exports, {
  availableHourRoutes: () => availableHourRoutes
});
module.exports = __toCommonJS(available_hours_routes_exports);
var import_express = require("express");

// src/controllers/available-hours-controller.ts
var import_zod = require("zod");

// src/utils/hoursAvailable.ts
var AVAILABLE_HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00"
];
var SHIFT_HOURS = {
  "ONE": [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
  ],
  "TWO": [
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00"
  ],
  "THREE": [
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00"
  ]
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

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query"]
});

// src/controllers/available-hours-controller.ts
var AvailableHourController = class {
  async create(req, res) {
    const bodySchema = import_zod.z.object({
      technicalId: import_zod.z.string(),
      hours: import_zod.z.array(import_zod.z.string())
    });
    const { technicalId, hours } = bodySchema.parse(req.body);
    const hourExist = hours.map((h) => AVAILABLE_HOURS.includes(h));
    if (hourExist.includes(false)) {
      throw new AppError("invalid hour insert");
    }
    const userExist = await prisma.user.findFirst({ where: { id: technicalId } });
    if (!userExist) {
      throw new AppError("user not exist");
    }
    if (userExist.role !== "technical") {
      throw new AppError("user is not a technical");
    }
    if (!userExist.shift) {
      throw new AppError("technical shift not defined");
    }
    const allowedHours = SHIFT_HOURS[userExist.shift];
    const hoursApproved = hours.map((h) => allowedHours.includes(h));
    if (hoursApproved.includes(false)) {
      throw new AppError(`only your shift times are accepted: ${allowedHours}`);
    }
    await prisma.availableHour.createMany({
      data: hours.map((h) => ({
        technicalId,
        hour: h
      }))
    });
    return res.status(201).json();
  }
  async remove(req, res) {
    const bodySchema = import_zod.z.object({
      hours: import_zod.z.array(import_zod.z.string())
    });
    const { hours } = bodySchema.parse(req.body);
    const technicalId = req.params.technicalId;
    const userExists = await prisma.user.findFirst({ where: { id: technicalId } });
    if (!userExists) {
      throw new AppError("user not found");
    }
    const existingHours = await prisma.availableHour.findMany(
      {
        where: {
          technicalId,
          hour: { in: hours }
        }
      }
    );
    if (existingHours.length === 0) {
      throw new AppError("the technical is not occuping this hour");
    }
    const hoursToDelete = existingHours.map((h) => h.hour);
    await prisma.availableHour.deleteMany(
      {
        where: {
          technicalId,
          hour: { in: hoursToDelete }
        }
      }
    );
    return res.status(200).json();
  }
  async show(req, res) {
    const paramsId = req.params.id;
    const userExist = await prisma.user.findFirst({
      where: {
        id: paramsId,
        role: "technical"
      }
    });
    if (!userExist) {
      throw new AppError("user don't exist or is not a technical");
    }
    const availableHours = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.shift,
        ah.hour
      FROM available_hours ah
      INNER JOIN users u
        ON ah.technical_id = u.id
      WHERE u.id = ${paramsId}
    `;
    return res.json(availableHours);
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

// src/routes/available-hours-routes.ts
var availableHourRoutes = (0, import_express.Router)();
var availableHourController = new AvailableHourController();
availableHourRoutes.post(
  "/",
  verifyUserAuthenticated(["admin", "technical"]),
  availableHourController.create
);
availableHourRoutes.delete(
  "/:technicalId",
  verifyUserAuthenticated(["admin", "technical"]),
  availableHourController.remove
);
availableHourRoutes.get(
  "/:id",
  verifyUserAuthenticated(["technical", "admin"]),
  availableHourController.show
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  availableHourRoutes
});
