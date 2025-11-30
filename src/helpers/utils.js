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

export const toObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
};
