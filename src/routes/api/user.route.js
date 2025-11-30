import { Router } from "express";

//controllers
import {
  getUserDetails,
  editUserDetails,
  register,
} from "../../controllers/user.controller.js";

//middleware
import { validateBody } from "../../middleware/validateBody.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeUserById } from "../../middleware/authorize.js";

//Validation schemas
import {
  registerUserSchema,
  editUserSchema,
} from "../../zod_schemas/schemaList.js";

const userRouter = Router();

userRouter.post("/register", validateBody(registerUserSchema), register);

userRouter.get("/:userid", authenticate, authorizeUserById, getUserDetails);

userRouter.patch(
  "/:userid",
  validateBody(editUserSchema),
  authenticate,
  authorizeUserById,
  editUserDetails
);

userRouter.get(
  "/:userid/shoppinglist",
  authenticate,
  authorizeUserById,
  getUserDetails
);

export default userRouter;
