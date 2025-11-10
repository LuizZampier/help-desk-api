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

// src/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
module.exports = __toCommonJS(app_exports);
var import_express10 = __toESM(require("express"));
var import_express_async_errors = require("express-async-errors");
var import_cors = __toESM(require("cors"));

// src/routes/index.ts
var import_express9 = require("express");

// src/routes/users-routes.ts
var import_express = require("express");

// src/controllers/user-controller.ts
var import_zod = require("zod");
var import_bcrypt = require("bcrypt");

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query"]
});

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

// src/controllers/user-controller.ts
var UserController = class {
  async create(req, res) {
    const bodySchema = import_zod.z.object({
      name: import_zod.z.string().trim().min(3, { message: "Insira um nome" }),
      email: import_zod.z.string().email(),
      password: import_zod.z.string().min(6, { message: "A sua senha deve conter no m\xEDnimo 6 caracteres" }),
      role: import_zod.z.enum(["client", "technical", "admin"]).default("client").optional()
    });
    const { name, email: email2, password, role } = bodySchema.parse(req.body);
    const userWithSameEmail = await prisma.user.findFirst({ where: { email: email2 } });
    if (userWithSameEmail) {
      throw new AppError("User with same email already exists");
    }
    let shiftDefault = null;
    if (role === "technical") {
      shiftDefault = "ONE";
    }
    const hashedPassword = await (0, import_bcrypt.hash)(password, 8);
    const user = await prisma.user.create({
      data: {
        name,
        email: email2,
        password: hashedPassword,
        role,
        shift: shiftDefault
      }
    });
    if (role === "technical") {
      await prisma.availableHour.createMany({
        data: SHIFT_HOURS["ONE"].map((h) => ({
          technicalId: user.id,
          hour: h
        }))
      });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  }
  async update(req, res) {
    const bodySchema = import_zod.z.object({
      name: import_zod.z.string().trim().min(3, "Insira um nome v\xE1lido").optional(),
      email: import_zod.z.string().email().optional(),
      password: import_zod.z.string().min(6, "A senha deve conter no m\xEDnimo 6 caracteres").optional(),
      shift: import_zod.z.enum(["ONE", "TWO", "THREE"]).optional(),
      filename: import_zod.z.string().min(20).optional()
    });
    const { name, email: email2, password, filename, shift } = bodySchema.parse(req.body);
    const userParams = req.params.id;
    const loggedUser = req.user?.id;
    const loggedUserRole = req.user?.role;
    if (userParams !== loggedUser && loggedUserRole !== "admin") {
      throw new AppError("cannot modify other user");
    }
    const userExist = await prisma.user.findFirst({ where: { id: userParams } });
    if (!userExist) {
      throw new AppError("user not exist");
    }
    if (email2) {
      const userWithSameEmail = await prisma.user.findFirst(
        {
          where: {
            email: email2,
            NOT: {
              id: loggedUser
            }
          }
        }
      );
      if (userWithSameEmail) {
        throw new AppError("user with same email already exists");
      }
    }
    let hashedPassword;
    if (password) {
      hashedPassword = await (0, import_bcrypt.hash)(password, 8);
    } else {
      hashedPassword = userExist.password;
    }
    if (shift && shift !== userExist.shift && userExist.shift && userExist.role === "technical") {
      const hoursAvailableUpdate = SHIFT_HOURS[userExist.shift];
      await prisma.availableHour.deleteMany(
        {
          where: {
            technicalId: userParams,
            hour: { in: hoursAvailableUpdate }
          }
        }
      );
      await prisma.availableHour.createMany({
        data: SHIFT_HOURS[shift].map((h) => ({
          technicalId: userParams,
          hour: h
        }))
      });
    }
    const updatedUser = await prisma.user.update({
      data: {
        name,
        email: email2,
        password: hashedPassword,
        shift,
        image: filename
      },
      where: {
        id: userParams
      }
    });
    const { password: _, ...userUpdatedWithoutPassword } = updatedUser;
    return res.status(200).json(userUpdatedWithoutPassword);
  }
  async index(req, res) {
    const bodySchema = import_zod.z.object({
      role: import_zod.z.enum(["client", "technical", "admin"])
    });
    const { role } = bodySchema.parse(req.body);
    if (!role) {
      throw new AppError("invalid role");
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      },
      where: {
        role
      }
    });
    return res.json(users);
  }
  async show(req, res) {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      where: { id }
    });
    if (!user) {
      throw new AppError("user don't exist");
    }
    return res.json(user);
  }
  async remove(req, res) {
    const paramsId = req.params.id;
    const loggedUser = req.user;
    const userExists = await prisma.user.findFirst({ where: { id: paramsId } });
    if (!userExists) {
      throw new AppError("user not exist", 404);
    }
    if (paramsId !== loggedUser?.id && loggedUser?.role !== "admin") {
      throw new AppError("only admin can remove others users");
    }
    const ticketsWithThisUser = await prisma.ticket.findMany({
      where: {
        OR: [
          { clientId: paramsId },
          { technicalId: paramsId }
        ]
      }
    });
    const hoursAvailableWithThisUser = await prisma.availableHour.findMany({
      where: {
        technicalId: paramsId
      }
    });
    if (ticketsWithThisUser) {
      const ticketsToDelete = ticketsWithThisUser.map((t) => t.id);
      await prisma.ticketService.deleteMany({
        where: {
          ticketId: { in: ticketsToDelete }
        }
      });
      await prisma.ticketHistory.deleteMany({
        where: {
          ticketId: { in: ticketsToDelete }
        }
      });
      await prisma.ticket.deleteMany({
        where: {
          id: { in: ticketsToDelete }
        }
      });
      if (hoursAvailableWithThisUser) {
        await prisma.availableHour.deleteMany({
          where: {
            technicalId: paramsId
          }
        });
      }
    }
    await prisma.user.delete({
      where: {
        id: paramsId
      }
    });
    return res.status(200).json();
  }
};

// src/middlewares/ensureAuthenticated.ts
var import_jsonwebtoken = require("jsonwebtoken");

// src/env.ts
var import_zod2 = require("zod");
var envSchema = import_zod2.z.object({
  DATABASE_URL: import_zod2.z.string().url(),
  JWT_SECRET: import_zod2.z.string(),
  PORT: import_zod2.z.coerce.number().default(3333)
});
var env = envSchema.parse(process.env);

// src/configs/auth.ts
var authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: "1d"
  }
};

// src/middlewares/ensureAuthenticated.ts
function ensureAuthenticated(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError("JWT token not found", 401);
    }
    const [, token] = authHeader.split(" ");
    const { role, sub: user_id } = (0, import_jsonwebtoken.verify)(token, authConfig.jwt.secret);
    req.user = {
      id: user_id,
      role
    };
    return next();
  } catch (error) {
    throw new AppError("Invalid JWT token", 401);
  }
}

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

// src/routes/users-routes.ts
var userRoutes = (0, import_express.Router)();
var userController = new UserController();
userRoutes.post("/", userController.create);
userRoutes.patch(
  "/:id",
  ensureAuthenticated,
  userController.update
);
userRoutes.get(
  "/",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  userController.index
);
userRoutes.get(
  "/:id",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  userController.show
);
userRoutes.delete(
  "/:id",
  ensureAuthenticated,
  userController.remove
);

// src/routes/sessions-routes.ts
var import_express2 = require("express");

// src/controllers/sessions-controller.ts
var import_zod3 = require("zod");
var import_bcrypt2 = require("bcrypt");
var import_jsonwebtoken2 = require("jsonwebtoken");
var SessionsController = class {
  async create(req, res) {
    const bodySchema = import_zod3.z.object({
      email: import_zod3.z.string().email(),
      password: import_zod3.z.string()
    });
    const { email: email2, password } = bodySchema.parse(req.body);
    const user = await prisma.user.findFirst({ where: { email: email2 } });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    const passwordMatched = await (0, import_bcrypt2.compare)(password, user.password);
    if (!passwordMatched) {
      throw new AppError("Invalid email or password", 401);
    }
    const { secret, expiresIn } = authConfig.jwt;
    const token = (0, import_jsonwebtoken2.sign)({ role: user.role ?? "client" }, secret, {
      subject: user.id,
      expiresIn
    });
    const { password: hashedPassword, ...userWithoutPassword } = user;
    return res.status(201).json({ token, user: userWithoutPassword });
  }
};

// src/routes/sessions-routes.ts
var sessionsRoutes = (0, import_express2.Router)();
var sessionsController = new SessionsController();
sessionsRoutes.post("/", sessionsController.create);

// src/routes/services-routes.ts
var import_express3 = require("express");

// src/controllers/services-controller.ts
var import_zod4 = require("zod");
var ServiceController = class {
  async create(req, res) {
    const bodySchema = import_zod4.z.object({
      title: import_zod4.z.string().trim().min(8, { message: "Insira um t\xEDtulo com o m\xEDnimo de 8 caracteres" }),
      cost: import_zod4.z.coerce.number()
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
    const bodySchema = import_zod4.z.object({
      title: import_zod4.z.string().trim().min(8, { message: "Insira um t\xEDtulo com o m\xEDnimo de 8 caracteres" }).optional(),
      cost: import_zod4.z.coerce.number().optional()
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
    const bodySchema = import_zod4.z.object({
      isActive: import_zod4.z.boolean()
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

// src/routes/services-routes.ts
var serviceRoutes = (0, import_express3.Router)();
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

// src/routes/uploads-routes.ts
var import_express4 = require("express");
var import_multer2 = __toESM(require("multer"));

// src/controllers/upload-controller.ts
var import_zod5 = require("zod");
var import_zod6 = require("zod");

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
      const fileSchema = import_zod5.z.object({
        filename: import_zod5.z.string().min(1, "file is mandatory"),
        mimetype: import_zod5.z.string().refine(
          (type) => upload_default.ACCEPTED_IMAGE_TYPES.includes(type),
          `Invalid file type. Accept only: ${upload_default.ACCEPTED_IMAGE_TYPES}`
        ),
        size: import_zod5.z.number().positive().refine(
          (size) => size <= upload_default.MAX_FILE_SIZE,
          `file exceed max size ${upload_default.MAX_SIZE}`
        )
      }).passthrough();
      const file = fileSchema.parse(req.file);
      const filename = await diskStorage.saveFile(file.filename);
      res.json({ filename });
    } catch (error) {
      if (error instanceof import_zod6.ZodError) {
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
var uploadRoutes = (0, import_express4.Router)();
var uploadController = new UploadController();
var upload = (0, import_multer2.default)(upload_default.MULTER);
uploadRoutes.post(
  "/",
  upload.single("file"),
  uploadController.create
);

// src/routes/available-hours-routes.ts
var import_express5 = require("express");

// src/controllers/available-hours-controller.ts
var import_zod7 = require("zod");
var AvailableHourController = class {
  async create(req, res) {
    const bodySchema = import_zod7.z.object({
      technicalId: import_zod7.z.string(),
      hours: import_zod7.z.array(import_zod7.z.string())
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
    const bodySchema = import_zod7.z.object({
      hours: import_zod7.z.array(import_zod7.z.string())
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

// src/routes/available-hours-routes.ts
var availableHourRoutes = (0, import_express5.Router)();
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

// src/routes/tickets-routes.ts
var import_express6 = require("express");

// src/controllers/tickets-controller.ts
var import_zod8 = require("zod");
var TicketsController = class {
  async create(req, res) {
    const bodySchema = import_zod8.z.object({
      title: import_zod8.z.string().trim().min(10, { message: "insert a valid title" }),
      service: import_zod8.z.string(),
      description: import_zod8.z.string().min(10, { message: "insert a valid description" }),
      technicalId: import_zod8.z.string()
    });
    const { title, service, description, technicalId } = bodySchema.parse(req.body);
    const technicalExists = await prisma.user.findFirst({ where: { id: technicalId } });
    if (!technicalExists || technicalExists.role !== "technical") {
      throw new AppError("technical not exist or user's not a technical");
    }
    const serviceExists = await prisma.service.findFirst({ where: { title: service } });
    if (!serviceExists) {
      throw new AppError("service don't exists");
    }
    if (serviceExists.isActive === false) {
      throw new AppError("this service is not active in the moment");
    }
    if (!req.user?.id) {
      throw new AppError("user not authenticated", 401);
    }
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        service,
        description,
        technicalId,
        clientId: req.user.id
      }
    });
    const ticketHistory = await prisma.ticketHistory.create({
      data: {
        ticketId: newTicket.id,
        changedBy: req.user.id,
        oldStatus: newTicket.status,
        newStatus: newTicket.status
      }
    });
    const ticketService = await prisma.ticketService.create({
      data: {
        ticketId: newTicket.id,
        serviceId: serviceExists.id
      }
    });
    return res.json();
  }
  async updateStatus(req, res) {
    const bodySchema = import_zod8.z.object({
      status: import_zod8.z.enum(["open", "closed", "onProgress"])
    });
    const { status } = bodySchema.parse(req.body);
    const id = req.params.id;
    const ticketExists = await prisma.ticket.findFirst({ where: { id } });
    if (!ticketExists) {
      throw new AppError("ticket not exist");
    }
    if (ticketExists.status === status) {
      throw new AppError("new status is same as the older");
    }
    const updateStatus = await prisma.ticket.update({
      data: {
        status
      },
      where: { id }
    });
    if (!req.user?.id) {
      throw new AppError("user not authenticated", 401);
    }
    const ticketHistory = await prisma.ticketHistory.create({
      data: {
        ticketId: updateStatus.id,
        changedBy: req.user.id,
        oldStatus: ticketExists.status,
        newStatus: status
      }
    });
    return res.json(updateStatus);
  }
  async index(req, res) {
    const loggedUser = req.user;
    let tickets;
    if (!loggedUser) {
      throw new AppError("invalid user");
    }
    if (loggedUser.role === "client") {
      tickets = await prisma.$queryRaw`
        SELECT
          t.id,
          t."ticketNumber",
          t.title AS "ticketTitle",
          t.description,
          t.status,
          t.client_id,
          uc.name AS "clientName",
          t.technical_id,
          ut.name AS "technicalName",
          t.created_at,
          t.updated_at,
          t.service,
          COALESCE(SUM(s.cost), 0) AS "totalCost"
        FROM tickets t
        INNER JOIN ticket_services ts 
          ON ts.ticket_id = t.id
        INNER JOIN services s 
          ON s.id = ts.service_id
        INNER JOIN users uc
          ON uc.id = t.client_id
        INNER JOIN users ut
          ON ut.id = t.technical_id
        WHERE t.client_id = ${loggedUser.id}
        GROUP BY t.id, uc.name, ut.name
        ORDER BY t.created_at DESC
      `;
    } else if (loggedUser.role === "technical") {
      tickets = await prisma.$queryRaw`
        SELECT
          t.id,
          t."ticketNumber",
          t.title AS "ticketTitle",
          t.description,
          t.status,
          t.client_id,
          uc.name AS "clientName",
          t.technical_id,
          ut.name AS "technicalName",
          t.created_at,
          t.updated_at,
          t.service,
          COALESCE(SUM(s.cost), 0) AS "totalCost"
        FROM tickets t
        INNER JOIN ticket_services ts 
          ON ts.ticket_id = t.id
        INNER JOIN services s 
          ON s.id = ts.service_id
        INNER JOIN users uc
          ON uc.id = t.client_id
        INNER JOIN users ut
          ON ut.id = t.technical_id
        WHERE t.technical_id = ${loggedUser.id}
        GROUP BY t.id, uc.name, ut.name
        ORDER BY t.created_at DESC
      `;
    } else if (loggedUser.role === "admin") {
      tickets = await prisma.$queryRaw`
        SELECT
          t.id,
          t."ticketNumber",
          t.title AS "ticketTitle",
          t.description,
          t.status,
          t.client_id,
          uc.name AS "clientName",
          t.technical_id,
          ut.name AS "technicalName",
          t.created_at,
          t.updated_at,
          t.service,
          COALESCE(SUM(s.cost), 0) AS "totalCost"
        FROM tickets t
        INNER JOIN ticket_services ts 
          ON ts.ticket_id = t.id
        INNER JOIN services s 
          ON s.id = ts.service_id
        INNER JOIN users uc
          ON uc.id = t.client_id
        INNER JOIN users ut
          ON ut.id = t.technical_id
        GROUP BY t.id, uc.name, ut.name
        ORDER BY t.created_at DESC
      `;
    }
    return res.json(tickets);
  }
  async show(req, res) {
    const id = req.params.id;
    const loggedUser = req.user;
    const ticketExists = await prisma.ticket.findFirst({ where: { id } });
    if (!ticketExists) {
      throw new AppError("ticket not exists");
    }
    let verifyTicket;
    if (loggedUser?.role === "client") {
      verifyTicket = await prisma.ticket.findFirst({ where: { clientId: loggedUser.id } });
    } else if (loggedUser?.role === "technical") {
      verifyTicket = await prisma.ticket.findFirst({ where: { technicalId: loggedUser.id } });
    }
    if (!verifyTicket && loggedUser?.role !== "admin") {
      throw new AppError("your user not attributed to this ticket");
    }
    const ticket = await prisma.$queryRaw`
      SELECT
        t.id,
        t."ticketNumber",
        t.title AS "ticketTitle",
        t.service,
        s.title AS "servicesAdded",
        SUM(s.cost) as "cost",
        t.description,
        t.status,
        t.client_id,
        uc.name AS "clientName",
        t.technical_id,
        ut.name AS "technicalName",
        t.created_at,
        t.updated_at
      FROM tickets t
      INNER JOIN ticket_services ts 
        ON ts.ticket_id = t.id
      INNER JOIN services s
        ON s.id = ts.service_id
      INNER JOIN users uc
        ON uc.id = t.client_id
      INNER JOIN users ut
        ON ut.id = t.technical_id
      WHERE t.id = ${id}
      GROUP BY t.id, s.title, uc.name, ut.name
    `;
    return res.json(ticket);
  }
};

// src/routes/tickets-routes.ts
var ticketsRoutes = (0, import_express6.Router)();
var ticketsController = new TicketsController();
ticketsRoutes.post(
  "/",
  verifyUserAuthenticated(["client"]),
  ticketsController.create
);
ticketsRoutes.patch(
  "/:id",
  verifyUserAuthenticated(["technical", "admin"]),
  ticketsController.updateStatus
);
ticketsRoutes.get(
  "/",
  ticketsController.index
);
ticketsRoutes.get(
  "/:id",
  ticketsController.show
);

// src/routes/ticket-services-routes.ts
var import_express7 = require("express");

// src/controllers/ticket-service-controller.ts
var import_zod9 = require("zod");
var TicketServicesController = class {
  async create(req, res) {
    const bodySchema = import_zod9.z.object({
      serviceId: import_zod9.z.string()
    });
    const { serviceId } = bodySchema.parse(req.body);
    const ticketId = req.params.ticketId;
    const ticketExists = await prisma.ticket.findFirst({ where: { id: ticketId } });
    if (!ticketExists) {
      throw new AppError("ticket not exist");
    }
    const serviceExists = await prisma.service.findFirst({ where: { id: serviceId } });
    if (!serviceExists) {
      throw new AppError("service not exist");
    }
    const ticketAlreadyHaveThisService = await prisma.ticketService.findFirst({
      where: {
        ticketId,
        serviceId
      }
    });
    if (ticketAlreadyHaveThisService) {
      throw new AppError("ticket already have this service added");
    }
    const createNewTicketService = await prisma.ticketService.create(
      {
        data: {
          ticketId,
          serviceId
        }
      }
    );
    return res.status(201).json(createNewTicketService);
  }
  async remove(req, res) {
    const bodySchema = import_zod9.z.object({
      serviceId: import_zod9.z.string()
    });
    const { serviceId } = bodySchema.parse(req.body);
    const ticketId = req.params.ticketId;
    const ticketExists = await prisma.ticket.findFirst({ where: { id: ticketId } });
    if (!ticketExists) {
      throw new AppError("ticket not exist");
    }
    const serviceExistsOnCurrentTicket = await prisma.ticketService.findFirst({
      where: {
        ticketId,
        serviceId
      }
    });
    if (!serviceExistsOnCurrentTicket) {
      throw new AppError("this service not exist on the current ticket");
    }
    const removeTicketService = await prisma.ticketService.delete({
      where: {
        id: serviceExistsOnCurrentTicket.id
      }
    });
    return res.status(200).json();
  }
};

// src/routes/ticket-services-routes.ts
var ticketServiceRoutes = (0, import_express7.Router)();
var ticketServiceController = new TicketServicesController();
ticketServiceRoutes.post(
  "/:ticketId",
  verifyUserAuthenticated(["technical"]),
  ticketServiceController.create
);
ticketServiceRoutes.delete(
  "/:ticketId",
  verifyUserAuthenticated(["technical"]),
  ticketServiceController.remove
);

// src/routes/ticket-history-routes.ts
var import_express8 = require("express");

// src/controllers/tickets-history-controller.ts
var TicketHistoryController = class {
  async index(req, res) {
    const loggedUser = req.user;
    if (!loggedUser) {
      throw new AppError("user not logged to execute this method");
    }
    const tickets = await prisma.$queryRaw`
      SELECT
        t.id,
        th.id AS "historyId",
        t."ticketNumber",
        t.title AS "ticketTitle",
        t.description,
        th."newStatus" AS "status",
        t.client_id,
        uc.name AS "clientName",
        t.technical_id,
        ut.name AS "technicalName",
        t.created_at,
        t.updated_at,
        t.service,
        COALESCE(SUM(s.cost), 0) AS "totalCost"
      FROM tickets t
      INNER JOIN ticket_history th
        ON th.ticket_id = t.id
      INNER JOIN ticket_services ts 
        ON ts.ticket_id = t.id
      INNER JOIN services s 
        ON s.id = ts.service_id
      INNER JOIN users uc
        ON uc.id = t.client_id
      INNER JOIN users ut
        ON ut.id = t.technical_id
      WHERE t.client_id = ${loggedUser?.id}
      GROUP BY t.id, uc.name, ut.name, th."newStatus", th.id
      ORDER BY t.created_at DESC
    `;
    return res.json(tickets);
  }
  async show(req, res) {
    const loggedUser = req.user;
    const paramsId = req.params.id;
    if (!loggedUser) {
      throw new AppError("user not logged to execute this method");
    }
    const ticketHistoryExists = await prisma.ticketHistory.findFirst({ where: { id: paramsId } });
    if (!ticketHistoryExists) {
      throw new AppError("ticket history don't exist");
    }
    const ticket = await prisma.$queryRaw`
      SELECT
        t.id,
        th.id AS "historyId",
        t."ticketNumber",
        t.title AS "ticketTitle",
        t.service,
        s.title AS "servicesAdded",
        SUM(s.cost) as "cost",
        t.description,
        th."newStatus" AS "Status",
        t.client_id,
        uc.name AS "clientName",
        t.technical_id,
        ut.name AS "technicalName",
        t.created_at,
        t.updated_at
      FROM tickets t
      INNER JOIN ticket_history th
        ON th.ticket_id = t.id
      INNER JOIN ticket_services ts 
        ON ts.ticket_id = t.id
      INNER JOIN services s
        ON s.id = ts.service_id
      INNER JOIN users uc
        ON uc.id = t.client_id
      INNER JOIN users ut
        ON ut.id = t.technical_id
      WHERE th.id = ${paramsId}
      GROUP BY t.id, s.title, uc.name, ut.name, th.id
    `;
    return res.json(ticket);
  }
};

// src/routes/ticket-history-routes.ts
var ticketHistoryRoutes = (0, import_express8.Router)();
var ticketHistoryController = new TicketHistoryController();
ticketHistoryRoutes.get(
  "/",
  verifyUserAuthenticated(["client"]),
  ticketHistoryController.index
);
ticketHistoryRoutes.get(
  "/:id",
  verifyUserAuthenticated(["client"]),
  ticketHistoryController.show
);

// src/routes/index.ts
var routes = (0, import_express9.Router)();
routes.use("/users", userRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use(ensureAuthenticated);
routes.use("/services", serviceRoutes);
routes.use("/uploads", uploadRoutes);
routes.use("/available-hour", availableHourRoutes);
routes.use("/tickets", ticketsRoutes);
routes.use("/ticket-services", ticketServiceRoutes);
routes.use("/ticket-history", ticketHistoryRoutes);

// src/middlewares/errorHandling.ts
var import_zod10 = require("zod");
function errorHandling(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  if (error instanceof import_zod10.ZodError) {
    return res.status(400).json({
      message: "validation error",
      issues: error.format()
    });
  }
  return res.status(500).json({ message: error.message });
}

// src/app.ts
var app = (0, import_express10.default)();
app.use((0, import_cors.default)());
app.use(import_express10.default.json());
app.use("/uploads", import_express10.default.static(upload_default.UPLOADS_FOLDER));
app.use(routes);
app.use(errorHandling);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
