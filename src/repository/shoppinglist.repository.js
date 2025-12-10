import { mongo } from "./connect.js";
import {
  parseDbResultArray,
  parseDbResult,
  toMongoObjectId,
  parseDbResultInsert,
  removeUndefinedObjectFields,
} from "../helpers/utils.js";
import { ObjectId } from "mongodb";

export const findShoppingListById = async (id) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .findOne({
        _id: toMongoObjectId(id),
      });

    return parseDbResult(result);
  } catch (err) {
    return { error: err.code };
  }
};

export const findShoppingListsByUserId = async (userId) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .find({
        "members._id": toMongoObjectId(userId),
      });

    return parseDbResultArray(result.toArray());
  } catch (err) {
    return { error: err.code };
  }
};

export const createNewShoppingList = async (listData) => {
  try {
    const { name, owner } = listData;
    if (!name || !owner) return null;

    const { _id, name: ownerName, email } = owner;

    const ownerDbObject = {
      _id: toMongoObjectId(_id),
      name: ownerName,
      email,
    };

    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .insertOne({
        name,
        owner: ownerDbObject,
        status: "active",
        createdAt: Date(),
        archivedAt: null,
        members: [ownerDbObject],
        items: [],
      });

    return parseDbResultInsert(result);
  } catch (err) {
    console.log(err);
    return { error: err.code };
  }
};

export const deleteShoppingListById = async (id) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .deleteOne({ _id: toMongoObjectId(id) });

    return result;
  } catch (err) {
    return { error: err.code };
  }
};

export const updateExistingShoppingList = async (id, data) => {
  try {
    const client = await mongo;

    //Query 1 - retrieve the shoping list first
    const doc = await client
      .db()
      .collection("shopping_lists")
      .findOne({ _id: toMongoObjectId(id) });

    if (!doc) return null;

    const allowedFields = {
      name: data.name,
      status: data.status,
      archivedAt:
        data.status === "active"
          ? null
          : data.status === "archived" && doc.status === "active"
          ? Date()
          : doc.archivedAt,
    };

    //Query 2 set the shopping list
    const result = await client
      .db()
      .collection("shopping_lists")
      .updateOne(
        {
          _id: toMongoObjectId(id),
        },
        { $set: removeUndefinedObjectFields(allowedFields) }
      );

    return result;
  } catch (err) {
    return { error: err.code };
  }
};

export const deleteListUser = async (listId, userId) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .updateOne(
        {
          _id: toMongoObjectId(listId),
          "owner._id": { $ne: toMongoObjectId(userId) },
        },
        { $pull: { members: { _id: toMongoObjectId(userId) } } }
      );

    return result;
  } catch (err) {
    return { error: err.code };
  }
};

export const addListUser = async (listId, user) => {
  try {
    const { name, email, userId } = user;

    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .updateOne(
        {
          _id: toMongoObjectId(listId),
          members: {
            $not: {
              $elemMatch: { _id: toMongoObjectId(userId) },
            },
          },
        },
        {
          $push: {
            members: {
              _id: toMongoObjectId(userId),
              name,
              email,
            },
          },
        }
      );

    return result;
  } catch (err) {
    return { error: err.code };
  }
};

export const insertListItem = async (listId, itemName) => {
  const itemId = new ObjectId();

  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .updateOne(
        { _id: toMongoObjectId(listId) },
        {
          $push: {
            items: {
              _id: itemId,
              name: itemName || "",
              resolved: false,
            },
          },
        }
      );

    return { ...result, itemId };
  } catch (err) {
    return { error: err.code };
  }
};

export const updateExistingListItem = async (
  listId,
  { itemId, name, resolved }
) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .updateOne(
        { _id: toMongoObjectId(listId), "items._id": toMongoObjectId(itemId) },
        {
          $set: { "items.$.name": name, "items.$.resolved": resolved },
        }
      );

    return result;
  } catch (err) {
    return { error: err.code };
  }
};

export const deleteListItem = async (listId, itemId) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .updateOne(
        { _id: toMongoObjectId(listId), "items._id": toMongoObjectId(itemId) },
        {
          $pull: { items: { _id: toMongoObjectId(itemId) } },
        }
      );

    return result;
  } catch (err) {
    return { error: err.code };
  }
};
