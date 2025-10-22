import { Request, Response } from "express"
import { z } from "zod"
import { hash } from "bcrypt"

import { prisma } from "../database/prisma"
import { AppError } from "../utils/AppError"

export class UserController {
  async create(req: Request, res: Response) {
      const bodySchema = z.object({
        name: z.string().trim().min(3, {message: "Insira um nome"}),
        email: z.string().email(),
        password: z.string().min(6, {message: "A sua senha deve conter no mínimo 6 caracteres"})
      })

      const { name, email, password } = bodySchema.parse(req.body)

      const userWithSameEmail = await prisma.user.findFirst({where: {email}})

      if(userWithSameEmail) {
        throw new AppError("User with same email already exists")
      }

      const hashedPassword = await hash(password, 8)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "client"
        }
      })

      const { password:_, ...userWithoutPassword } = user

    return res.status(201).json(userWithoutPassword)
  }
}