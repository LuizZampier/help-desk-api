import { Router } from "express"

import { userRoutes } from "./users-routes"
import { sessionsRoutes } from "./sessions-routes"
import { serviceRoutes } from "./services-routes"

const routes = Router()

routes.use("/users", userRoutes)
routes.use("/sessions", sessionsRoutes)
routes.use("/services", serviceRoutes)

export { routes }