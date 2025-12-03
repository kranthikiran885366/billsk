import { RecycleBinModel, RecycleBinItem } from "../models/RecycleBin"
import { BillModel } from "../models/Bill"
import { CommodityModel } from "../models/Commodity"
import { UserModel } from "../models/User"
import { withTransaction } from "../config/replica-set"
import { generateSecureId } from "../../lib/security"
import { createAuditLog } from "../../lib/db"

export class RecycleBinService {
  static async softDelete(
    entityType: "bill" | "commodity" | "user",
    entityId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    return withTransaction(async (session) => {
      let entityData: any
      
      // Get the entity data before deletion
      switch (entityType) {
        case "bill":
          entityData = await BillModel.findOne({ _id: entityId }).session(session).lean()
          if (entityData) await BillModel.deleteOne({ _id: entityId }, { session })
          break
        case "commodity":
          entityData = await CommodityModel.findOne({ _id: entityId }).session(session).lean()
          if (entityData) await CommodityModel.deleteOne({ _id: entityId }, { session })
          break
        case "user":
          entityData = await UserModel.findOne({ _id: entityId }).session(session).lean()
          if (entityData) await UserModel.deleteOne({ _id: entityId }, { session })
          break
      }
      
      if (!entityData) throw new Error(`${entityType} not found`)
      
      // Store in recycle bin
      const recycleBinItem: RecycleBinItem = {
        _id: generateSecureId('recycle_'),
        originalId: entityId,
        entityType,
        entityData,
        deletedBy: userId,
        deletedAt: new Date(),
        restoreBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        reason
      }
      
      await RecycleBinModel.create([recycleBinItem], { session })
      
      await createAuditLog({
        entityType: "settings",
        entityId: "recycle_bin",
        action: "create",
        userId,
        userName: "Recycle Bin",
        after: { action: "soft_delete", entityType, originalId: entityId, reason }
      })
    })
  }
  
  static async restore(recycleBinId: string, userId: string): Promise<void> {
    return withTransaction(async (session) => {
      const item = await RecycleBinModel.findOne({ _id: recycleBinId }).session(session)
      if (!item) throw new Error("Recycle bin item not found")
      
      // Restore the entity
      switch (item.entityType) {
        case "bill":
          await BillModel.create([item.entityData], { session })
          break
        case "commodity":
          await CommodityModel.create([item.entityData], { session })
          break
        case "user":
          await UserModel.create([item.entityData], { session })
          break
      }
      
      // Remove from recycle bin
      await RecycleBinModel.deleteOne({ _id: recycleBinId }, { session })
      
      await createAuditLog({
        entityType: "settings",
        entityId: "recycle_bin",
        action: "update",
        userId,
        userName: "Recycle Bin",
        after: { action: "restore", entityType: item.entityType, originalId: item.originalId }
      })
    })
  }
  
  static async getRecycleBinItems(): Promise<RecycleBinItem[]> {
    return await RecycleBinModel.find({}).sort({ deletedAt: -1 }).lean()
  }
  
  static async permanentDelete(recycleBinId: string, userId: string): Promise<void> {
    const item = await RecycleBinModel.findOneAndDelete({ _id: recycleBinId })
    if (!item) throw new Error("Recycle bin item not found")
    
    await createAuditLog({
      entityType: "settings",
      entityId: "recycle_bin",
      action: "delete",
      userId,
      userName: "Recycle Bin",
      after: { action: "permanent_delete", entityType: item.entityType, originalId: item.originalId }
    })
  }
  
  static async cleanupExpired(): Promise<void> {
    const expired = await RecycleBinModel.find({ restoreBy: { $lt: new Date() } })
    
    for (const item of expired) {
      await RecycleBinModel.deleteOne({ _id: item._id })
      
      await createAuditLog({
        entityType: "settings",
        entityId: "recycle_bin",
        action: "delete",
        userId: "system",
        userName: "System Cleanup",
        after: { action: "auto_cleanup", entityType: item.entityType, originalId: item.originalId }
      })
    }
  }
}