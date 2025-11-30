import * as z from "zod";

export const shoppingListStatusEnum = z.enum(["active", "archived"]);

export const invitationListStatusEnum = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
]);

const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid mongo id");

const nonEmptyString = z.string().min(1, "Cannot be empty");

export const password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character"
  );

export const member = z.object({
  _id: mongoId,
  name: nonEmptyString.max(300),
  email: z.email(),
});

export const item = z.object({
  _id: mongoId,
  name: nonEmptyString.max(50),
  resolved: z.boolean(),
});

//Workflows

export const createItemSchema = item.pick({
  name: true,
});

export const editItemSchema = item.omit({
  _id: true,
});

export const shoppingList = z.object({
  _id: mongoId,
  name: nonEmptyString.max(30),
  owner: member,
  status: shoppingListStatusEnum,
  createdAt: z.iso.datetime(),
  archivedAt: z.nullable(z.iso.datetime()),
  members: z.array(member),
  items: z.array(item),
});

//Workflows
export const createShoppingListSchema = shoppingList.pick({
  name: true,
});

export const editShoppingListSchema = shoppingList.pick({
  name: true,
  status: true,
});

export const invitation = z.object({
  _id: mongoId,
  status: invitationListStatusEnum,
  invitedByUserId: mongoId,
  invitedAt: z.iso.datetime(),
});

export const user = z.object({
  _id: mongoId,
  email: z.email(),
  password: password,
  firstName: nonEmptyString,
  lastName: nonEmptyString,
  createdAt: z.iso.datetime(),
  invitationList: z.array(invitation),
});

// Workflows

export const registerUserSchema = user.omit({
  _id: true,
  invitationList: true,
  createdAt: true,
});

export const loginUserSchema = user.pick({
  email: true,
  password: true,
});

export const editUserSchema = user.pick({
  firstName: true,
  lastName: true,
});
