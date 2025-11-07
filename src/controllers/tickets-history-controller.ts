import { Request, Response } from "express"
import { prisma } from "../database/prisma"
import { AppError } from "../utils/AppError"

export class TicketHistoryController {
  async index(req: Request, res: Response) {
    const loggedUser = req.user

    if(!loggedUser) {
      throw new AppError("user not logged to execute this method")
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
    `
    return res.json(tickets)
  }

  async show(req: Request, res: Response) {
    const loggedUser = req.user
    const paramsId = req.params.id

    if(!loggedUser) {
      throw new AppError("user not logged to execute this method")
    }

    const ticketHistoryExists = await prisma.ticketHistory.findFirst({ where: { id: paramsId } })

    if(!ticketHistoryExists) {
      throw new AppError("ticket history don't exist")
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
    `
    return res.json(ticket)
  }
}