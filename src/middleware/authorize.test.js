import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  authorizeUserById,
  authorizeShoppingListUser,
  authorizeShoppingListOwner,
} from "./authorize.js";

import { findShoppingListById } from "../repository/shoppinglist.repository.js";

import { NotFoundError, UnauthorizedError } from "../errors/errorList.js";

vi.mock("../repository/shoppinglist.repository.js", () => ({
  findShoppingListById: vi.fn(),
}));

describe("src/middleware/authorize.js", () => {
  let req, res, next;

  const userId = "507f1f77bcf86cd799439011";
  const otherUserId = "507f1f77bcf86cd799439099";
  const listId = "507f1f77bcf86cd799439012";

  const makeList = ({
    ownerId = userId,
    members = [{ _id: { toString: () => userId } }],
  } = {}) => ({
    _id: listId,
    owner: { _id: { toString: () => ownerId }, email: "owner@test.cz" },
    members,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: userId },
      params: {},
    };
    res = {};
    next = vi.fn();
  });

  //authorizeUserById
  describe("authorizeUserById", () => {
    it("calls next when actual user id matches requested user id", () => {
      req.params = { userId };

      authorizeUserById(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("passes UnauthorizedError when ids differ", () => {
      req.params = { userId: otherUserId };

      authorizeUserById(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    });
  });

  //authorizeShoppingListUser
  describe("authorizeShoppingListUser", () => {
    it("loads list, sets req.shoppingList and calls next when user is a member", async () => {
      req.params = { listId };

      const list = makeList({
        members: [
          { _id: { toString: () => userId } },
          { _id: { toString: () => otherUserId } },
        ],
      });

      findShoppingListById.mockResolvedValue(list);

      await authorizeShoppingListUser(req, res, next);

      expect(findShoppingListById).toHaveBeenCalledWith(listId);
      expect(req.shoppingList).toBe(list);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("passes NotFoundError when list does not exist", async () => {
      req.params = { listId };

      findShoppingListById.mockResolvedValue(null);

      await authorizeShoppingListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(req.shoppingList).toBeUndefined();
    });

    it("passes UnauthorizedError when user is not a member", async () => {
      req.params = { listId };

      const list = makeList({
        members: [{ _id: { toString: () => otherUserId } }],
      });

      findShoppingListById.mockResolvedValue(list);

      await authorizeShoppingListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(req.shoppingList).toBeUndefined();
    });

    it("passes error when repo throws", async () => {
      req.params = { listId };

      const err = new Error("db err");
      findShoppingListById.mockRejectedValue(err);

      await authorizeShoppingListUser(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  //authorizeShoppingListOwner
  describe("authorizeShoppingListOwner", () => {
    it("loads list, sets req.shoppingList and calls next when user is the owner", async () => {
      req.params = { listId };

      const list = makeList({ ownerId: userId });

      findShoppingListById.mockResolvedValue(list);

      await authorizeShoppingListOwner(req, res, next);

      expect(findShoppingListById).toHaveBeenCalledWith(listId);
      expect(req.shoppingList).toBe(list);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("passes NotFoundError when list does not exist", async () => {
      req.params = { listId };

      findShoppingListById.mockResolvedValue(null);

      await authorizeShoppingListOwner(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(req.shoppingList).toBeUndefined();
    });

    it("passes UnauthorizedError when user is not the owner", async () => {
      req.params = { listId };

      const list = makeList({ ownerId: otherUserId });

      findShoppingListById.mockResolvedValue(list);

      await authorizeShoppingListOwner(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(req.shoppingList).toBeUndefined();
    });

    it("passes error when repo throws", async () => {
      req.params = { listId };

      const err = new Error("db err");
      findShoppingListById.mockRejectedValue(err);

      await authorizeShoppingListOwner(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
