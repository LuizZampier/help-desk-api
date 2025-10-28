import { Router } from "express"
import { AvailableHourController } from "../controllers/available-hours-controller"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const availableHourRoutes = Router()
const availableHourController = new AvailableHourController()

availableHourRoutes.post(
  "/",
  verifyUserAuthenticated(["admin","technical"]),
  availableHourController.create
)

export { availableHourRoutes }
