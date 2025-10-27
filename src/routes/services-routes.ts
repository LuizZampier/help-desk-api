import { Router } from "express"
import { ServiceController } from "../controllers/services-controller"
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const serviceRoutes = Router()
const serviceController = new ServiceController()

serviceRoutes.post("/", 
  verifyUserAuthenticated(["admin"]),
  serviceController.create
)

serviceRoutes.patch("/:id",
  verifyUserAuthenticated(["admin"]),
  serviceController.update
)

serviceRoutes.patch("/:id/status",
  verifyUserAuthenticated(["admin"]),
  serviceController.updateStatus
)

serviceRoutes.get("/",
  verifyUserAuthenticated(["admin", "technical"]),
  serviceController.index
)

serviceRoutes.get("/:id",
  verifyUserAuthenticated(["admin"]),
  serviceController.show
)

export { serviceRoutes }