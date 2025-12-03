import mongoose, { Schema, model, models } from "mongoose"
import type { AuditLog } from "@/lib/types"

const AuditLogSchema = new Schema<AuditLog>(
  {
    _id: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["user", "commodity", "bill", "bag", "settings"],
      required: true,
    },
    entityId: { type: String, required: true },
    action: {
      type: String,
      enum: ["create", "update", "delete", "login", "logout", "failed_login"],
      required: true,
    },
    userId: { type: String, required: true, ref: "User" },
    userName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    _id: false,
  },
)

// Indexes
AuditLogSchema.index({ entityType: 1, entityId: 1 })
AuditLogSchema.index({ userId: 1 })
AuditLogSchema.index({ timestamp: -1 })
AuditLogSchema.index({ action: 1 })

export const AuditLogModel = models.AuditLog || model<AuditLog>("AuditLog", AuditLogSchema)
