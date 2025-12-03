import connectDB from "../config/database"
import { UserModel, CommodityModel, BillModel, BagModel, AuditLogModel, SettingsModel } from "../models"
import type { User, Commodity, Bill, Bag, AuditLog, Settings } from "@/lib/types"
import mongoose from "mongoose"

// Custom Error Classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DuplicateError"
  }
}

// User Service with Advanced Logic
export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    await connectDB()
    if (!email || typeof email !== "string") {
      throw new ValidationError("Invalid email provided")
    }
    return await UserModel.findOne({ email: email.toLowerCase().trim() }).lean()
  }

  static async findById(id: string): Promise<User | null> {
    await connectDB()
    if (!id) {
      throw new ValidationError("User ID is required")
    }
    const user = await UserModel.findOne({ _id: id }).lean()
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`)
    }
    return user
  }

  static async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    await connectDB()

    // Validate required fields
    if (!userData.email || !userData.name || !userData.passwordHash) {
      throw new ValidationError("Email, name, and password are required")
    }

    // Check for duplicate email
    const existing = await UserModel.findOne({ email: userData.email.toLowerCase() })
    if (existing) {
      throw new DuplicateError("User with this email already exists")
    }

    const newUser = new UserModel({
      ...userData,
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email.toLowerCase().trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newUser.save()
    return newUser.toObject()
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("User ID is required")
    }

    // Check if user exists
    const existing = await UserModel.findOne({ _id: id })
    if (!existing) {
      throw new NotFoundError(`User with ID ${id} not found`)
    }

    // If updating email, check for duplicates
    if (updates.email) {
      const duplicate = await UserModel.findOne({
        email: updates.email.toLowerCase(),
        _id: { $ne: id },
      })
      if (duplicate) {
        throw new DuplicateError("Email already in use by another user")
      }
      updates.email = updates.email.toLowerCase().trim()
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean()

    return updated
  }

  static async getAll(filters?: { role?: string; status?: string; search?: string }): Promise<User[]> {
    await connectDB()

    const query: any = {}

    if (filters?.role) {
      query.role = filters.role
    }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ]
    }

    return await UserModel.find(query).sort({ createdAt: -1 }).lean()
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB()

    if (!id) {
      throw new ValidationError("User ID is required")
    }

    // Check if user exists
    const user = await UserModel.findOne({ _id: id })
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`)
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await UserModel.countDocuments({ role: "admin" })
      if (adminCount <= 1) {
        throw new ValidationError("Cannot delete the last admin user")
      }
    }

    const result = await UserModel.deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  static async checkAccountLockout(userId: string): Promise<{ locked: boolean; until?: Date }> {
    await connectDB()
    const user = await UserModel.findOne({ _id: userId }).lean()

    if (!user) {
      throw new NotFoundError("User not found")
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { locked: true, until: user.lockedUntil }
    }

    return { locked: false }
  }

  static async incrementFailedAttempts(userId: string): Promise<void> {
    await connectDB()
    const user = await UserModel.findOne({ _id: userId })

    if (!user) {
      throw new NotFoundError("User not found")
    }

    const newAttempts = user.failedLoginAttempts + 1
    const updates: any = {
      failedLoginAttempts: newAttempts,
      updatedAt: new Date(),
    }

    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    }

    await UserModel.updateOne({ _id: userId }, updates)
  }

  static async resetFailedAttempts(userId: string): Promise<void> {
    await connectDB()
    await UserModel.updateOne(
      { _id: userId },
      {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
    )
  }
}

// Commodity Service with Advanced Logic
export class CommodityService {
  static async getAll(filters?: { search?: string; sortBy?: string }): Promise<Commodity[]> {
    await connectDB()

    const query: any = {}

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: "i" }
    }

    const sortOptions: any = {}
    if (filters?.sortBy === "name") {
      sortOptions.name = 1
    } else if (filters?.sortBy === "rate") {
      sortOptions.defaultRatePer100Kg = -1
    } else {
      sortOptions.createdAt = -1
    }

    return await CommodityModel.find(query).sort(sortOptions).lean()
  }

  static async findById(id: string): Promise<Commodity | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Commodity ID is required")
    }

    const commodity = await CommodityModel.findOne({ _id: id }).lean()
    if (!commodity) {
      throw new NotFoundError(`Commodity with ID ${id} not found`)
    }

    return commodity
  }

  static async findByName(name: string): Promise<Commodity | null> {
    await connectDB()
    return await CommodityModel.findOne({ name: { $regex: `^${name}$`, $options: "i" } }).lean()
  }

  static async create(data: Omit<Commodity, "_id" | "createdAt" | "updatedAt">): Promise<Commodity> {
    await connectDB()

    // Validate required fields
    if (!data.name || data.defaultRatePer100Kg === undefined || data.defaultDeductionPerBag === undefined) {
      throw new ValidationError("Name, rate, and deduction per bag are required")
    }

    if (data.defaultRatePer100Kg < 0) {
      throw new ValidationError("Rate cannot be negative")
    }

    // Check for duplicate name
    const existing = await this.findByName(data.name)
    if (existing) {
      throw new DuplicateError("Commodity with this name already exists")
    }

    const newCommodity = new CommodityModel({
      ...data,
      _id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newCommodity.save()
    return newCommodity.toObject()
  }

  static async update(id: string, updates: Partial<Commodity>): Promise<Commodity | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Commodity ID is required")
    }

    // Check if commodity exists
    const existing = await CommodityModel.findOne({ _id: id })
    if (!existing) {
      throw new NotFoundError(`Commodity with ID ${id} not found`)
    }

    // Validate rate if being updated
    if (updates.defaultRatePer100Kg !== undefined && updates.defaultRatePer100Kg < 0) {
      throw new ValidationError("Rate cannot be negative")
    }

    // Check for duplicate name if updating name
    if (updates.name) {
      const duplicate = await CommodityModel.findOne({
        name: { $regex: `^${updates.name}$`, $options: "i" },
        _id: { $ne: id },
      })
      if (duplicate) {
        throw new DuplicateError("Commodity with this name already exists")
      }
      updates.name = updates.name.trim()
    }

    const updated = await CommodityModel.findOneAndUpdate(
      { _id: id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean()

    return updated
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Commodity ID is required")
    }

    // Check if commodity exists
    const commodity = await CommodityModel.findOne({ _id: id })
    if (!commodity) {
      throw new NotFoundError(`Commodity with ID ${id} not found`)
    }

    // Check if commodity is used in any bills
    const billsCount = await BillModel.countDocuments({ commodityId: id })
    if (billsCount > 0) {
      throw new ValidationError("Cannot delete commodity that is used in bills")
    }

    const result = await CommodityModel.deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  static async getUsageStats(commodityId: string): Promise<{
    totalBills: number
    totalRevenue: number
    averageRate: number
  }> {
    await connectDB()

    const bills = await BillModel.find({ commodityId }).lean()

    return {
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + bill.finalPayable, 0),
      averageRate: bills.length > 0 ? bills.reduce((sum, bill) => sum + bill.ratePer100Kg, 0) / bills.length : 0,
    }
  }
}

// Bill Service with Advanced Logic and Transactions
export class BillService {
  static async getAll(filters?: {
    startDate?: Date
    endDate?: Date
    commodityId?: string
    status?: string
    search?: string
    sortBy?: string
    page?: number
    limit?: number
  }): Promise<{ bills: Bill[]; total: number; page: number; totalPages: number }> {
    await connectDB()

    const query: any = {}

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {}
      if (filters.startDate) query.createdAt.$gte = filters.startDate
      if (filters.endDate) query.createdAt.$lte = filters.endDate
    }

    if (filters?.commodityId) {
      query.commodityId = filters.commodityId
    }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.search) {
      query.$or = [
        { invoiceId: { $regex: filters.search, $options: "i" } },
        { sellerName: { $regex: filters.search, $options: "i" } },
        { buyerName: { $regex: filters.search, $options: "i" } },
      ]
    }

    // Sorting
    const sortOptions: any = {}
    switch (filters?.sortBy) {
      case "amount":
        sortOptions.finalPayable = -1
        break
      case "invoice":
        sortOptions.invoiceId = 1
        break
      case "seller":
        sortOptions.sellerName = 1
        break
      default:
        sortOptions.createdAt = -1
    }

    // Pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const [bills, total] = await Promise.all([
      BillModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      BillModel.countDocuments(query),
    ])

    return {
      bills,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async findById(id: string): Promise<Bill | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Bill ID is required")
    }

    const bill = await BillModel.findOne({ _id: id }).lean()
    if (!bill) {
      throw new NotFoundError(`Bill with ID ${id} not found`)
    }

    return bill
  }

  static async findByInvoiceId(invoiceId: string): Promise<Bill | null> {
    await connectDB()
    return await BillModel.findOne({ invoiceId }).lean()
  }

  static async create(data: Omit<Bill, "_id" | "createdAt" | "updatedAt">): Promise<Bill> {
    await connectDB()

    // Validate required fields
    if (
      !data.sellerName ||
      !data.buyerName ||
      !data.commodityId ||
      !data.invoiceId ||
      data.bagsCount === undefined
    ) {
      throw new ValidationError("All required fields must be provided")
    }

    if (data.bagsCount <= 0) {
      throw new ValidationError("Bags count must be greater than 0")
    }

    if (data.finalPayable < 0) {
      throw new ValidationError("Final payable cannot be negative")
    }

    // Check for duplicate invoice ID
    const existing = await this.findByInvoiceId(data.invoiceId)
    if (existing) {
      throw new DuplicateError("Bill with this invoice ID already exists")
    }

    // Verify commodity exists
    const commodity = await CommodityModel.findOne({ _id: data.commodityId })
    if (!commodity) {
      throw new NotFoundError(`Commodity with ID ${data.commodityId} not found`)
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const newBill = new BillModel({
        ...data,
        _id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sellerName: data.sellerName.trim(),
        buyerName: data.buyerName.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await newBill.save({ session })
      await session.commitTransaction()

      return newBill.toObject()
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async update(id: string, updates: Partial<Bill>): Promise<Bill | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Bill ID is required")
    }

    // Check if bill exists
    const existing = await BillModel.findOne({ _id: id })
    if (!existing) {
      throw new NotFoundError(`Bill with ID ${id} not found`)
    }

    // Don't allow updating finalized or paid bills to draft
    if (existing.status !== "draft" && updates.status === "draft") {
      throw new ValidationError("Cannot change finalized or paid bill back to draft")
    }

    // Check invoice ID uniqueness if updating
    if (updates.invoiceId && updates.invoiceId !== existing.invoiceId) {
      const duplicate = await BillModel.findOne({
        invoiceId: updates.invoiceId,
        _id: { $ne: id },
      })
      if (duplicate) {
        throw new DuplicateError("Bill with this invoice ID already exists")
      }
    }

    // Validate commodity if updating
    if (updates.commodityId && updates.commodityId !== existing.commodityId) {
      const commodity = await CommodityModel.findOne({ _id: updates.commodityId })
      if (!commodity) {
        throw new NotFoundError(`Commodity with ID ${updates.commodityId} not found`)
      }
    }

    const updated = await BillModel.findOneAndUpdate(
      { _id: id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean()

    return updated
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Bill ID is required")
    }

    // Check if bill exists
    const bill = await BillModel.findOne({ _id: id })
    if (!bill) {
      throw new NotFoundError(`Bill with ID ${id} not found`)
    }

    // Don't allow deleting paid bills
    if (bill.status === "paid") {
      throw new ValidationError("Cannot delete paid bills")
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // Delete associated bags
      await BagModel.deleteMany({ billId: id }, { session })

      // Delete bill
      await BillModel.deleteOne({ _id: id }, { session })

      await session.commitTransaction()
      return true
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async addVersion(billId: string, version: any): Promise<void> {
    await connectDB()
    await BillModel.findOneAndUpdate({ _id: billId }, { $push: { versions: version } })
  }

  static async getRevenue(filters?: {
    startDate?: Date
    endDate?: Date
    commodityId?: string
  }): Promise<{
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    billCount: number
  }> {
    await connectDB()

    const query: any = {}

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {}
      if (filters.startDate) query.createdAt.$gte = filters.startDate
      if (filters.endDate) query.createdAt.$lte = filters.endDate
    }

    if (filters?.commodityId) {
      query.commodityId = filters.commodityId
    }

    const bills = await BillModel.find(query).lean()

    return {
      totalRevenue: bills.reduce((sum, bill) => sum + bill.finalPayable, 0),
      paidRevenue: bills.filter((b) => b.status === "paid").reduce((sum, bill) => sum + bill.finalPayable, 0),
      pendingRevenue: bills.filter((b) => b.status !== "paid").reduce((sum, bill) => sum + bill.finalPayable, 0),
      billCount: bills.length,
    }
  }
}

// Bag Service with Advanced Logic
export class BagService {
  static async findByBillId(billId: string): Promise<Bag[]> {
    await connectDB()

    if (!billId) {
      throw new ValidationError("Bill ID is required")
    }

    return await BagModel.find({ billId }).sort({ bagNumber: 1 }).lean()
  }

  static async findById(id: string): Promise<Bag | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Bag ID is required")
    }

    const bag = await BagModel.findOne({ _id: id }).lean()
    if (!bag) {
      throw new NotFoundError(`Bag with ID ${id} not found`)
    }

    return bag
  }

  static async create(data: Omit<Bag, "_id">): Promise<Bag> {
    await connectDB()

    // Validate required fields
    if (!data.billId || data.bagNumber === undefined || data.originalWeight === undefined) {
      throw new ValidationError("Bill ID, bag number, and weight are required")
    }

    if (data.originalWeight <= 0) {
      throw new ValidationError("Weight must be greater than 0")
    }

    if (data.adjustedWeight < 0) {
      throw new ValidationError("Adjusted weight cannot be negative")
    }

    // Verify bill exists
    const bill = await BillModel.findOne({ _id: data.billId })
    if (!bill) {
      throw new NotFoundError(`Bill with ID ${data.billId} not found`)
    }

    // Check for duplicate bag number
    const existing = await BagModel.findOne({ billId: data.billId, bagNumber: data.bagNumber })
    if (existing) {
      throw new DuplicateError(`Bag number ${data.bagNumber} already exists for this bill`)
    }

    const newBag = new BagModel({
      ...data,
      _id: `bag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })

    await newBag.save()
    return newBag.toObject()
  }

  static async createBulk(bags: Omit<Bag, "_id">[]): Promise<Bag[]> {
    await connectDB()

    if (!bags || bags.length === 0) {
      throw new ValidationError("At least one bag is required")
    }

    // Validate all bags
    for (const bag of bags) {
      if (!bag.billId || bag.bagNumber === undefined || bag.originalWeight === undefined) {
        throw new ValidationError("All bags must have billId, bagNumber, and originalWeight")
      }
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const newBags = bags.map((bag) => ({
        ...bag,
        _id: `bag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }))

      const created = await BagModel.insertMany(newBags, { session })

      await session.commitTransaction()
      return created.map((b) => b.toObject())
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async update(id: string, updates: Partial<Bag>): Promise<Bag | null> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Bag ID is required")
    }

    // Check if bag exists
    const existing = await BagModel.findOne({ _id: id })
    if (!existing) {
      throw new NotFoundError(`Bag with ID ${id} not found`)
    }

    // Validate weights if updating
    if (updates.originalWeight !== undefined && updates.originalWeight <= 0) {
      throw new ValidationError("Weight must be greater than 0")
    }

    if (updates.adjustedWeight !== undefined && updates.adjustedWeight < 0) {
      throw new ValidationError("Adjusted weight cannot be negative")
    }

    // Check for duplicate bag number if updating
    if (updates.bagNumber !== undefined && updates.bagNumber !== existing.bagNumber) {
      const duplicate = await BagModel.findOne({
        billId: existing.billId,
        bagNumber: updates.bagNumber,
        _id: { $ne: id },
      })
      if (duplicate) {
        throw new DuplicateError(`Bag number ${updates.bagNumber} already exists for this bill`)
      }
    }

    const updated = await BagModel.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    }).lean()

    return updated
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB()

    if (!id) {
      throw new ValidationError("Bag ID is required")
    }

    const bag = await BagModel.findOne({ _id: id })
    if (!bag) {
      throw new NotFoundError(`Bag with ID ${id} not found`)
    }

    const result = await BagModel.deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  static async deleteByBillId(billId: string): Promise<number> {
    await connectDB()

    if (!billId) {
      throw new ValidationError("Bill ID is required")
    }

    const result = await BagModel.deleteMany({ billId })
    return result.deletedCount
  }

  static async getBillTotals(billId: string): Promise<{
    totalBags: number
    totalOriginalWeight: number
    totalAdjustedWeight: number
    averageWeight: number
  }> {
    await connectDB()

    const bags = await this.findByBillId(billId)

    const totalOriginalWeight = bags.reduce((sum, bag) => sum + bag.originalWeight, 0)
    const totalAdjustedWeight = bags.reduce((sum, bag) => sum + bag.adjustedWeight, 0)

    return {
      totalBags: bags.length,
      totalOriginalWeight,
      totalAdjustedWeight,
      averageWeight: bags.length > 0 ? totalOriginalWeight / bags.length : 0,
    }
  }
}

// Audit Log Service with Advanced Filtering
export class AuditLogService {
  static async create(data: Omit<AuditLog, "_id">): Promise<AuditLog> {
    await connectDB()

    // Validate required fields
    if (!data.entityType || !data.entityId || !data.action || !data.userId || !data.userName) {
      throw new ValidationError("All required audit log fields must be provided")
    }

    const newLog = new AuditLogModel({
      ...data,
      _id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    })

    await newLog.save()
    return newLog.toObject()
  }

  static async getAll(filters?: {
    entityType?: string
    entityId?: string
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    await connectDB()

    const query: any = {}

    if (filters?.entityType) query.entityType = filters.entityType
    if (filters?.entityId) query.entityId = filters.entityId
    if (filters?.userId) query.userId = filters.userId
    if (filters?.action) query.action = filters.action

    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {}
      if (filters.startDate) query.timestamp.$gte = filters.startDate
      if (filters.endDate) query.timestamp.$lte = filters.endDate
    }

    // Pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditLogModel.countDocuments(query),
    ])

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async findByEntityId(entityId: string): Promise<AuditLog[]> {
    await connectDB()

    if (!entityId) {
      throw new ValidationError("Entity ID is required")
    }

    return await AuditLogModel.find({ entityId }).sort({ timestamp: -1 }).limit(100).lean()
  }

  static async getUserActivity(userId: string, limit: number = 50): Promise<AuditLog[]> {
    await connectDB()

    if (!userId) {
      throw new ValidationError("User ID is required")
    }

    return await AuditLogModel.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean()
  }

  static async getStats(filters?: { startDate?: Date; endDate?: Date }): Promise<{
    totalLogs: number
    logsByAction: Array<{ action: string; count: number }>
    logsByEntityType: Array<{ entityType: string; count: number }>
    mostActiveUsers: Array<{ userId: string; userName: string; count: number }>
  }> {
    await connectDB()

    const query: any = {}

    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {}
      if (filters.startDate) query.timestamp.$gte = filters.startDate
      if (filters.endDate) query.timestamp.$lte = filters.endDate
    }

    const [totalLogs, logsByAction, logsByEntityType, mostActiveUsers] = await Promise.all([
      AuditLogModel.countDocuments(query),
      AuditLogModel.aggregate([
        { $match: query },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $project: { action: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      AuditLogModel.aggregate([
        { $match: query },
        { $group: { _id: "$entityType", count: { $sum: 1 } } },
        { $project: { entityType: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      AuditLogModel.aggregate([
        { $match: query },
        { $group: { _id: { userId: "$userId", userName: "$userName" }, count: { $sum: 1 } } },
        { $project: { userId: "$_id.userId", userName: "$_id.userName", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ])

    return {
      totalLogs,
      logsByAction,
      logsByEntityType,
      mostActiveUsers,
    }
  }

  static async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    await connectDB()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await AuditLogModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    })

    return result.deletedCount
  }
}

// Settings Service with Validation
export class SettingsService {
  static async get(): Promise<Settings | null> {
    await connectDB()
    let settings = await SettingsModel.findOne({ _id: "default" }).lean()

    if (!settings) {
      // Create default settings if not exists
      settings = await this.create({
        _id: "default",
        deductionPerBagDefault: 1,
        roundingMode: "round",
        defaultRatePer100Kg: 3000,
        backupPolicy: {
          fullBackupIntervalHours: 24,
          incrementalBackupIntervalMinutes: 60,
          retentionDays: 90,
          offsiteCopies: 2,
        },
        rtoMinutes: 60,
        rpoMinutes: 10,
      })
    }

    return settings
  }

  static async create(data: Settings): Promise<Settings> {
    await connectDB()

    // Validate settings
    if (data.defaultRatePer100Kg < 0) {
      throw new ValidationError("Default rate cannot be negative")
    }

    if (data.rtoMinutes < 0 || data.rpoMinutes < 0) {
      throw new ValidationError("RTO and RPO values must be non-negative")
    }

    if (data.backupPolicy.retentionDays < 1) {
      throw new ValidationError("Retention days must be at least 1")
    }

    const newSettings = new SettingsModel(data)
    await newSettings.save()
    return newSettings.toObject()
  }

  static async update(updates: Partial<Settings>): Promise<Settings | null> {
    await connectDB()

    // Validate updates
    if (updates.defaultRatePer100Kg !== undefined && updates.defaultRatePer100Kg < 0) {
      throw new ValidationError("Default rate cannot be negative")
    }

    if (updates.rtoMinutes !== undefined && updates.rtoMinutes < 0) {
      throw new ValidationError("RTO value must be non-negative")
    }

    if (updates.rpoMinutes !== undefined && updates.rpoMinutes < 0) {
      throw new ValidationError("RPO value must be non-negative")
    }

    if (updates.backupPolicy?.retentionDays !== undefined && updates.backupPolicy.retentionDays < 1) {
      throw new ValidationError("Retention days must be at least 1")
    }

    const updated = await SettingsModel.findOneAndUpdate({ _id: "default" }, updates, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean()

    return updated
  }

  static async reset(): Promise<Settings> {
    await connectDB()

    const defaultSettings = {
      _id: "default",
      deductionPerBagDefault: 1 as 0 | 1 | 2,
      roundingMode: "round" as "floor" | "ceil" | "round",
      defaultRatePer100Kg: 3000,
      backupPolicy: {
        fullBackupIntervalHours: 24,
        incrementalBackupIntervalMinutes: 60,
        retentionDays: 90,
        offsiteCopies: 2,
      },
      rtoMinutes: 60,
      rpoMinutes: 10,
    }

    const updated = await SettingsModel.findOneAndUpdate({ _id: "default" }, defaultSettings, {
      new: true,
      upsert: true,
    }).lean()

    return updated!
  }
}

// Refresh Token Service with MongoDB persistence
interface RefreshTokenData {
  _id: string
  userId: string
  tokenId: string
  expiresAt: Date
  createdAt: Date
}

const RefreshTokenSchema = new mongoose.Schema({
  _id: String,
  userId: String,
  tokenId: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
})

const RefreshTokenModel =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshTokenSchema)

export class TokenService {
  static async storeRefreshToken(tokenId: string, userId: string, expiresAt: Date): Promise<void> {
    await connectDB()

    const token = new RefreshTokenModel({
      _id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tokenId,
      expiresAt,
      createdAt: new Date(),
    })

    await token.save()
  }

  static async getRefreshToken(tokenId: string): Promise<RefreshTokenData | null> {
    await connectDB()

    if (!tokenId) {
      throw new ValidationError("Token ID is required")
    }

    const token = await RefreshTokenModel.findOne({ tokenId }).lean()

    // Check if token is expired
    if (token && new Date(token.expiresAt) < new Date()) {
      await this.revokeRefreshToken(tokenId)
      return null
    }

    return token
  }

  static async revokeRefreshToken(tokenId: string): Promise<void> {
    await connectDB()

    if (!tokenId) {
      throw new ValidationError("Token ID is required")
    }

    await RefreshTokenModel.deleteOne({ tokenId })
  }

  static async isTokenRevoked(tokenId: string): Promise<boolean> {
    await connectDB()

    if (!tokenId) {
      return true
    }

    const token = await RefreshTokenModel.findOne({ tokenId }).lean()
    return !token
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await connectDB()

    if (!userId) {
      throw new ValidationError("User ID is required")
    }

    await RefreshTokenModel.deleteMany({ userId })
  }

  static async cleanExpiredTokens(): Promise<number> {
    await connectDB()

    const result = await RefreshTokenModel.deleteMany({
      expiresAt: { $lt: new Date() },
    })

    return result.deletedCount
  }

  static async getUserTokens(userId: string): Promise<RefreshTokenData[]> {
    await connectDB()

    if (!userId) {
      throw new ValidationError("User ID is required")
    }

    return await RefreshTokenModel.find({ userId }).sort({ createdAt: -1 }).lean()
  }
}
