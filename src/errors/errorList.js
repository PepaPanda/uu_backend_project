import { AppError } from "./AppError.js";

export class BodyValidationError extends AppError {
  constructor(details) {
    super("Body validation failed", 422, "INVALID_BODY", { details });
  }
}

export class NotFoundError extends AppError {
  constructor(details) {
    super("The requested content could not be found", 404, "NOT_FOUND", {
      details,
    });
  }
}

export class DuplicateRecordError extends AppError {
  constructor(details) {
    super("Same record already exists", 409, "DB_DUPLICATE", {
      details,
    });
  }
}

export class DbWriteError extends AppError {
  constructor(details) {
    super("Couldn't write to DB", 500, "DB_WRITE", {
      details,
    });
  }
}

export class AuthFailedError extends AppError {
  constructor(details) {
    super("Authentication failed", 401, "AUTH_FAILED", {
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(details) {
    super("Authorization failed", 403, "FORBIDDEN", {
      details,
    });
  }
}
