import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  create,
  getList,
  deleteList,
  updateList,
  getListUsers,
  removeListUser,
  inviteListUser,
  createListItem,
  editListItem,
  deleteListItem,
} from "./shoppingList.controller.js";

import {
  createNewShoppingList,
  deleteListUser,
  deleteShoppingListById,
  updateExistingShoppingList,
  insertListItem,
  updateExistingListItem,
  deleteListItem as deleteListItemDb,
} from "../repository/shoppinglist.repository.js";

import { addListToInvitations } from "../repository/user.repository.js";

import {
  DbWriteError,
  NotFoundError,
  InvalidPayloadError,
  DuplicateRecordError,
  UnauthorizedError,
} from "../errors/errorList.js";

// mocks
vi.mock("../repository/shoppinglist.repository.js", () => ({
  createNewShoppingList: vi.fn(),
  deleteListUser: vi.fn(),
  deleteShoppingListById: vi.fn(),
  updateExistingShoppingList: vi.fn(),
  insertListItem: vi.fn(),
  updateExistingListItem: vi.fn(),
  deleteListItem: vi.fn(),
}));

vi.mock("../repository/user.repository.js", () => ({
  addListToInvitations: vi.fn(),
}));

describe("src/controllers/shoppingList.controller.js", () => {
  let req, res, next;

  const ownerId = "507f1f77bcf86cd799439011";
  const memberId = "507f1f77bcf86cd799439012";
  const otherUserId = "507f1f77bcf86cd799439099";
  const listId = "507f1f77bcf86cd799439013";
  const itemId = "507f1f77bcf86cd799439014";

  const makeShoppingList = ({
    owner = {
      _id: { toString: () => ownerId },
      name: "Owner Name",
      email: "owner@test.cz",
    },
    members = [
      { userId: ownerId, name: "Owner Name", email: "owner@test.cz" },
      { userId: memberId, name: "Member Name", email: "member@test.cz" },
    ],
  } = {}) => ({
    _id: listId,
    name: "Groceries",
    owner,
    members,
    items: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      user: {
        _id: ownerId,
        firstName: "Martin",
        lastName: "Tichy",
        email: "owner@test.cz",
      },
      shoppingList: makeShoppingList(),
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };

    next = vi.fn();
  });

  // Shopping list
  describe("create", () => {
    it("creates list and returns insertedId", async () => {
      req.body = { name: "My list" };

      createNewShoppingList.mockResolvedValue({
        acknowledged: true,
        insertedId: listId,
      });

      await create(req, res, next);

      expect(createNewShoppingList).toHaveBeenCalledWith({
        name: "My list",
        owner: {
          _id: ownerId,
          name: "Martin Tichy",
          email: "owner@test.cz",
        },
      });

      expect(res.json).toHaveBeenCalledWith({ _id: listId });
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when dbResult not acknowledged", async () => {
      req.body = { name: "My list" };

      createNewShoppingList.mockResolvedValue({ acknowledged: false });

      await create(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.json).not.toHaveBeenCalled();
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("db down");
      createNewShoppingList.mockRejectedValue(err);

      await create(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getList", () => {
    it("returns shopping list from req.shoppingList", async () => {
      req.shoppingList = makeShoppingList();

      await getList(req, res, next);

      expect(res.json).toHaveBeenCalledWith(req.shoppingList);
      expect(next).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when req.shoppingList missing", async () => {
      req.shoppingList = null;

      await getList(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("deleteList", () => {
    it("deletes list and returns 204", async () => {
      req.params = { listId };

      deleteShoppingListById.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      await deleteList(req, res, next);

      expect(deleteShoppingListById).toHaveBeenCalledWith(listId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { listId };

      deleteShoppingListById.mockResolvedValue({
        acknowledged: false,
        deletedCount: 1,
      });

      await deleteList(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when deletedCount is 0", async () => {
      req.params = { listId };

      deleteShoppingListById.mockResolvedValue({
        acknowledged: true,
        deletedCount: 0,
      });

      await deleteList(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("boom");
      req.params = { listId };

      deleteShoppingListById.mockRejectedValue(err);

      await deleteList(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("updateList", () => {
    it("updates list and returns 200", async () => {
      req.params = { listId };
      req.body = { name: "New name", status: "active" };

      updateExistingShoppingList.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
      });

      await updateList(req, res, next);

      expect(updateExistingShoppingList).toHaveBeenCalledWith(listId, {
        name: "New name",
        status: "active",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { listId };
      req.body = { name: "New name", status: "active" };

      updateExistingShoppingList.mockResolvedValue({
        acknowledged: false,
        matchedCount: 1,
      });

      await updateList(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes NotFoundError when matchedCount is 0", async () => {
      req.params = { listId };
      req.body = { name: "New name", status: "active" };

      updateExistingShoppingList.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
      });

      await updateList(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("db fail");
      req.params = { listId };
      req.body = { name: "New name", status: "active" };

      updateExistingShoppingList.mockRejectedValue(err);

      await updateList(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // Shopping list USERS
  describe("getListUsers", () => {
    it("returns members array", async () => {
      req.shoppingList = makeShoppingList({
        members: [{ userId: ownerId }, { userId: memberId }],
      });

      await getListUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith(req.shoppingList.members);
      expect(next).not.toHaveBeenCalled();
    });

    it("passes thrown error if something weird happens", async () => {
      const err = new Error("boom");
      // uděláme shoppingList getter co vyhodí
      Object.defineProperty(req, "shoppingList", {
        get() {
          throw err;
        },
      });

      await getListUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("removeListUser", () => {
    it("owner can delete a member -> 204", async () => {
      req.params = { listId, userId: memberId };
      req.user = { _id: ownerId };
      req.shoppingList = makeShoppingList({
        owner: {
          _id: { toString: () => ownerId },
          name: "Owner Name",
          email: "owner@test.cz",
        },
      });

      deleteListUser.mockResolvedValue({
        acknowledged: true,
        updatedCount: 1,
      });

      await removeListUser(req, res, next);

      expect(deleteListUser).toHaveBeenCalledWith(listId, memberId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("member can delete themselves -> 204", async () => {
      req.params = { listId, userId: memberId };
      req.user = { _id: memberId };
      req.shoppingList = makeShoppingList({
        owner: {
          _id: { toString: () => ownerId },
          name: "Owner Name",
          email: "owner@test.cz",
        },
      });

      deleteListUser.mockResolvedValue({
        acknowledged: true,
        updatedCount: 1,
      });

      await removeListUser(req, res, next);

      expect(deleteListUser).toHaveBeenCalledWith(listId, memberId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("non-owner cannot delete other member -> UnauthorizedError", async () => {
      req.params = { listId, userId: memberId };
      req.user = { _id: otherUserId };
      req.shoppingList = makeShoppingList({
        owner: {
          _id: { toString: () => ownerId },
          name: "Owner Name",
          email: "owner@test.cz",
        },
      });

      await removeListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(deleteListUser).not.toHaveBeenCalled();
    });

    it("cannot delete list owner from members -> InvalidPayloadError", async () => {
      req.params = { listId, userId: ownerId };
      req.user = { _id: ownerId };
      req.shoppingList = makeShoppingList({
        owner: {
          _id: { toString: () => ownerId },
          name: "Owner Name",
          email: "owner@test.cz",
        },
      });

      await removeListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(InvalidPayloadError);
      expect(deleteListUser).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when deleteListUser not acknowledged", async () => {
      req.params = { listId, userId: memberId };
      req.user = { _id: ownerId };
      req.shoppingList = makeShoppingList({
        owner: { _id: { toString: () => ownerId }, email: "owner@test.cz" },
      });

      deleteListUser.mockResolvedValue({
        acknowledged: false,
        updatedCount: 1,
      });

      await removeListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes NotFoundError when updatedCount is 0", async () => {
      req.params = { listId, userId: memberId };
      req.user = { _id: ownerId };
      req.shoppingList = makeShoppingList({
        owner: { _id: { toString: () => ownerId }, email: "owner@test.cz" },
      });

      deleteListUser.mockResolvedValue({
        acknowledged: true,
        updatedCount: 0,
      });

      await removeListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("db err");
      req.params = { listId, userId: memberId };
      req.user = { _id: ownerId };
      req.shoppingList = makeShoppingList({
        owner: { _id: { toString: () => ownerId }, email: "owner@test.cz" },
      });

      deleteListUser.mockRejectedValue(err);

      await removeListUser(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("inviteListUser", () => {
    it("invites user -> 200", async () => {
      req.params = { listId };
      req.body = { email: "invitee@test.cz" };
      req.shoppingList = makeShoppingList({
        owner: { name: "Owner Name", email: "owner@test.cz" },
      });

      addListToInvitations.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
      });

      await inviteListUser(req, res, next);

      expect(addListToInvitations).toHaveBeenCalledWith({
        listId,
        userEmail: "invitee@test.cz",
        listOwner: "Owner Name",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("cannot invite yourself (owner email) -> InvalidPayloadError", async () => {
      req.params = { listId };
      req.body = { email: "owner@test.cz" };
      req.shoppingList = makeShoppingList({
        owner: { name: "Owner Name", email: "owner@test.cz" },
      });

      await inviteListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(InvalidPayloadError);
      expect(addListToInvitations).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { listId };
      req.body = { email: "invitee@test.cz" };
      req.shoppingList = makeShoppingList({
        owner: { name: "Owner Name", email: "owner@test.cz" },
      });

      addListToInvitations.mockResolvedValue({
        acknowledged: false,
        matchedCount: 1,
      });

      await inviteListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes DuplicateRecordError when matchedCount is 0", async () => {
      req.params = { listId };
      req.body = { email: "invitee@test.cz" };
      req.shoppingList = makeShoppingList({
        owner: { name: "Owner Name", email: "owner@test.cz" },
      });

      addListToInvitations.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
      });

      await inviteListUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DuplicateRecordError);
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("boom");
      req.params = { listId };
      req.body = { email: "invitee@test.cz" };

      addListToInvitations.mockRejectedValue(err);

      await inviteListUser(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // Shopping list ITEMS
  describe("createListItem", () => {
    it("creates item and returns 201 + itemId", async () => {
      req.params = { listId };
      req.body = { name: "Milk" };

      insertListItem.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        updatedCount: 1,
        itemId,
      });

      await createListItem(req, res, next);

      expect(insertListItem).toHaveBeenCalledWith(listId, "Milk");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: itemId });
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { listId };
      req.body = { name: "Milk" };

      insertListItem.mockResolvedValue({
        acknowledged: false,
      });

      await createListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes NotFoundError when matchedCount is 0", async () => {
      req.params = { listId };
      req.body = { name: "Milk" };

      insertListItem.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
        updatedCount: 0,
      });

      await createListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });

    it("passes DbWriteError when updatedCount is 0", async () => {
      req.params = { listId };
      req.body = { name: "Milk" };

      insertListItem.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        updatedCount: 0,
      });

      await createListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("db err");
      req.params = { listId };
      req.body = { name: "Milk" };

      insertListItem.mockRejectedValue(err);

      await createListItem(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("editListItem", () => {
    it("edits item and returns 200", async () => {
      req.params = { listId, itemId };
      req.body = { name: "Milk", resolved: true };

      updateExistingListItem.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        updatedCount: 1,
      });

      await editListItem(req, res, next);

      expect(updateExistingListItem).toHaveBeenCalledWith(listId, {
        itemId,
        name: "Milk",
        resolved: true,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { listId, itemId };
      req.body = { name: "Milk", resolved: true };

      updateExistingListItem.mockResolvedValue({
        acknowledged: false,
      });

      await editListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes NotFoundError when matchedCount is 0", async () => {
      req.params = { listId, itemId };
      req.body = { name: "Milk", resolved: true };

      updateExistingListItem.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
        updatedCount: 0,
      });

      await editListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });

    it("passes DbWriteError when updatedCount is 0", async () => {
      req.params = { listId, itemId };
      req.body = { name: "Milk", resolved: true };

      updateExistingListItem.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        updatedCount: 0,
      });

      await editListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("boom");
      req.params = { listId, itemId };
      req.body = { name: "Milk", resolved: true };

      updateExistingListItem.mockRejectedValue(err);

      await editListItem(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("deleteListItem", () => {
    it("deletes item and returns 204", async () => {
      req.params = { listId, itemId };

      deleteListItemDb.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        deletedCount: 1,
      });

      await deleteListItem(req, res, next);

      expect(deleteListItemDb).toHaveBeenCalledWith(listId, itemId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("passes DbWriteError when not acknowledged", async () => {
      req.params = { listId, itemId };

      deleteListItemDb.mockResolvedValue({
        acknowledged: false,
      });

      await deleteListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes NotFoundError when matchedCount is 0", async () => {
      req.params = { listId, itemId };

      deleteListItemDb.mockResolvedValue({
        acknowledged: true,
        matchedCount: 0,
        deletedCount: 0,
      });

      await deleteListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });

    it("passes DbWriteError when deletedCount is 0", async () => {
      req.params = { listId, itemId };

      deleteListItemDb.mockResolvedValue({
        acknowledged: true,
        matchedCount: 1,
        deletedCount: 0,
      });

      await deleteListItem(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(DbWriteError);
    });

    it("passes thrown error from repo", async () => {
      const err = new Error("db err");
      req.params = { listId, itemId };

      deleteListItemDb.mockRejectedValue(err);

      await deleteListItem(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
