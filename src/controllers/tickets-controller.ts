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
    return res.json()
  }
}