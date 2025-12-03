import mongoose, { Schema, model, models } from "mongoose"
import type { Bag } from "@/lib/types"

const BagSchema = new Schema<Bag>(
  {
    _id: { type: String, required: true },
    billId: { type: String, required: true, ref: "Bill" },
    bagNumber: { type: Number, required: true },
    originalWeight: { type: Number, required: true, min: 0 },
    adjustedWeight: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  {
    _id: false,
  },
)

// Indexes
BagSchema.index({ billId: 1 })
BagSchema.index({ billId: 1, bagNumber: 1 }, { unique: true })

export const BagModel = models.Bag || model<Bag>("Bag", BagSchema)
