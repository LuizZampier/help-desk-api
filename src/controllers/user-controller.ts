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

  async update(req: Request, res: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(3, "Insira um nome válido"),
      email: z.string().email(),
      password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
      filename: z.string().min(20).optional()
    })

    const { name, email, password, filename } = bodySchema.parse(req.body)

    const userParams = req.params.id
    const loggedUser = req.user?.id
    const loggedUserRole = req.user?.role

    if(userParams !== loggedUser && loggedUserRole !== "admin") {
      throw new AppError("cannot modify other user")
    }

    const userWithSameEmail = await prisma.user.findFirst(
      {
        where: {
          email,
          NOT: {
            id: loggedUser
          }
        }
      }
    )

    if(userWithSameEmail) {
      throw new AppError("user with same email already exists")
    }

    const hashedPassword = await hash(password, 8)

    const updatedUser = await prisma.user.update({
      data: {
        name, 
        email,
        password: hashedPassword,
        image: filename
      },
      where: {
        id: userParams
      }
    })

    const { password:_, ...userUpdatedWithoutPassword } = updatedUser

    return res.status(200).json(userUpdatedWithoutPassword)
  }

  async index(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    return res.json(users)
  }

  async show(req: Request, res: Response) {
    const { id } = req.params

    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      where: { id }
    })

    return res.json(user)
  }

  async remove(req: Request, res: Response) {
    const paramsId = req.params.id
    const loggedUser = req.user?.id
    const loggedUserRole = req.user?.role

    const userExists = await prisma.user.findFirst({ where: { id: paramsId } })

    if(!userExists) {
      throw new AppError("user not exist", 404)
    }

    if(paramsId !== loggedUser && loggedUserRole !== "admin") {
      throw new AppError("cannot remove other user")
    }

    const removedUser = await prisma.user.delete({ where: { id: paramsId } })

    return res.status(200).json(removedUser)
  }
}