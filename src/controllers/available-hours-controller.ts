import { Request, Response } from "express"
import { z } from "zod"

import { AVAILABLE_HOURS } from "../utils/hoursAvailable"
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


    const availableHour = await prisma.availableHour.createMany({
      data: hours.map((h) => ({
        technicalId,
        hour: h
      }))
    })

    return res.status(201).json(availableHour)
  }
}