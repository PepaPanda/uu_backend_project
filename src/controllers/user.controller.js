import bcrypt from "bcryptjs";
import { createNewUser } from "../repository/user.repository.js";
import {
  DbWriteError,
  DuplicateRecordError,
  NotFoundError,
} from "../errors/errorList.js";

import { findUserByEmail } from "../repository/user.repository.js";
import { updateExistingUser } from "../repository/user.repository.js";

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

    res.send({ _id: dbResult.insertedId });
  } catch (err) {
    next(err);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const user = await findUserByEmail(req.user.email);
    if (user) res.json(user);
  } catch (err) {
    next(err);
  }
};

export const editUserDetails = async (req, res, next) => {
  try {
    const { _id: id, firstName, lastName } = req.user;
    const dbResult = await updateExistingUser(id, { firstName, lastName });

    if (dbResult.matchedCount === 0)
      throw new NotFoundError("user with given id not found");

    if (!dbResult.acknowledged) throw new DbWriteError(dbResult);

    res.status(200);
  } catch (err) {
    next(err);
  }
};
