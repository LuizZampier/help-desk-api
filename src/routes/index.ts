import { Router } from "express"

import { userRoutes } from "./users-routes"
import { sessionsRoutes } from "./sessions-routes"
import { serviceRoutes } from "./services-routes"
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"
import { uploadRoutes } from "./uploads-routes"

const routes = Router()

// Public Routes
routes.use("/users", userRoutes)
routes.use("/sessions", sessionsRoutes)

// Private Routes
routes.use(ensureAuthenticated)
routes.use("/services", serviceRoutes)
routes.use("/uploads", uploadRoutes)

export { routes }