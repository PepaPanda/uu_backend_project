import { SignJWT, jwtVerify } from "jose";
import { createSecretKey } from "node:crypto";

export const createSignature = async () => {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) throw new Error("JWT secret missing");
  return createSecretKey(JWT_SECRET, "utf-8");
};

export const generateToken = async (payload) => {
  const secretKey = await createSignature();
  const { JWT_LIFETIME } = process.env;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_LIFETIME)
    .sign(secretKey);
};

export const verifyToken = async (token) => {
  try {
    const secretKey = await createSignature();
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (err) {
    return null;
  }
};
