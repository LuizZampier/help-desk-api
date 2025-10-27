import express from "express"
import "express-async-errors"

import { routes } from "./routes"
import { errorHandling } from "./middlewares/errorHandling"
import uploadConfig from "./configs/upload"

const app = express()

app.use(express.json())
app.use("/uploads", express.static(uploadConfig.UPLOADS_FOLDER))

app.use(routes)
app.use(errorHandling)

export { app }