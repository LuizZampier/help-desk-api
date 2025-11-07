import { Router } from "express"
import { UserController } from "../controllers/user-controller"
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const userRoutes = Router()
const userController = new UserController()

userRoutes.post("/", userController.create)
userRoutes.patch(
  "/:id", 
  ensureAuthenticated,
  userController.update
)
userRoutes.get(
  "/:role",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  userController.index
)
userRoutes.get(
  "/:id",
  ensureAuthenticated,
  verifyUserAuthenticated(["admin"]),
  userController.show
)
userRoutes.delete(
  "/:id",
  ensureAuthenticated,
  userController.remove
)

export { userRoutes}