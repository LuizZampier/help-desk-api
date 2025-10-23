import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../database/prisma"
import { AppError } from "../utils/AppError"

export class ServiceController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      title: z.string().trim().min(8, {message: "Insira um título com o mínimo de 8 caracteres"}),
      cost: z.coerce.number()
    })

    const { title, cost } = bodySchema.parse(req.body)

    const titleAlreadyExists = await prisma.service.findFirst({where: {title}})

    if(titleAlreadyExists) {
      throw new AppError("this title already exists")
    }

    if(cost <= 0) {
      throw new AppError("the cost must be greater than 0")
    }

    const service = await prisma.service.create({
      data: {
        title,
        cost
      }
    })

    return res.status(201).json(service)
  }

  async update(req: Request, res: Response) {
    const bodySchema = z.object({
      title: z.string().trim().min(8, {message: "Insira um título com o mínimo de 8 caracteres"}).optional(),
      cost: z.coerce.number().optional()
    })

    const { title, cost } = bodySchema.parse(req.body)

    const { id } = req.params

    const serviceExists = await prisma.service.findFirst({ where: {id} })

    if(!serviceExists) {
      throw new AppError("this service doesn't exists")
    }

    const updatedService = await prisma.service.update({
      data: {
        title,
        cost
      },
      where: {id}
    })

    return res.status(200).json(updatedService)
  }

  async updateStatus(req: Request, res: Response) {
    const bodySchema = z.object({
      isActive: z.boolean()
    })

    const { isActive } = bodySchema.parse(req.body)

    const { id } = req.params

    const serviceExists = await prisma.service.findFirst({ where: {id} })

    if(!serviceExists) {
      throw new AppError("this service doesn't exists")
    }

    if(serviceExists.isActive === isActive) {
      throw new AppError("attributed value is equal than the original")
    }

    const updatedStatus = await prisma.service.update({
      data: {
        isActive
      },
      where: {id}
    })

    return res.status(200).json(updatedStatus)
  }

  async index(req: Request, res: Response) {
    const services = await prisma.service.findMany({
      select: {
        id: true,
        title: true,
        cost: true,
        isActive: true
      }
    })

    return res.json(services)
  }

  async show(req: Request, res: Response) {
    const { id } = req.params

    const service = await prisma.service.findFirst({
      select: {
        id: true,
        title: true,
        cost: true,
        isActive: true
      },
      where: {id}
    })

    return res.json(service)
  }
}