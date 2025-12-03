import mongoose, { Schema, model, models } from "mongoose"
import type { Bill, BillDeductions, BillVersion } from "@/lib/types"

const BillDeductionsSchema = new Schema<BillDeductions>(
  {
    commission: { type: Number, required: true, default: 0 },
    commissionType: { type: String, enum: ["flat", "percentage"], default: "percentage" },
    transport: { type: Number, required: true, default: 0 },
    labour: { type: Number, required: true, default: 0 },
    loading: { type: Number, required: true, default: 0 },
    weighing: { type: Number, required: true, default: 0 },
    misc: { type: Number, required: true, default: 0 },
  },
  { _id: false },
)

const BillVersionSchema = new Schema<BillVersion>(
  {
    version: { type: Number, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    modifiedBy: { type: String, required: true },
    modifiedAt: { type: Date, required: true },
  },
  { _id: false },
)

const BillSchema = new Schema<Bill>(
  {
    _id: { type: String, required: true },
    invoiceId: { type: String, required: true },
    sellerName: { type: String, required: true, trim: true },
    buyerName: { type: String, required: true, trim: true },
    commodityId: { type: String, required: true, ref: "Commodity" },
    commodityName: { type: String, required: true },
    ratePer100Kg: { type: Number, required: true, min: 0 },
    deductionPerBag: { type: Number, enum: [0, 1, 2], required: true },
    bagsCount: { type: Number, required: true, min: 0 },
    originalTotalWeight: { type: Number, required: true, min: 0 },
    adjustedTotalWeight: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    deductions: { type: BillDeductionsSchema, required: true },
    finalPayable: { type: Number, required: true },
    status: { type: String, enum: ["draft", "finalized", "paid"], default: "draft" },
    createdBy: { type: String, required: true, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    versions: [BillVersionSchema],
  },
  {
    timestamps: true,
    _id: false,
  },
)

// Indexes
BillSchema.index({ invoiceId: 1 }, { unique: true })
BillSchema.index({ commodityId: 1 })
BillSchema.index({ status: 1 })
BillSchema.index({ createdAt: -1 })
BillSchema.index({ sellerName: "text", buyerName: "text", invoiceId: "text" })

export const BillModel = models.Bill || model<Bill>("Bill", BillSchema)
