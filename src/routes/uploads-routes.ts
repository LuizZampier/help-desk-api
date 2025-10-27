import { Router } from "express"
import multer from "multer"

import { UploadController } from "../controllers/upload-controller"
import uploadConfig from "../configs/upload"

const uploadRoutes = Router()
const uploadController = new UploadController()

const upload = multer(uploadConfig.MULTER)

uploadRoutes.post("/",
  upload.single("file"),
  uploadController.create
)

export { uploadRoutes }