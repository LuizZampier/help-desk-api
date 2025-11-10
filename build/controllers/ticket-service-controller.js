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

// src/controllers/ticket-service-controller.ts
var ticket_service_controller_exports = {};
__export(ticket_service_controller_exports, {
  TicketServicesController: () => TicketServicesController
});
module.exports = __toCommonJS(ticket_service_controller_exports);
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

// src/controllers/ticket-service-controller.ts
var TicketServicesController = class {
  async create(req, res) {
    const bodySchema = import_zod.z.object({
      serviceId: import_zod.z.string()
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
    const bodySchema = import_zod.z.object({
      serviceId: import_zod.z.string()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TicketServicesController
});
