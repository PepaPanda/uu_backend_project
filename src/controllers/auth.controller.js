import bcrypt from "bcryptjs";
import { findUserByEmail } from "../repository/user.repository.js";
import { NotFoundError, AuthFailedError } from "../errors/errorList.js";

import { generateToken } from "../helpers/jwt.js";

const { DEV_ENV } = process.env;
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const matchedUser = await findUserByEmail(email);
    if (!matchedUser)
      throw new NotFoundError("User with this e-mail does not exist");

    const verifyPassword = await bcrypt.compare(password, matchedUser.password);

    if (!verifyPassword) throw new AuthFailedError("Password incorrect");

    const { _id, firstName, lastName } = matchedUser;

    const token = await generateToken({ _id, email, firstName, lastName });

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: DEV_ENV !== "true",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60,
        path: "/",
      })
      .json({ _id });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res
      .clearCookie("access_token", {
        httpOnly: true,
        secure: DEV_ENV !== "true",
        sameSite: "lax",
        path: "/",
      })
      .status(200)
      .send();
  } catch (err) {
    next(err);
  }
};
