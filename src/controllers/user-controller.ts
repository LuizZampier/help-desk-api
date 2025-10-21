import { Request, Response } from "express"
import { z } from "zod"
import { hash } from "bcrypt"

export class UserController {
  async create(req: Request, res: Response) {
      const bodySchema = z.object({
        name: z.string().trim().min(3, {message: "Insira um nome"}),
        email: z.string().email(),
        password: z.string().min(6, {message: "A sua senha deve conter no mínimo 6 caracteres"})
      })

      const { name, email, password } = bodySchema.parse(req.body)

      const hashedPassword = await hash(password, 8)

      const data = {
        name,
        email,
        password: hashedPassword,
        role: "client"
      }

      const { password:_, ...userWithoutPassword } = data

    return res.status(201).json(userWithoutPassword)
  }
}