// Billing calculation logic
import type { BillDeductions } from "./types"

export interface BillingCalculation {
  originalTotalWeight: number
  adjustedTotalWeight: number
  totalAmount: number
  deductionsTotal: number
  finalPayable: number
  adjustedBags: { originalWeight: number; adjustedWeight: number }[]
}

/**
 * Calculate adjusted weight for a single bag
 * Rule: If bagWeight > 100kg, subtract deductionPerBag (0, 1, or 2 kg)
 */
export function calculateAdjustedBagWeight(originalWeight: number, deductionPerBag: 0 | 1 | 2): number {
  if (originalWeight > 100) {
    return originalWeight - deductionPerBag
  }
  return originalWeight
}

/**
 * Calculate total amount based on rate per 100kg
 * Formula: totalAmount = (adjustedTotalWeight / 100) * ratePer100Kg
 */
export function calculateTotalAmount(
  adjustedTotalWeight: number,
  ratePer100Kg: number,
  roundingMode: "floor" | "ceil" | "round" = "round",
): number {
  const rawAmount = (adjustedTotalWeight / 100) * ratePer100Kg

  switch (roundingMode) {
    case "floor":
      return Math.floor(rawAmount)
    case "ceil":
      return Math.ceil(rawAmount)
    case "round":
    default:
      return Math.round(rawAmount * 100) / 100
  }
}

/**
 * Calculate total deductions from bill
 */
export function calculateDeductionsTotal(totalAmount: number, deductions: BillDeductions): number {
  let total = 0

  // Commission (flat or percentage)
  if (deductions.commissionType === "percentage") {
    total += (totalAmount * deductions.commission) / 100
  } else {
    total += deductions.commission
  }

  // Fixed deductions
  total += deductions.transport
  total += deductions.labour
  total += deductions.loading
  total += deductions.weighing
  total += deductions.misc

  return Math.round(total * 100) / 100
}

/**
 * Calculate final payable amount
 * Formula: finalPayable = totalAmount - deductionsTotal
 */
export function calculateFinalPayable(totalAmount: number, deductionsTotal: number): number {
  return Math.round((totalAmount - deductionsTotal) * 100) / 100
}

/**
 * Full billing calculation
 */
export function calculateBilling(
  bags: { originalWeight: number }[],
  ratePer100Kg: number,
  deductionPerBag: 0 | 1 | 2,
  deductions: BillDeductions,
  roundingMode: "floor" | "ceil" | "round" = "round",
): BillingCalculation {
  // Calculate adjusted weights for each bag
  const adjustedBags = bags.map((bag) => ({
    originalWeight: bag.originalWeight,
    adjustedWeight: calculateAdjustedBagWeight(bag.originalWeight, deductionPerBag),
  }))

  // Calculate totals
  const originalTotalWeight = bags.reduce((sum, bag) => sum + bag.originalWeight, 0)
  const adjustedTotalWeight = adjustedBags.reduce((sum, bag) => sum + bag.adjustedWeight, 0)

  // Calculate amount based on rate per 100kg
  const totalAmount = calculateTotalAmount(adjustedTotalWeight, ratePer100Kg, roundingMode)

  // Calculate deductions
  const deductionsTotal = calculateDeductionsTotal(totalAmount, deductions)

  // Calculate final payable
  const finalPayable = calculateFinalPayable(totalAmount, deductionsTotal)

  return {
    originalTotalWeight,
    adjustedTotalWeight,
    totalAmount,
    deductionsTotal,
    finalPayable,
    adjustedBags,
  }
}

/**
 * Generate next invoice ID
 */
export function generateInvoiceId(prefix = "INV"): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}-${year}-${random}`
}

/**
 * Validate billing inputs
 */
export function validateBillingInputs(
  bags: { originalWeight: number }[],
  ratePer100Kg: number,
  deductionPerBag: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!bags || bags.length === 0) {
    errors.push("At least one bag is required")
  }

  if (bags.some((bag) => bag.originalWeight <= 0)) {
    errors.push("All bag weights must be greater than 0")
  }

  if (bags.some((bag) => bag.originalWeight > 500)) {
    errors.push("Bag weight cannot exceed 500kg")
  }

  if (ratePer100Kg <= 0) {
    errors.push("Rate per 100kg must be greater than 0")
  }

  if (![0, 1, 2].includes(deductionPerBag)) {
    errors.push("Deduction per bag must be 0, 1, or 2 kg")
  }

  return { valid: errors.length === 0, errors }
}
