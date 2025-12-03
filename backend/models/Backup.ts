import mongoose, { Schema, model, models } from "mongoose"

export interface BackupRecord {
  _id: string
  backupId: string
  timestamp: Date
  type: "full" | "incremental"
  status: "pending" | "in_progress" | "completed" | "failed"
  location: string
  sizeBytes: number
  checksums: Record<string, string>
  retentionUntil: Date
  verified: boolean
  collections: string[]
  createdBy: string
}

const BackupSchema = new Schema<BackupRecord>({
  _id: { type: String, required: true },
  backupId: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ["full", "incremental"], required: true },
  status: { type: String, enum: ["pending", "in_progress", "completed", "failed"], default: "pending" },
  location: { type: String, required: true },
  sizeBytes: { type: Number, required: true, default: 0 },
  checksums: { type: Schema.Types.Mixed, required: true, default: {} },
  retentionUntil: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  collections: [{ type: String }],
  createdBy: { type: String, required: true }
}, {
  timestamps: true,
  _id: false
})

BackupSchema.index({ timestamp: -1 })
BackupSchema.index({ type: 1, status: 1 })
BackupSchema.index({ retentionUntil: 1 })

export const BackupModel = models.Backup || model<BackupRecord>("Backup", BackupSchema)