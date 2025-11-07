import { Request, Response } from "express"
import { z } from "zod"

import { AVAILABLE_HOURS, SHIFT_HOURS } from "../utils/hoursAvailable"
import { AppError } from "../utils/AppError"
import { prisma } from "../database/prisma"

export class AvailableHourController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      technicalId: z.string(),
      hours: z.array(z.string())
    })

    const { technicalId, hours } = bodySchema.parse(req.body)

    const hourExist = hours.map((h) => AVAILABLE_HOURS.includes(h))

    if(hourExist.includes(false)) {
      throw new AppError("invalid hour insert")
    }

    const userExist = await prisma.user.findFirst({ where: { id: technicalId } })

    if(!userExist) {
      throw new AppError("user not exist")
    }

    if(userExist.role !== "technical") {
      throw new AppError("user is not a technical")
    }

    if(!userExist.shift) {
      throw new AppError("technical shift not defined")
    }

    const allowedHours = SHIFT_HOURS[userExist.shift]

    const hoursApproved = hours.map((h) => allowedHours.includes(h))

    if(hoursApproved.includes(false)) {
      throw new AppError(`only your shift times are accepted: ${allowedHours}`)
    }

    await prisma.availableHour.createMany({
      data: hours.map((h) => ({
        technicalId,
        hour: h
      }))
    })

    return res.status(201).json()
  }

  async remove(req: Request, res: Response) {
    const bodySchema = z.object({
      hours: z.array(z.string())
    })

    const { hours } = bodySchema.parse(req.body)
    const technicalId = req.params.technicalId

    const userExists = await prisma.user.findFirst({where: {id: technicalId}})

    if(!userExists) {
      throw new AppError("user not found")
    }

    const existingHours = await prisma.availableHour.findMany(
      {
        where: {
          technicalId,
          hour: { in: hours }
        }
      }
    )

    if(existingHours.length === 0) {
      throw new AppError("the technical is not occuping this hour")
    }

    const hoursToDelete = existingHours.map((h) => h.hour)

    await prisma.availableHour.deleteMany(
      {
        where: {
          technicalId,
          hour: { in: hoursToDelete }
        }
      }
    )

    return res.status(200).json()
  }

  async show(req: Request, res: Response) {
    const paramsId = req.params.id

    const userExist = await prisma.user.findFirst({
      where: {
        id: paramsId,
        role: "technical"
      }
    })

    if(!userExist) {
      throw new AppError("user don't exist or is not a technical")
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
    `

    return res.json(availableHours)
  }
}