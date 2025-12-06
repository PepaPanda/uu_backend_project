export const removeUndefinedObjectFields = (object) => {
  const dataToOutput = {};

  Object.keys(object).forEach((key) => {
    if (typeof object[key] !== "undefined") {
      dataToOutput[key] = object[key];
    }
  });

  return dataToOutput;
};

import { ObjectId } from "mongodb";

export const toMongoObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
};

export const parseDbResult = (dbData) => {
  if (!dbData) return null;
  if (!dbData._id) return dbData;

  return {
    ...dbData,
    _id: dbData._id.toString(),
  };
};

export const parseDbResultInsert = (dbData) => {
  if (!dbData) return null;
  if (!dbData.insertedId) return dbData;

  return { ...dbData, insertedId: dbData.insertedId.toString() };
};

export const parseDbResultArray = (dbData) => {
  if (!dbData) return null;
  if (!Array.isArray(dbData)) return dbData;

  return dbData.map((instance) => {
    if (!instance._id) return instance;

    return {
      ...instance,
      _id: dbData._id.toString(),
    };
  });
};
