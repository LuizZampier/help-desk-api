import { Request, Response } from "express"

export class UserController {
  async create(req: Request, res: Response) {
    return res.status(201).json({message: "Work it!"})
  }
}