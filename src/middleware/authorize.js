import { NotFoundError, UnauthorizedError } from "../errors/errorList.js";

import { findShoppingListById } from "../repository/shoppinglist.repository.js";

export const authorizeUserById = (req, res, next) => {
  try {
    const { _id: actualUserId } = req.user;
    const { userid: requestedUserId } = req.params;

    if (actualUserId !== requestedUserId)
      throw new UnauthorizedError("You cannot access this resource");

    next();
  } catch (err) {
    next(err);
  }
};

export const authorizeShoppingListUser = async (req, res, next) => {
  try {
    const { _id: actualUserId } = req.user;
    const { listId: requestedListId } = req.params;

    const shoppingList = await findShoppingListById(requestedListId);

    if (!shoppingList) throw new NotFoundError("Shopping List not found");

    const isUserMember = !!shoppingList.members.find(
      (member) => member._id === actualUserId
    );

    if (!isUserMember)
      throw new UnauthorizedError("You are not a member of this list");

    req.shoppingList = shoppingList;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorizeShoppingListOwner = async (req, res, next) => {
  try {
    const { _id: actualUserId } = req.user;
    const { listId: requestedListId } = req.params;

    const shoppingList = await findShoppingListById(requestedListId);

    if (!shoppingList) throw new NotFoundError("Shopping List not found");

    const isUserOwner = shoppingList.owner._id === actualUserId;

    if (!isUserOwner)
      throw new UnauthorizedError("You are not the owner of this list");

    req.shoppingList = shoppingList;
    next();
  } catch (err) {
    next(err);
  }
};
