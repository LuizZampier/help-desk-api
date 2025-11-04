import { Request, Response } from "express"
import { z } from "zod"

import { prisma } from "../database/prisma"
import { AppError } from "../utils/AppError"

export class TicketsController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      title: z.string().trim().min(10, {message: "insert a valid title"}),
      service: z.string(),
      description: z.string().min(10, {message: "insert a valid description"}),
      technicalId: z.string()
    })

    const { title, service, description, technicalId } = bodySchema.parse(req.body)

    const technicalExists = await prisma.user.findFirst({ where: { id: technicalId } })

    if(!technicalExists || technicalExists.role !== "technical") {
      throw new AppError("technical not exist or user's not a technical")
    }

    const serviceExists = await prisma.service.findFirst({ where: { title: service }})

    if(!serviceExists) {
      throw new AppError("service don't exists")
    }

    if(!req.user?.id) {
      throw new AppError("user not authenticated", 401)
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        service,
        description,
        technicalId,
        clientId: req.user.id
      }
    })

    const ticketHistory = await prisma.ticketHistory.create({
      data: {
        ticketId: newTicket.id,
        changedBy: req.user.id,
        oldStatus: newTicket.status,
        newStatus: newTicket.status
      }
    })

    const ticketService = await prisma.ticketService.create({
      data: {
        ticketId: newTicket.id,
        serviceId: serviceExists.id
      }
    })

    return res.json()
  }

  async updateStatus(req: Request, res: Response) {
    const bodySchema = z.object({
      status: z.enum(["open", "closed", "onProgress"])
    })

    const { status } = bodySchema.parse(req.body)

    const id = req.params.id

    const ticketExists = await prisma.ticket.findFirst({ where: { id } })


    if(!ticketExists) {
      throw new AppError("ticket not exist")
    }

    if(ticketExists.status === status) {
      throw new AppError("new status is same as the older")
    }

    const updateStatus = await prisma.ticket.update({
      data: {
        status: status
      },
      where: { id }
    })

    if(!req.user?.id) {
      throw new AppError("user not authenticated", 401)
    }

    const ticketHistory = await prisma.ticketHistory.create({
      data: {
        ticketId: updateStatus.id,
        changedBy: req.user.id,
        oldStatus: ticketExists.status,
        newStatus: status
      }
    })

    return res.json(updateStatus)
  }

  async index(req: Request, res: Response) {
    const loggedUser = req.user

    let tickets

    if(!loggedUser) {
      throw new AppError("invalid user")
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
      `
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
      `
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
      `
    }

    return res.json(tickets)
  }

  async show(req: Request, res: Response) {
    const id = req.params.id
    const loggedUser = req.user

    const ticketExists = await prisma.ticket.findFirst({ where: {id} })

    if(!ticketExists) {
      throw new AppError("ticket not exists")
    }

    let verifyTicket

    if(loggedUser?.role === "client") {
      verifyTicket = await prisma.ticket.findFirst({ where: {clientId: loggedUser.id} })
    } else if (loggedUser?.role === "technical") {
      verifyTicket = await prisma.ticket.findFirst({ where: {technicalId: loggedUser.id} })
    }

    if(!verifyTicket && loggedUser?.role !== "admin") {
      throw new AppError("your user not attributed to this ticket")
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
    `

    return res.json(ticket)
  }
}