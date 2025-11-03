import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../database/prisma"
import { AppError } from "../utils/AppError"

export class TicketServicesController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      serviceId: z.string()
    })

    const { serviceId } = bodySchema.parse(req.body)
    const ticketId = req.params.ticketId

    const ticketExists = await prisma.ticket.findFirst({ where: { id: ticketId } })

    if(!ticketExists) {
      throw new AppError("ticket not exist")
    }

    const serviceExists = await prisma.service.findFirst({ where: { id: serviceId } })

    if(!serviceExists) {
      throw new AppError("service not exist")
    }

    const ticketAlreadyHaveThisService = await prisma.ticketService.findFirst({ 
      where:
        { 
          ticketId,
          serviceId
        } 
    })

    if(ticketAlreadyHaveThisService) {
      throw new AppError("ticket already have this service added")
    }

    const createNewTicketService = await prisma.ticketService.create(
      {
        data: {
          ticketId,
          serviceId
        }
      }
    )

    return res.status(201).json(createNewTicketService)
  }

  async remove(req: Request, res: Response) {
    const bodySchema = z.object({
      serviceId: z.string()
    })

    const { serviceId } = bodySchema.parse(req.body)
    const ticketId = req.params.ticketId

    const ticketExists = await prisma.ticket.findFirst({ where: { id: ticketId } })

    if(!ticketExists) {
      throw new AppError("ticket not exist")
    }

    const serviceExistsOnCurrentTicket = await prisma.ticketService.findFirst({
      where: {
        ticketId,
        serviceId
      }
    })

    if(!serviceExistsOnCurrentTicket) {
      throw new AppError("this service not exist on the current ticket")
    }

    const removeTicketService = await prisma.ticketService.delete({
      where: {
        id: serviceExistsOnCurrentTicket.id
      }
    })

    return res.status(200).json()
  }
}