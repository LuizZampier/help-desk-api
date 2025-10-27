import { Router } from "express"
import { UserController } from "../controllers/user-controller"
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"
import { verifyUserAuthenticated } from "../middlewares/verifyUserAuthorization"

const userRoutes = Router()
const userController = new UserController()

userRoutes.post("/", userController.create)
userRoutes.patch("/:id", 
  ensureAuthenticated,
  userController.update)

export { userRoutes}