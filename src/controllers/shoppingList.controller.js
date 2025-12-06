import {
  createNewShoppingList,
  deleteListUser,
  deleteShoppingListById,
  updateExistingShoppingList,
  insertListItem,
  updateExistingListItem,
  deleteListItem as deleteListItemDb,
} from "../repository/shoppinglist.repository.js";

import { addListToInvitations } from "../repository/user.repository.js";
import {
  DbWriteError,
  NotFoundError,
  InvalidPayloadError,
  DuplicateRecordError,
  UnauthorizedError,
} from "../errors/errorList.js";

//Shopping list

export const create = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { _id, firstName, lastName, email } = req.user;

    const dbResult = await createNewShoppingList({
      name,
      owner: {
        _id,
        name: `${firstName} ${lastName}`,
        email,
      },
    });

    if (!dbResult?.acknowledged) throw new DbWriteError(dbResult);

    res.json({ _id: dbResult.insertedId });
  } catch (err) {
    next(err);
  }
};

export const getList = async (req, res, next) => {
  try {
    const list = req.shoppingList;
    if (!list) throw new NotFoundError("List not found");

    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const deleteList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const dbResult = await deleteShoppingListById(listId);

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.deletedCount === 0)
      throw new NotFoundError("Shopping list not found, nothing was deleted");

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const updateList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { name, status } = req.body;

    const dbResult = await updateExistingShoppingList(listId, { name, status });
    console.log(dbResult);
    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.matchedCount === 0)
      throw new NotFoundError("shopping list with given id not found");

    res.status(200).send();
  } catch (err) {
    next(err);
  }
};

//Shopping list USERS
export const getListUsers = async (req, res, next) => {
  try {
    res.json(req.shoppingList.members);
  } catch (err) {
    next(err);
  }
};

export const removeListUser = async (req, res, next) => {
  try {
    const { listId, userId } = req.params;
    const { _id: actualUserId } = req.user;
    const { owner } = req.shoppingList;

    if (owner._id.toString() !== actualUserId && userId !== actualUserId)
      throw new UnauthorizedError(
        "Only owner can delete anyone, and members only themselves"
      );

    if (owner._id === userId)
      throw new InvalidPayloadError("Cannot delete list owner from members");

    const dbResult = await deleteListUser(listId, userId);

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.updatedCount === 0)
      throw new NotFoundError(
        "User or shopping list not found, nothing was deleted"
      );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const inviteListUser = async (req, res, next) => {
  try {
    const { listId, userId } = req.params;

    if (req.user._id === userId)
      throw new InvalidPayloadError("Cannot invite yourself");

    const dbResult = await addListToInvitations({
      listId,
      userId,
      listOwner: req.shoppingList.owner.name,
    });

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.matchedCount === 0)
      throw new DuplicateRecordError("User already invited");
    res.status(200).send();
  } catch (err) {
    next(err);
  }
};

//Shopping list ITEMS
export const createListItem = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { name } = req.body;

    const dbResult = await insertListItem(listId, name);

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.matchedCount === 0)
      throw new NotFoundError("The list could not be found");
    if (dbResult.updatedCount === 0) throw new DbWriteError(dbResult);

    res.status(201).json({ _id: dbResult.itemId });
  } catch (err) {
    next(err);
  }
};

export const editListItem = async (req, res, next) => {
  try {
    const { listId, itemId } = req.params;
    const { name, resolved } = req.body;

    const dbResult = await updateExistingListItem(listId, {
      itemId,
      name,
      resolved,
    });

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.matchedCount === 0)
      throw new NotFoundError("The item could not be found");
    if (dbResult.updatedCount === 0) throw new DbWriteError(dbResult);

    res.status(200).send();
  } catch (err) {
    next(err);
  }
};

export const deleteListItem = async (req, res, next) => {
  try {
    const { listId, itemId } = req.params;

    const dbResult = await deleteListItemDb(listId, itemId);

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);
    if (dbResult.matchedCount === 0)
      throw new NotFoundError("The item could not be found");
    if (dbResult.deletedCount === 0) throw new DbWriteError(dbResult);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
