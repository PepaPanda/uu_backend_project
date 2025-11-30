import { mongo } from "./connect.js";

//Utils
import { removeUndefinedObjectFields, toObjectId } from "../helpers/utils.js";
import { password } from "../zod_schemas/schemaList.js";

export const findUserByEmail = async (email) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("users")
      .findOne(
        {
          email: email,
        },
        { projection: { password: 0 } }
      );

    return {
      ...result,
      _id: result._id.toString(),
    };
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

    return result;
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

    const client = await mongo;
    const result = await client
      .db()
      .collection("users")
      .updateOne(
        {
          id: toObjectId(id),
        },
        { $set: removeUndefinedObjectFields(allowedFields) }
      );

    return result;
  } catch (err) {
    return { error: err.code };
  }
};
