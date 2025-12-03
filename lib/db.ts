// MongoDB connection and operations using Mongoose
import type { User, Commodity, Bill, Bag, AuditLog, Settings, BillVersion } from "./types"
import {
  UserService,
  CommodityService,
  BillService,
  BagService,
  AuditLogService,
  SettingsService,
  TokenService,
} from "@/backend/services"

// User operations
export async function findUserByEmail(email: string): Promise<User | null> {
  return await UserService.findByEmail(email)
}

export async function findUserById(id: string): Promise<User | null> {
  return await UserService.findById(id)
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  return await UserService.update(id, updates)
}

export async function createUser(user: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
  return await UserService.create(user)
}

export async function getAllUsers(): Promise<User[]> {
  return await UserService.getAll()
}

export async function deleteUser(id: string): Promise<boolean> {
  return await UserService.delete(id)
}

// Commodity operations
export async function getAllCommodities(): Promise<Commodity[]> {
  return await CommodityService.getAll()
}

export async function getCommodityById(id: string): Promise<Commodity | null> {
  return await CommodityService.findById(id)
}

export async function createCommodity(
  commodity: Omit<Commodity, "_id" | "createdAt" | "updatedAt">,
): Promise<Commodity> {
  return await CommodityService.create(commodity)
}

export async function updateCommodity(id: string, updates: Partial<Commodity>): Promise<Commodity | null> {
  return await CommodityService.update(id, updates)
}

export async function deleteCommodity(id: string): Promise<boolean> {
  return await CommodityService.delete(id)
}

// Bill operations
export async function getAllBills(filters?: {
  startDate?: Date
  endDate?: Date
  commodityId?: string
  status?: string
  search?: string
}): Promise<Bill[]> {
  const result = await BillService.getAll(filters)
  return result.bills
}

export async function getBillsPaginated(filters?: {
  startDate?: Date
  endDate?: Date
  commodityId?: string
  status?: string
  search?: string
  sortBy?: string
  page?: number
  limit?: number
}): Promise<{ bills: Bill[]; total: number; page: number; totalPages: number }> {
  return await BillService.getAll(filters)
}

export async function getBillById(id: string): Promise<Bill | null> {
  return await BillService.findById(id)
}

export async function createBill(bill: Omit<Bill, "_id" | "createdAt" | "updatedAt">): Promise<Bill> {
  return await BillService.create(bill)
}

export async function updateBill(id: string, updates: Partial<Bill>): Promise<Bill | null> {
  const bill = await BillService.findById(id)
  if (!bill) return null

  // Store version history
  const version: BillVersion = {
    version: (bill.versions?.length || 0) + 1,
    data: { ...bill, versions: undefined },
    modifiedBy: updates.createdBy || bill.createdBy,
    modifiedAt: new Date(),
  }

  await BillService.addVersion(id, version)
  return await BillService.update(id, updates)
}

export async function deleteBill(id: string): Promise<boolean> {
  // Also delete associated bags
  await BagService.deleteByBillId(id)
  return await BillService.delete(id)
}

// Bag operations
export async function getBagsByBillId(billId: string): Promise<Bag[]> {
  return await BagService.findByBillId(billId)
}

export async function createBag(bag: Omit<Bag, "_id">): Promise<Bag> {
  return await BagService.create(bag)
}

export async function updateBag(id: string, updates: Partial<Bag>): Promise<Bag | null> {
  return await BagService.update(id, updates)
}

export async function deleteBag(id: string): Promise<boolean> {
  return await BagService.delete(id)
}

export async function deleteBagsByBillId(billId: string): Promise<void> {
  await BagService.deleteByBillId(billId)
}

// Audit log operations
export async function createAuditLog(log: Omit<AuditLog, "_id" | "timestamp">): Promise<AuditLog> {
  return await AuditLogService.create(log)
}

export async function getAuditLogs(filters?: {
  entityType?: string
  entityId?: string
  userId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<{ logs: AuditLog[]; total: number }> {
  const logs = await AuditLogService.getAll({
    entityType: filters?.entityType,
    entityId: filters?.entityId,
    userId: filters?.userId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  })

  const total = logs.length
  let paginatedLogs = [...logs]

  if (filters?.offset) {
    paginatedLogs = paginatedLogs.slice(filters.offset)
  }
  if (filters?.limit) {
    paginatedLogs = paginatedLogs.slice(0, filters.limit)
  }

  return { logs: paginatedLogs, total }
}

// Settings operations
export async function getSettings(): Promise<Settings | null> {
  return await SettingsService.get()
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings | null> {
  return await SettingsService.update(updates)
}

// Refresh token operations
export async function storeRefreshToken(userId: string, tokenId: string, expiresAt: Date): Promise<void> {
  await TokenService.storeRefreshToken(tokenId, userId, expiresAt)
}

export async function getRefreshToken(
  tokenId: string,
): Promise<{ userId: string; tokenId: string; expiresAt: Date } | null> {
  return await TokenService.getRefreshToken(tokenId)
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await TokenService.revokeRefreshToken(tokenId)
}

export async function isTokenRevoked(tokenId: string): Promise<boolean> {
  return await TokenService.isTokenRevoked(tokenId)
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await TokenService.revokeAllUserTokens(userId)
}

// Dashboard stats
export async function getDashboardStats(): Promise<{
  totalBills: number
  totalRevenue: number
  pendingAmount: number
  totalCommodities: number
  recentBills: Bill[]
  billsByStatus: { status: string; count: number }[]
}> {
  try {
    const billsResult = await BillService.getAll()
    const commodities = await CommodityService.getAll()

    const bills = billsResult.bills || []
    const totalBills = bills.length
    const totalRevenue = bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + (b.finalPayable || 0), 0)
    const pendingAmount = bills.filter((b) => b.status !== "paid").reduce((sum, b) => sum + (b.finalPayable || 0), 0)

    const billsByStatus = [
      { status: "draft", count: bills.filter((b) => b.status === "draft").length },
      { status: "finalized", count: bills.filter((b) => b.status === "finalized").length },
      { status: "paid", count: bills.filter((b) => b.status === "paid").length },
    ]

    const recentBills = bills.slice(0, 5)

    return {
      totalBills,
      totalRevenue,
      pendingAmount,
      totalCommodities: commodities.length,
      recentBills,
      billsByStatus,
    }
  } catch (error) {
    console.error("Dashboard stats error:", error)
    // Return default values if there's an error
    return {
      totalBills: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      totalCommodities: 0,
      recentBills: [],
      billsByStatus: [
        { status: "draft", count: 0 },
        { status: "finalized", count: 0 },
        { status: "paid", count: 0 },
      ],
    }
  }
}
