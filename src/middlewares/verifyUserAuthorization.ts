import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/AppError"

export function verifyUserAuthenticated(role: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if(!req.user) {
      throw new AppError("Unathorized", 401)
    }

    if(!role.includes(req.user.role)) {
      throw new AppError("Unathorized", 401)
    }

    return next()
  }
}