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

// src/controllers/user-controller.ts
var user_controller_exports = {};
__export(user_controller_exports, {
  UserController: () => UserController
});
module.exports = __toCommonJS(user_controller_exports);
var import_zod = require("zod");
var import_bcrypt = require("bcrypt");

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query"]
});

// src/utils/hoursAvailable.ts
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
    const { name, email, password, role } = bodySchema.parse(req.body);
    const userWithSameEmail = await prisma.user.findFirst({ where: { email } });
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
        email,
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
    const { name, email, password, filename, shift } = bodySchema.parse(req.body);
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
    if (email) {
      const userWithSameEmail = await prisma.user.findFirst(
        {
          where: {
            email,
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
        email,
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserController
});
