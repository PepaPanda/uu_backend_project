import { ZodError } from "zod";
import { BodyValidationError } from "../errors/errorList.js";

//pass a zod schema to validate
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const validationError = new BodyValidationError(
          err.issues.map((err) => {
            return {
              field: err.path.join("."),
              message: err.message,
            };
          })
        );
        next(validationError);
      }

      next(err);
    }
  };
};
