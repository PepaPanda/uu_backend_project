import { describe, it, expect, vi, beforeEach } from "vitest";

import bcrypt from "bcryptjs";

import { login, logout } from "./auth.controller.js";

import { findUserByEmail } from "../repository/user.repository.js";
import { generateToken } from "../helpers/jwt.js";

import { NotFoundError, AuthFailedError } from "../errors/errorList.js";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("../repository/user.repository.js", () => ({
  findUserByEmail: vi.fn(),
}));

vi.mock("../helpers/jwt.js", () => ({
  generateToken: vi.fn(),
}));

describe("src/controllers/auth.controller.js", () => {
  let req, res, next;

  const userId = "507f1f77bcf86cd799439011";
  const token = "jwt-token-123";

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };

    next = vi.fn();
  });

  // login
  describe("login", () => {
    it("logs in user, sets cookie and returns user id", async () => {
      req.body = {
        email: "test@test.cz",
        password: "secret",
      };

      findUserByEmail.mockResolvedValue({
        _id: userId,
        email: "test@test.cz",
        password: "hashed-password",
        firstName: "Martin",
        lastName: "Tichy",
      });

      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockResolvedValue(token);

      await login(req, res, next);

      expect(findUserByEmail).toHaveBeenCalledWith("test@test.cz");
      expect(bcrypt.compare).toHaveBeenCalledWith("secret", "hashed-password");

      expect(generateToken).toHaveBeenCalledWith({
        _id: userId,
        email: "test@test.cz",
        firstName: "Martin",
        lastName: "Tichy",
      });

      expect(res.cookie).toHaveBeenCalledWith(
        "access_token",
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          maxAge: 1000 * 60 * 60,
          path: "/",
        })
      );

      expect(res.json).toHaveBeenCalledWith({ _id: userId });
      expect(next).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when user does not exist", async () => {
      req.body = {
        email: "missing@test.cz",
        password: "secret",
      };

      findUserByEmail.mockResolvedValue(null);

      await login(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it("passes AuthFailedError when password is incorrect", async () => {
      req.body = {
        email: "test@test.cz",
        password: "wrong",
      };

      findUserByEmail.mockResolvedValue({
        _id: userId,
        email: "test@test.cz",
        password: "hashed-password",
        firstName: "Martin",
        lastName: "Tichy",
      });

      bcrypt.compare.mockResolvedValue(false);

      await login(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(AuthFailedError);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it("passes error when findUserByEmail throws", async () => {
      const err = new Error("db error");
      req.body = {
        email: "test@test.cz",
        password: "secret",
      };

      findUserByEmail.mockRejectedValue(err);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });

    it("passes error when bcrypt.compare throws", async () => {
      const err = new Error("bcrypt fail");
      req.body = {
        email: "test@test.cz",
        password: "secret",
      };

      findUserByEmail.mockResolvedValue({
        _id: userId,
        email: "test@test.cz",
        password: "hashed",
        firstName: "Martin",
        lastName: "Tichy",
      });

      bcrypt.compare.mockRejectedValue(err);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });

    it("passes error when generateToken throws", async () => {
      const err = new Error("jwt fail");
      req.body = {
        email: "test@test.cz",
        password: "secret",
      };

      findUserByEmail.mockResolvedValue({
        _id: userId,
        email: "test@test.cz",
        password: "hashed",
        firstName: "Martin",
        lastName: "Tichy",
      });

      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockRejectedValue(err);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // logout
  describe("logout", () => {
    it("clears access_token cookie and returns 200", async () => {
      await logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "access_token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes error when something throws", async () => {
      const err = new Error("boom");
      res.clearCookie.mockImplementation(() => {
        throw err;
      });

      await logout(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
