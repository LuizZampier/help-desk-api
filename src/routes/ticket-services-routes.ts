import { Router } from "express"
import { TicketServicesController } from "../controllers/ticket-service-controller"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const ticketServiceRoutes = Router()
const ticketServiceController = new TicketServicesController()



ticketServiceRoutes.post(
  "/:ticketId",
  verifyUserAuthenticated(["technical"]),
  ticketServiceController.create
)

ticketServiceRoutes.delete(
  "/:ticketId",
  verifyUserAuthenticated(["technical"]),
  ticketServiceController.remove
)

export { ticketServiceRoutes }