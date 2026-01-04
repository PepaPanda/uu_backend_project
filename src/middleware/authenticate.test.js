import { describe, it, expect, vi, beforeEach } from "vitest";

import { authenticate } from "./authenticate.js";

import { verifyToken } from "../helpers/jwt.js";
import { AuthFailedError } from "../errors/errorList.js";

vi.mock("../helpers/jwt.js", () => ({
  verifyToken: vi.fn(),
}));

describe("src/middleware/authenticate.js", () => {
  let req, res, next;

  const userId = "507f1f77bcf86cd799439011";
  const token = "jwt.token.here";

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      cookies: {},
    };
    res = {};
    next = vi.fn();
  });

  it("sets req.user and calls next when token is valid", async () => {
    req.cookies = { access_token: token };

    verifyToken.mockResolvedValue({
      _id: userId,
      email: "a@b.com",
      firstName: "Martin",
      lastName: "Tichy",
    });

    await authenticate(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith(token);
    expect(req.user).toEqual({
      _id: userId,
      email: "a@b.com",
      firstName: "Martin",
      lastName: "Tichy",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // next() without error
  });

  it("passes AuthFailedError when no access_token cookie", async () => {
    req.cookies = {}; // no token in incoming client cookeis

    await authenticate(req, res, next);

    expect(verifyToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AuthFailedError);
  });

  it("passes AuthFailedError when verifyToken returns falsy payload", async () => {
    req.cookies = { access_token: token };

    verifyToken.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith(token);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AuthFailedError);
  });

  it("passes error when verifyToken throws", async () => {
    req.cookies = { access_token: token };

    const err = new Error("jwt broken");
    verifyToken.mockRejectedValue(err);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
