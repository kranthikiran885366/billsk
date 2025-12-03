import mongoose, { Schema, model, models } from "mongoose"
import type { Commodity } from "@/lib/types"

const CommoditySchema = new Schema<Commodity>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    defaultRatePer100Kg: { type: Number, required: true, min: 0 },
    defaultDeductionPerBag: { type: Number, enum: [0, 1, 2], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    _id: false,
  },
)

// Indexes
CommoditySchema.index({ name: 1 }, { unique: true })

export const CommodityModel = models.Commodity || model<Commodity>("Commodity", CommoditySchema)
