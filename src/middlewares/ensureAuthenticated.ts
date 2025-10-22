import { Request, Response, NextFunction } from "express"
import { verify } from "jsonwebtoken"

import { authConfig } from "../configs/auth"
import { AppError } from "../utils/AppError"

interface TokenPayLoad {
  role: string
  sub: string
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if(!authHeader) {
      throw new AppError("JWT token not found", 401)
    }

    const [, token] = authHeader.split(" ")

    const { role, sub: user_id } = verify(token, authConfig.jwt.secret) as TokenPayLoad

    req.user = {
      id: user_id,
      role
    }

    return next()
  } catch (error) {
    throw new AppError("Invalid JWT token", 401)
  }
}