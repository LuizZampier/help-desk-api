import { Request, Response } from "express"
import { email, z } from "zod"
import { prisma } from "../database/prisma"
import { compare } from "bcrypt"
import { sign } from "jsonwebtoken"

import { AppError } from "../utils/AppError"
import { authConfig } from "../configs/auth"

export class SessionsController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string()
    })

    const { email, password } = bodySchema.parse(req.body)

    const user = await prisma.user.findFirst({where: {email}})

    if(!user) {
      throw new AppError("Invalid email or password", 401)
    }

    const passwordMatched = await compare(password, user.password)

    if(!passwordMatched) {
      throw new AppError("Invalid email or password", 401)
    }

    const { secret, expiresIn } = authConfig.jwt

    const token = sign({role: user.role ?? "client"}, secret, {
      subject: user.id,
      expiresIn
    })

    const { password: hashedPassword, ...userWithoutPassword } = user

    return res.status(201).json({ token, user: userWithoutPassword })
  }
}