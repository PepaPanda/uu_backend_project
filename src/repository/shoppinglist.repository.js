import { mongo } from "./connect.js";
import { toObjectId } from "../helpers/utils.js";

export const findShoppingListById = async (id) => {
  try {
    const client = await mongo;
    const result = await client
      .db()
      .collection("shopping_lists")
      .findOne({
        _id: toObjectId(id),
      });

    return result;
  } catch (err) {
    return { error: err.code };
  }
};
