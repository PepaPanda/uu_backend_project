import { Router } from "express";

//controllers
import {
  getUserDetails,
  editUserDetails,
  register,
  getUserShoppingLists,
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

userRouter.get("/:userId", authenticate, authorizeUserById, getUserDetails);

userRouter.patch(
  "/:userId",
  validateBody(editUserSchema),
  authenticate,
  authorizeUserById,
  editUserDetails
);

userRouter.get(
  "/:userId/shoppinglist",
  authenticate,
  authorizeUserById,
  getUserShoppingLists
);

export default userRouter;
