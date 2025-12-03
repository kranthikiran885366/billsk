import { createAuditLog as createAuditLogDB } from "./db"
import type { AuditLog } from "./types"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_RESET"
  | "SETTINGS_UPDATE"
  | "EXPORT"

export type EntityType = "user" | "bill" | "bag" | "commodity" | "settings" | "session"

export interface AuditLogInput {
  entityType: EntityType
  entityId: string
  action: AuditAction
  userId: string
  userName?: string
  ipAddress?: string
  userAgent?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export async function createAuditLog(input: AuditLogInput): Promise<AuditLog> {
  // Use the actual database function
  return await createAuditLogDB(input as any)
}

// Sanitize sensitive fields before logging
export function sanitizeForAudit<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: string[] = ["password", "passwordHash", "token", "refreshToken"],
): Partial<T> {
  const sanitized = { ...obj }
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      ;(sanitized as Record<string, unknown>)[field] = "[REDACTED]"
    }
  }
  return sanitized
}
