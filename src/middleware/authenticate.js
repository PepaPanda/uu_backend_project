import { AuthFailedError } from "../errors/errorList.js";
import { verifyToken } from "../helpers/jwt.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies["access_token"];
    if (!token) throw new AuthFailedError("No access_token");

    const payload = await verifyToken(token);
    if (!payload) throw new AuthFailedError("This token is not gut :(");

    req.user = payload;

    next();
  } catch (err) {
    next(err);
  }
};
