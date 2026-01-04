import { describe, it, expect, vi, beforeEach } from "vitest";

import bcrypt from "bcryptjs";

import {
  register,
  getUserDetails,
  editUserDetails,
  getUserShoppingLists,
  acceptInvitation,
  declineInvitation,
} from "./user.controller.js";

import {
  createNewUser,
  findUserById,
  updateExistingUser,
  removeInvitation,
} from "../repository/user.repository.js";

import {
  findShoppingListsByUserId,
  addListUser,
} from "../repository/shoppinglist.repository.js";

import {
  DbWriteError,
  DuplicateRecordError,
  NotFoundError,
} from "../errors/errorList.js";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock("../repository/user.repository.js", () => ({
  createNewUser: vi.fn(),
  findUserById: vi.fn(),
  updateExistingUser: vi.fn(),
  removeInvitation: vi.fn(),
}));

vi.mock("../repository/shoppinglist.repository.js", () => ({
  findShoppingListsByUserId: vi.fn(),
  addListUser: vi.fn(),
}));

describe("src/controllers/user.controller.js", () => {
  let req, res, next;

  const userId = "507f1f77bcf86cd799439011";
  const listId = "507f1f77bcf86cd799439012";
  const insertedId = "507f1f77bcf86cd799439013";

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      user: { _id: userId },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };

    next = vi.fn();
  });

  // register
  describe("register", () => {
    it("hashes password, creates user and returns 201 + insertedId", async () => {
      req.body = {
        email: "a@b.com",
        password: "secret",
        firstName: "Martin",
        lastName: "Tichy",
      };

      bcrypt.hash.mockResolvedValue("hashed-secret");
      createNewUser.mockResolvedValue({
        acknowledged: true,
        insertedId,
      });

      await register(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);
      expect(createNewUser).toHaveBeenCalledWith({
        email: "a@b.com",
        hashedPassword: "hashed-secret",
        firstName: "Martin",
        lastName: "Tichy",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: insertedId });
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DuplicateRecordError when dbResult.error === 11000", async () => {
      req.body = {
        email: "taken@b.com",
        password: "secret",
        firstName: "A",
        lastName: "B",
      };

      bcrypt.hash.mockResolvedValue("hashed");
      createNewUser.mockResolvedValue({
        error: 11000,
        acknowledged: true,
      });

      await register(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DuplicateRecordError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when write is not acknowledged", async () => {
      req.body = {
        email: "x@y.com",
        password: "secret",
        firstName: "A",
        lastName: "B",
      };

      bcrypt.hash.mockResolvedValue("hashed");
      createNewUser.mockResolvedValue({
        acknowledged: false,
      });

      await register(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes thrown error (e.g. bcrypt fails)", async () => {
      req.body = {
        email: "x@y.com",
        password: "secret",
        firstName: "A",
        lastName: "B",
      };

      const err = new Error("boom");
      bcrypt.hash.mockRejectedValue(err);

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // getUserDetails
  describe("getUserDetails", () => {
    it("returns user without password", async () => {
      findUserById.mockResolvedValue({
        _id: userId,
        email: "a@b.com",
        firstName: "Martin",
        lastName: "Tichy",
        password: "hashed",
      });

      await getUserDetails(req, res, next);

      expect(findUserById).toHaveBeenCalledWith(userId);
      expect(res.json).toHaveBeenCalledWith({
        _id: userId,
        email: "a@b.com",
        firstName: "Martin",
        lastName: "Tichy",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when user not found", async () => {
      findUserById.mockResolvedValue(null);

      await getUserDetails(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.json).not.toHaveBeenCalled();
    });

    it("passes repo thrown error", async () => {
      const err = new Error("db down");
      findUserById.mockRejectedValue(err);

      await getUserDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // editUserDetails
  describe("editUserDetails", () => {
    it("updates user and returns 200", async () => {
      req.body = { firstName: "New", lastName: "Name" };

      updateExistingUser.mockResolvedValue({
        userUpdate: {
          acknowledged: true,
          matchedCount: 1,
        },
      });

      await editUserDetails(req, res, next);

      expect(updateExistingUser).toHaveBeenCalledWith(userId, {
        firstName: "New",
        lastName: "Name",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when update not acknowledged", async () => {
      req.body = { firstName: "A", lastName: "B" };

      updateExistingUser.mockResolvedValue({
        userUpdate: {
          acknowledged: false,
          matchedCount: 1,
        },
      });

      await editUserDetails(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when matchedCount is 0", async () => {
      req.body = { firstName: "A", lastName: "B" };

      updateExistingUser.mockResolvedValue({
        userUpdate: {
          acknowledged: true,
          matchedCount: 0,
        },
      });

      await editUserDetails(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes repo thrown error", async () => {
      const err = new Error("fail");
      req.body = { firstName: "A", lastName: "B" };

      updateExistingUser.mockRejectedValue(err);

      await editUserDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // getUserShoppingLists
  describe("getUserShoppingLists", () => {
    it("returns 200 + shoppingLists", async () => {
      const lists = [{ _id: listId }, { _id: "507f1f77bcf86cd799439099" }];
      findShoppingListsByUserId.mockResolvedValue(lists);

      await getUserShoppingLists(req, res, next);

      expect(findShoppingListsByUserId).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(lists);
      expect(next).not.toHaveBeenCalled();
    });

    it("passes repo thrown error", async () => {
      const err = new Error("db err");
      findShoppingListsByUserId.mockRejectedValue(err);

      await getUserShoppingLists(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // acceptInvitation
  describe("acceptInvitation", () => {
    it("removes invitation, adds user to list, returns 200", async () => {
      req.user = {
        _id: userId,
        firstName: "Martin",
        lastName: "Tichy",
        email: "a@b.com",
      };
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
      });

      addListUser.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
      });

      await acceptInvitation(req, res, next);

      expect(removeInvitation).toHaveBeenCalledWith(userId, listId);
      expect(addListUser).toHaveBeenCalledWith(listId, {
        name: "Martin Tichy",
        email: "a@b.com",
        userId,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when removeInvitation not acknowledged", async () => {
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: false,
        matchedCount: 1,
      });

      await acceptInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(addListUser).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when invitation does not exist (matchedCount 0)", async () => {
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
      });

      await acceptInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(addListUser).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when addListUser not acknowledged", async () => {
      req.user = {
        _id: userId,
        firstName: "Martin",
        lastName: "Tichy",
        email: "a@b.com",
      };
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
      });

      addListUser.mockResolvedValue({
        acknowledged: false,
        matchedCount: 1,
      });

      await acceptInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes NotFoundError when addListUser matchedCount is 0", async () => {
      req.user = {
        _id: userId,
        firstName: "Martin",
        lastName: "Tichy",
        email: "a@b.com",
      };
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
      });

      addListUser.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
      });

      await acceptInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });

    it("passes thrown error (e.g. removeInvitation throws)", async () => {
      const err = new Error("boom");
      req.params = { shoppingListId: listId };

      removeInvitation.mockRejectedValue(err);

      await acceptInvitation(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // declineInvitation
  describe("declineInvitation", () => {
    it("removes invitation and returns 200", async () => {
      req.user = { _id: userId };
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        updatedCount: 1,
      });

      await declineInvitation(req, res, next);

      expect(removeInvitation).toHaveBeenCalledWith(userId, listId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: false,
        matchedCount: 1,
        updatedCount: 1,
      });

      await declineInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when invitation does not exist (matchedCount 0)", async () => {
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
        updatedCount: 0,
      });

      await declineInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when updatedCount is 0", async () => {
      req.params = { shoppingListId: listId };

      removeInvitation.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        updatedCount: 0,
      });

      await declineInvitation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes thrown error", async () => {
      const err = new Error("db err");
      req.params = { shoppingListId: listId };

      removeInvitation.mockRejectedValue(err);

      await declineInvitation(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
