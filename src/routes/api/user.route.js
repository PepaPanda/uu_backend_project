import { Router } from "express";

//controllers
import {
  getUserDetails,
  editUserDetails,
  register,
  getUserShoppingLists,
  acceptInvitation,
  declineInvitation,
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

userRouter.get("/", authenticate, getUserDetails); // This endpoint was changed and is different from the first idea described in the UU portal. To simplify frontend interaction, remove url param and authorization - simply authentication is enough.

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

//These two endpoints were not described in the previous HW, but is needed (I didn't realize it before)
userRouter.patch(
  "/invitation/:shoppingListId/accept",
  authenticate,
  acceptInvitation
);

userRouter.patch(
  "/invitation/:shoppingListId/decline",
  authenticate,
  declineInvitation
);

export default userRouter;
