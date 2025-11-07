import { Router } from "express"

import { TicketHistoryController } from "../controllers/tickets-history-controller"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const ticketHistoryRoutes = Router()
const ticketHistoryController = new TicketHistoryController()

ticketHistoryRoutes.get(
  "/",
  verifyUserAuthenticated(["client"]),
  ticketHistoryController.index
)

ticketHistoryRoutes.get(
  "/:id",
  verifyUserAuthenticated(["client"]),
  ticketHistoryController.show
)

export { ticketHistoryRoutes }