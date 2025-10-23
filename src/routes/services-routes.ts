import { Router } from "express"
import { ServiceController } from "../controllers/services-controller"
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const serviceRoutes = Router()
const serviceController = new ServiceController()

serviceRoutes.post("/", 
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  serviceController.create
)

serviceRoutes.patch("/:id",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  serviceController.update
)

serviceRoutes.patch("/:id/status",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  serviceController.updateStatus
)

serviceRoutes.get("/",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin", "technical"]),
  serviceController.index
)

serviceRoutes.get("/:id",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  serviceController.show
)

export { serviceRoutes }