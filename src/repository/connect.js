import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let clientPromise;

if (!global._mongoClientPromise) {
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export const mongo = clientPromise;

export const initDB = async () => {
  const client = await mongo;
  await client
    .db()
    .collection("shopping_lists")
    .createIndex({ "shoppingListItems._id": 1 });
  await client
    .db()
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
};
