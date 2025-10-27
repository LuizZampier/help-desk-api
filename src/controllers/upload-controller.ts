import { Request, Response } from "express"
import { z } from "zod"
import { ZodError } from "zod"

import uploadConfig from "../configs/upload"
import { DiskStorage } from "../providers/disk-storage"

import { AppError } from "../utils/AppError"

export class UploadController {
  async create(req: Request, res: Response) {
    const diskStorage = new DiskStorage()
    try {
      const fileSchema = z.object({
        filename: z.string().min(1, "file is mandatory"),
        mimetype: z.string().refine(
          (type) => uploadConfig.ACCEPTED_IMAGE_TYPES.includes(type),
          `Invalid file type. Accept only: ${uploadConfig.ACCEPTED_IMAGE_TYPES}`
        ),
        size: z.number()
        .positive()
        .refine(
          (size) => size <= uploadConfig.MAX_FILE_SIZE,
          `file exceed max size ${uploadConfig.MAX_SIZE}`
        )
      }).passthrough()

      const file = fileSchema.parse(req.body)
      const filename = await diskStorage.saveFile(file.filename)

      res.json({filename})
    } catch (error) {
      if(error instanceof ZodError) {
        if(req.file) {
          await diskStorage.deleteFile(req.file.filename, "tmp")
        }

        throw new AppError(error.issues[0].message)
      }

      throw error
    }
  }
}