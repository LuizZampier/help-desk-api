import { Router } from "express"
import { TicketsController } from "../controllers/tickets-controller"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const ticketsRoutes = Router()
const ticketsController = new TicketsController()

ticketsRoutes.post(
  "/",
  verifyUserAuthenticated(["client"]),
  ticketsController.create
)

export { ticketsRoutes }