import { NotFoundError } from "../errors/errorList.js";

export const nonExistentEndpoint = (req, res, next) => {
  const err = new NotFoundError("This endpoint does not exist");
  return next(err);
};
