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
}