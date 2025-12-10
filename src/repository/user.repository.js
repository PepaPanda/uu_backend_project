import { mongo } from "./connect.js";

//Utils
import {
  removeUndefinedObjectFields,
  parseDbResult,
  toMongoObjectId,
  parseDbResultInsert,
} from "../helpers/utils.js";

export const findUserByEmail = async (email) => {
  try {
    const client = await mongo;
    const result = await client.db().collection("users").findOne({
      email: email,
    });

    return parseDbResult(result);
  } catch (err) {
    return { error: err.code };
  }
};

export const findUserById = async (id) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("users")
      .findOne({
        _id: toMongoObjectId(id),
      });

    return parseDbResult(result);
  } catch (err) {
    return { error: err.code };
  }
};

export const createNewUser = async (user) => {
  try {
    const { hashedPassword, email, firstName, lastName } = user;
    const client = await mongo;
    const result = await client.db().collection("users").insertOne({
      password: hashedPassword,
      email,
      firstName,
      lastName,
      createdAt: Date(),
      invitationList: [],
    });

    return parseDbResultInsert(result);
  } catch (err) {
    return { error: err.code };
  }
};

export const updateExistingUser = async (id, data) => {
  try {
    const allowedFields = {
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const { firstName, lastName } = allowedFields;

    let userUpdate;
    let listUpdateMember;
    let listUpdateOwner;

    const client = await mongo;

    userUpdate = await client
      .db()
      .collection("users")
      .updateOne(
        {
          _id: toMongoObjectId(id),
        },
        { $set: removeUndefinedObjectFields(allowedFields) }
      );

    listUpdateMember = await client
      .db()
      .collection("shopping_lists")
      .updateMany(
        { "members._id": toMongoObjectId(id) },
        { $set: { "members.$.name": `${firstName} ${lastName}` } }
      );

    listUpdateOwner = await client
      .db()
      .collection("shopping_lists")
      .updateMany(
        { "owner._id": toMongoObjectId(id) },
        { $set: { "owner.name": `${firstName} ${lastName}` } }
      );

    return { userUpdate, listUpdateMember, listUpdateOwner };
  } catch (err) {
    console.log(err);
    return { error: err.code };
  }
};

export const addListToInvitations = async ({
  listId,
  userEmail,
  listOwner,
}) => {
  const client = await mongo;
  const result = await client
    .db()
    .collection("users")
    .updateOne(
      {
        email: userEmail,
        "invitationList.listId": { $ne: listId },
      },
      {
        $addToSet: {
          invitationList: {
            listId: listId,
            invitedBy: listOwner,
            invitedAt: Date(),
          },
        },
      }
    );

  return result;
};

export const removeInvitation = async (userId, listId) => {
  const client = await mongo;
  const result = await client
    .db()
    .collection("users")
    .updateOne(
      {
        _id: toMongoObjectId(userId),
        "invitationList.listId": listId,
      },
      {
        $pull: { invitationList: { listId: listId } },
      }
    );

  return result;
};
