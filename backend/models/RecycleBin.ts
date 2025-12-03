import mongoose, { Schema, model, models } from "mongoose"

export interface RecycleBinItem {
  _id: string
  originalId: string
  entityType: "bill" | "commodity" | "user"
  entityData: Record<string, any>
  deletedBy: string
  deletedAt: Date
  restoreBy?: Date
  reason?: string
}

const RecycleBinSchema = new Schema<RecycleBinItem>({
  _id: { type: String, required: true },
  originalId: { type: String, required: true },
  entityType: { type: String, enum: ["bill", "commodity", "user"], required: true },
  entityData: { type: Schema.Types.Mixed, required: true },
  deletedBy: { type: String, required: true },
  deletedAt: { type: Date, required: true, default: Date.now },
  restoreBy: { type: Date },
  reason: { type: String }
}, {
  timestamps: true,
  _id: false
})

RecycleBinSchema.index({ deletedAt: -1 })
RecycleBinSchema.index({ entityType: 1, originalId: 1 })
RecycleBinSchema.index({ restoreBy: 1 })

export const RecycleBinModel = models.RecycleBin || model<RecycleBinItem>("RecycleBin", RecycleBinSchema)