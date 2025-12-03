import mongoose, { Schema, model, models } from "mongoose"
import type { User } from "@/lib/types"

const UserSchema = new Schema<User>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "viewer"], required: true },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    trustedDevices: [{
      deviceId: String,
      ip: String,
      userAgent: String,
      lastUsed: { type: Date, default: Date.now }
    }],
    loginHistory: [{
      ip: String,
      userAgent: String,
      timestamp: { type: Date, default: Date.now },
      success: Boolean
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    _id: false, // We're using custom _id
  },
)

// Indexes
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ status: 1 })
UserSchema.index({ role: 1 })

// Export model
export const UserModel = models.User || model<User>("User", UserSchema)
