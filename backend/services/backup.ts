import { BackupModel, BackupRecord } from "../models/Backup"
import { BillModel } from "../models/Bill"
import { CommodityModel } from "../models/Commodity"
import { UserModel } from "../models/User"
import { AuditLogModel } from "../models/AuditLog"
import { withTransaction } from "../config/replica-set"
import { generateSecureId } from "../../lib/security"
import { createAuditLog } from "../../lib/db"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups"

export class BackupService {
  static async createBackup(type: "full" | "incremental", userId: string): Promise<BackupRecord> {
    return withTransaction(async (session) => {
      const backupId = generateSecureId('backup_')
      const timestamp = new Date()
      const location = path.join(BACKUP_DIR, `${backupId}.json`)
      
      // Ensure backup directory exists
      await fs.mkdir(BACKUP_DIR, { recursive: true })
      
      const collections = type === "full" 
        ? ["bills", "commodities", "users", "auditLogs"]
        : ["bills"] // Incremental only backs up bills for now
      
      const backupData: Record<string, any> = {}
      const checksums: Record<string, string> = {}
      
      // Backup each collection
      for (const collection of collections) {
        const data = await this.backupCollection(collection, session)
        backupData[collection] = data
        checksums[collection] = this.generateChecksum(JSON.stringify(data))
      }
      
      // Write backup file
      const backupContent = JSON.stringify(backupData, null, 2)
      await fs.writeFile(location, backupContent)
      
      const sizeBytes = Buffer.byteLength(backupContent, 'utf8')
      const retentionUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      
      const backup: BackupRecord = {
        _id: `backup_${backupId}`,
        backupId,
        timestamp,
        type,
        status: "completed",
        location,
        sizeBytes,
        checksums,
        retentionUntil,
        verified: true,
        collections,
        createdBy: userId
      }
      
      await BackupModel.create([backup], { session })
      
      await createAuditLog({
        entityType: "settings",
        entityId: "backup_system",
        action: "create",
        userId,
        userName: "Backup System",
        after: { backupId, type, sizeBytes, collections }
      })
      
      return backup
    })
  }
  
  static async restoreBackup(backupId: string, userId: string): Promise<void> {
    return withTransaction(async (session) => {
      const backup = await BackupModel.findOne({ backupId }).session(session)
      if (!backup) throw new Error("Backup not found")
      
      const backupContent = await fs.readFile(backup.location, 'utf8')
      const backupData = JSON.parse(backupContent)
      
      // Verify checksums
      for (const [collection, data] of Object.entries(backupData)) {
        const expectedChecksum = backup.checksums[collection]
        const actualChecksum = this.generateChecksum(JSON.stringify(data))
        if (expectedChecksum !== actualChecksum) {
          throw new Error(`Checksum mismatch for collection: ${collection}`)
        }
      }
      
      // Restore collections
      for (const [collection, data] of Object.entries(backupData)) {
        await this.restoreCollection(collection, data as any[], session)
      }
      
      await createAuditLog({
        entityType: "settings",
        entityId: "backup_system",
        action: "update",
        userId,
        userName: "Backup System",
        after: { action: "restore", backupId }
      })
    })
  }
  
  private static async backupCollection(collection: string, session: any): Promise<any[]> {
    switch (collection) {
      case "bills":
        return await BillModel.find({}).session(session).lean()
      case "commodities":
        return await CommodityModel.find({}).session(session).lean()
      case "users":
        return await UserModel.find({}).session(session).lean()
      case "auditLogs":
        return await AuditLogModel.find({}).session(session).lean()
      default:
        return []
    }
  }
  
  private static async restoreCollection(collection: string, data: any[], session: any): Promise<void> {
    switch (collection) {
      case "bills":
        await BillModel.deleteMany({}, { session })
        if (data.length > 0) await BillModel.insertMany(data, { session })
        break
      case "commodities":
        await CommodityModel.deleteMany({}, { session })
        if (data.length > 0) await CommodityModel.insertMany(data, { session })
        break
      case "users":
        await UserModel.deleteMany({}, { session })
        if (data.length > 0) await UserModel.insertMany(data, { session })
        break
      case "auditLogs":
        await AuditLogModel.deleteMany({}, { session })
        if (data.length > 0) await AuditLogModel.insertMany(data, { session })
        break
    }
  }
  
  private static generateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }
  
  static async getBackupHistory(): Promise<BackupRecord[]> {
    return await BackupModel.find({}).sort({ timestamp: -1 }).lean()
  }
  
  static async deleteExpiredBackups(): Promise<void> {
    const expired = await BackupModel.find({ retentionUntil: { $lt: new Date() } })
    
    for (const backup of expired) {
      try {
        await fs.unlink(backup.location)
      } catch (error) {
        console.warn(`Failed to delete backup file: ${backup.location}`)
      }
      await BackupModel.deleteOne({ _id: backup._id })
    }
  }
}