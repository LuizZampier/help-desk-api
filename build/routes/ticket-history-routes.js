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

// src/routes/ticket-history-routes.ts
var ticket_history_routes_exports = {};
__export(ticket_history_routes_exports, {
  ticketHistoryRoutes: () => ticketHistoryRoutes
});
module.exports = __toCommonJS(ticket_history_routes_exports);
var import_express = require("express");

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

// src/routes/ticket-history-routes.ts
var ticketHistoryRoutes = (0, import_express.Router)();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ticketHistoryRoutes
});
