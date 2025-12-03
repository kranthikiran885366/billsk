// Database model types for MongoDB integration

export type UserRole = "admin" | "viewer"
export type UserStatus = "active" | "inactive" | "suspended"

export interface User {
  _id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  status: UserStatus
  mfaEnabled: boolean
  mfaSecret?: string
  lastLogin?: Date
  failedLoginAttempts: number
  lockedUntil?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Commodity {
  _id: string
  name: string
  defaultRatePer100Kg: number
  defaultDeductionPerBag: 0 | 1 | 2
  createdAt: Date
  updatedAt: Date
}

export interface Bag {
  _id: string
  billId: string
  farmerId: string
  bagNumber: number
  originalWeight: number
  deductionKg: 0 | 1 | 2
  adjustedWeight: number
  notes?: string
}

export interface FarmerInBill {
  _id: string
  name: string
  bags: Bag[]
  totalOriginalWeight: number
  totalAdjustedWeight: number
  farmerAmount: number
}

export interface BillDeductions {
  commission: number
  commissionType: "flat" | "percentage"
  transport: number
  labour: number
  loading: number
  weighing: number
  misc: number
}

export interface BillVersion {
  version: number
  data: Omit<Bill, "versions">
  modifiedBy: string
  modifiedAt: Date
}

export interface Bill {
  _id: string
  invoiceId: string
  buyerName: string
  farmers: FarmerInBill[]
  commodityId: string
  commodityName: string
  ratePer100Kg: number
  defaultDeductionPerBag: 0 | 1 | 2
  totalBagsCount: number
  totalOriginalWeight: number
  totalAdjustedWeight: number
  totalAmount: number
  deductions: BillDeductions
  finalPayable: number
  status: "draft" | "finalized" | "paid"
  createdBy: string
  createdAt: Date
  updatedAt: Date
  versions?: BillVersion[]
  // Legacy fields for backward compatibility
  sellerName?: string
  bagsCount?: number
  adjustedTotalWeight?: number
}

export interface AuditLog {
  _id: string
  entityType: "user" | "commodity" | "bill" | "bag" | "settings"
  entityId: string
  action: "create" | "update" | "delete" | "login" | "logout" | "failed_login"
  userId: string
  userName: string
  timestamp: Date
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface BackupMeta {
  _id: string
  backupId: string
  timestamp: Date
  type: "full" | "incremental"
  location: string
  verified: boolean
  checksums: Record<string, string>
  retentionUntil: Date
  sizeBytes?: number
  status: "pending" | "in_progress" | "completed" | "failed"
}

export interface Settings {
  _id: string
  deductionPerBagDefault: 0 | 1 | 2
  roundingMode: "floor" | "ceil" | "round"
  defaultRatePer100Kg: number
  backupPolicy: {
    fullBackupIntervalHours: number
    incrementalBackupIntervalMinutes: number
    retentionDays: number
    offsiteCopies: number
  }
  rtoMinutes: number
  rpoMinutes: number
}

// JWT Payload types
export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateBillInput {
  buyerName: string
  farmers: {
    name: string
    bags: { originalWeight: number; deductionKg?: 0 | 1 | 2; notes?: string }[]
  }[]
  commodityId: string
  ratePer100Kg: number
  defaultDeductionPerBag: 0 | 1 | 2
  deductions: BillDeductions
}

// Legacy single farmer input for backward compatibility
export interface CreateSingleFarmerBillInput {
  sellerName: string
  buyerName: string
  commodityId: string
  ratePer100Kg: number
  deductionPerBag: 0 | 1 | 2
  bags: { originalWeight: number; notes?: string }[]
  deductions: BillDeductions
}

export interface UpdateBillInput extends Partial<CreateBillInput> {
  status?: "draft" | "finalized" | "paid"
}
