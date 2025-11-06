import { Router } from "express"

import { userRoutes } from "./users-routes"
import { sessionsRoutes } from "./sessions-routes"
import { serviceRoutes } from "./services-routes"
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"
import { uploadRoutes } from "./uploads-routes"
import { availableHourRoutes } from "./available-hours-routes"
import { ticketsRoutes } from "./tickets-routes"
import { ticketServiceRoutes } from "./ticket-services-routes"

const routes = Router()

// Public Routes
routes.use("/users", userRoutes)
routes.use("/sessions", sessionsRoutes)

// Private Routes
routes.use(ensureAuthenticated)
routes.use("/services", serviceRoutes)
routes.use("/uploads", uploadRoutes)
routes.use("/available-hour", availableHourRoutes)
routes.use("/tickets", ticketsRoutes)
routes.use("/ticket-services", ticketServiceRoutes)
routes.use("/ticket-history")

export { routes }