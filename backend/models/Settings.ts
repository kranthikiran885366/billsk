import mongoose, { Schema, model, models } from "mongoose"
import type { Settings } from "@/lib/types"

const SettingsSchema = new Schema<Settings>(
  {
    _id: { type: String, required: true, default: "default" },
    deductionPerBagDefault: { type: Number, enum: [0, 1, 2], default: 1 },
    roundingMode: { type: String, enum: ["floor", "ceil", "round"], default: "round" },
    defaultRatePer100Kg: { type: Number, default: 3000, min: 0 },
    backupPolicy: {
      fullBackupIntervalHours: { type: Number, default: 24 },
      incrementalBackupIntervalMinutes: { type: Number, default: 60 },
      retentionDays: { type: Number, default: 30 },
      offsiteCopies: { type: Number, default: 2 },
    },
    rtoMinutes: { type: Number, default: 60 },
    rpoMinutes: { type: Number, default: 15 },
  },
  {
    _id: false,
  },
)

export const SettingsModel = models.Settings || model<Settings>("Settings", SettingsSchema)
