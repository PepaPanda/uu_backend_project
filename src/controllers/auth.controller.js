import bcrypt from "bcryptjs";
import { findUserByEmail } from "../repository/user.repository.js";
import { NotFoundError, AuthFailedError } from "../errors/errorList.js";

import { generateToken } from "../helpers/jwt.js";

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
        secure: true,
        sameSite: "lax",
        maxAge: parseInt(process.env.JWT_LIFETIME) || 1000 * 60 * 15,
      })
      .send();
  } catch (err) {
    next(err);
  }
};
