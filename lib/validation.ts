// Input validation utilities
import { z } from "zod"

// Email sanitization helper
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// SQL Injection prevention - sanitize string inputs
export function sanitizeString(input: string): string {
  return input.replace(/[<>'"`;()]/g, "").trim()
}

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
    .refine(
      (password) => {
        // Block common weak passwords
        const commonPatterns = [
          /123456/,
          /password/i,
          /qwerty/i,
          /admin/i,
          /letmein/i,
          /welcome/i,
        ]
        return !commonPatterns.some((pattern) => pattern.test(password))
      },
      { message: "Password contains common patterns and is not secure" }
    ),
  role: z.enum(["admin", "viewer"]),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "viewer"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
})

// Commodity schemas
export const createCommoditySchema = z.object({
  name: z.string().min(2, "Commodity name must be at least 2 characters"),
  defaultRatePer100Kg: z.number().positive("Rate must be positive"),
  defaultDeductionPerBag: z.union([z.literal(0), z.literal(1), z.literal(2)]),
})

export const updateCommoditySchema = z.object({
  name: z.string().min(2).optional(),
  defaultRatePer100Kg: z.number().positive().optional(),
  defaultDeductionPerBag: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
})

// Bag schema
export const bagSchema = z.object({
  originalWeight: z.number().positive("Weight must be positive").max(500, "Weight cannot exceed 500kg"),
  notes: z.string().optional(),
})

// Deductions schema
export const deductionsSchema = z.object({
  commission: z.number().min(0, "Commission cannot be negative"),
  commissionType: z.enum(["flat", "percentage"]),
  transport: z.number().min(0, "Transport cannot be negative"),
  labour: z.number().min(0, "Labour cannot be negative"),
  loading: z.number().min(0, "Loading cannot be negative"),
  weighing: z.number().min(0, "Weighing cannot be negative"),
  misc: z.number().min(0, "Misc cannot be negative"),
})

// Bill schemas
export const createBillSchema = z.object({
  sellerName: z.string().min(2, "Seller name must be at least 2 characters"),
  buyerName: z.string().min(2, "Buyer name must be at least 2 characters"),
  commodityId: z.string().min(1, "Commodity is required"),
  ratePer100Kg: z.number().positive("Rate must be positive"),
  deductionPerBag: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  bags: z.array(bagSchema).min(1, "At least one bag is required"),
  deductions: deductionsSchema,
})

export const updateBillSchema = z.object({
  sellerName: z.string().min(2).optional(),
  buyerName: z.string().min(2).optional(),
  commodityId: z.string().optional(),
  ratePer100Kg: z.number().positive().optional(),
  deductionPerBag: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  bags: z.array(bagSchema).min(1).optional(),
  deductions: deductionsSchema.optional(),
  status: z.enum(["draft", "finalized", "paid"]).optional(),
})

// Settings schema
export const updateSettingsSchema = z.object({
  deductionPerBagDefault: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  roundingMode: z.enum(["floor", "ceil", "round"]).optional(),
  defaultRatePer100Kg: z.number().positive().optional(),
})

// Query params schemas
export const billsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  commodityId: z.string().optional(),
  status: z.enum(["draft", "finalized", "paid"]).optional(),
  search: z.string().optional(),
})

export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  entityType: z.enum(["user", "commodity", "bill", "bag", "settings"]).optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(["create", "update", "delete", "login", "logout", "failed_login"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
