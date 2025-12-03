import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import type { JWTPayload, RefreshTokenPayload, User, UserRole } from "./types"

// Environment variables - MUST be set in production
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "dev-secret-access-token-key-12345-change-in-production"
)
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev-secret-refresh-token-key-67890-change-in-production"
)

// Validate that secrets are properly set in production
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production")
  }
  if (
    process.env.JWT_ACCESS_SECRET.length < 32 ||
    process.env.JWT_REFRESH_SECRET.length < 32
  ) {
    throw new Error("JWT secrets must be at least 32 characters long")
  }
}

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"

// Password hashing cost factor (bcrypt)
const BCRYPT_COST = 12

// Generate access token
export async function generateAccessToken(user: Pick<User, "_id" | "email" | "role">): Promise<string> {
  return new SignJWT({
    userId: user._id,
    email: user.email,
    role: user.role,
  } as Omit<JWTPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

// Generate refresh token
export async function generateRefreshToken(userId: string, tokenId: string): Promise<string> {
  return new SignJWT({
    userId,
    tokenId,
  } as Omit<RefreshTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_SECRET)
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET)
    return payload as unknown as RefreshTokenPayload
  } catch {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return { valid: errors.length === 0, errors }
}

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

// Generate secure random token ID
export function generateTokenId(): string {
  return crypto.randomUUID()
}
