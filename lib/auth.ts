import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no .env");
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  category: "MASTER" | "GESTOR" | "OPERADOR" | "CLIENTE";
  companyId: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as SessionUser;
  } catch {
    return null;
  }
}