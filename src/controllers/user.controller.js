import bcrypt from "bcryptjs";
import {
  createNewUser,
  findUserById,
  updateExistingUser,
  removeInvitation,
} from "../repository/user.repository.js";
import {
  DbWriteError,
  DuplicateRecordError,
  NotFoundError,
} from "../errors/errorList.js";

import {
  findShoppingListsByUserId,
  addListUser,
} from "../repository/shoppinglist.repository.js";

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); //bcrypt alg includes salt
    const dbResult = await createNewUser({
      email,
      hashedPassword,
      firstName,
      lastName,
    });

    if (dbResult.error === 11000)
      throw new DuplicateRecordError("this email is already taken");

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);

    res.status(201).json({ _id: dbResult.insertedId });
  } catch (err) {
    next(err);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) throw new NotFoundError("User not found");

    const { password, ...safeUser } = user; //Do not send the hashed password back to the client

    res.json(safeUser);
  } catch (err) {
    next(err);
  }
};

export const editUserDetails = async (req, res, next) => {
  try {
    const { _id: id } = req.user;
    const { firstName, lastName } = req.body;
    const dbResult = await updateExistingUser(id, { firstName, lastName });
    const { userUpdate } = dbResult;

    if (!userUpdate.acknowledged) throw new DbWriteError(dbResult);

    if (userUpdate.matchedCount === 0)
      throw new NotFoundError("user with given id not found");

    res.status(200).send();
  } catch (err) {
    next(err);
  }
};

export const getUserShoppingLists = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const shoppingLists = await findShoppingListsByUserId(_id);
    res.status(200).json(shoppingLists);
  } catch (err) {
    next(err);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { _id, firstName, lastName, email } = req.user;
    const { shoppingListId } = req.params;

    const dbResult = await removeInvitation(_id, shoppingListId);

    if (!dbResult.acknowledged) throw new DbWriteError();
    if (dbResult.matchedCount === 0)
      throw new NotFoundError("This invitation does not exist");

    const dbResult2 = await addListUser(shoppingListId, {
      name: `${firstName} ${lastName}`,
      email,
      userId: _id,
    });
    if (!dbResult2.acknowledged) throw new DbWriteError();
    if (dbResult2.matchedCount === 0)
      throw new NotFoundError(
        "Nothing was updated, user could not be added. It is possible that the shopping list was deleted."
      );

    res.status(200).send();
  } catch (err) {
    next(err);
  }
};

export const declineInvitation = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { shoppingListId } = req.params;

    const dbResult = await removeInvitation(_id, shoppingListId);

    if (!dbResult.acknowledged) throw new DbWriteError();
    if (dbResult.matchedCount === 0)
      throw new NotFoundError("This invitation does not exist");

    if (dbResult.updatedCount === 0) throw new DbWriteError();

    res.status(200).send();
  } catch (err) {
    next(err);
  }
};
