import { Router } from "express";

//middleware
import { validateBody } from "../../middleware/validateBody.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  authorizeShoppingListOwner,
  authorizeShoppingListUser,
} from "../../middleware/authorize.js";

//Validation schemas
import {
  createShoppingListSchema,
  createItemSchema,
  editItemSchema,
  editShoppingListSchema,
} from "../../zod_schemas/schemaList.js";

//Controllers
import {
  create,
  createListItem,
  deleteList,
  deleteListItem,
  editListItem,
  getList,
  getListUsers,
  inviteListUser,
  removeListUser,
  updateList,
} from "../../controllers/shoppingList.controller.js";

const shoppingListRouter = Router();

//Shoping list set
shoppingListRouter.post(
  "/create",
  validateBody(createShoppingListSchema),
  authenticate,
  create
);
shoppingListRouter.get(
  "/:listId",
  authenticate,
  authorizeShoppingListUser,
  getList
);
shoppingListRouter.delete(
  "/:listId",
  authenticate,
  authorizeShoppingListOwner,
  deleteList
);
shoppingListRouter.patch(
  "/:listId",
  validateBody(editShoppingListSchema),
  authenticate,
  authorizeShoppingListOwner,
  updateList
);

//Shopping list user set
shoppingListRouter.get(
  "/:listId/user",
  authenticate,
  authorizeShoppingListUser,
  getListUsers
);
shoppingListRouter.patch(
  "/:listId/user/:userId/remove",
  authenticate,
  authorizeShoppingListOwner,
  removeListUser
);
shoppingListRouter.patch(
  "/:listId/user/:userId/invite",
  authenticate,
  authorizeShoppingListOwner,
  inviteListUser
);

//Shopping list item set
shoppingListRouter.post(
  "/:listId/item",
  validateBody(createItemSchema),
  authenticate,
  authorizeShoppingListUser,
  createListItem
);
shoppingListRouter.patch(
  "/:listId/item/:itemId",
  validateBody(editItemSchema),
  authenticate,
  authorizeShoppingListUser,
  editListItem
);
shoppingListRouter.delete(
  "/:listId/item/:itemId",
  authenticate,
  authorizeShoppingListUser,
  deleteListItem
);

export default shoppingListRouter;
