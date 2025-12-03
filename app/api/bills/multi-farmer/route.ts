import { NextRequest, NextResponse } from "next/server"
import { createBill, createBag, getCommodityById, createAuditLog } from "@/lib/db"
import { generateSecureId } from "@/lib/security"
import type { CreateBillInput, Bill, FarmerInBill, Bag } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: CreateBillInput = await request.json()
    
    // Validate input
    if (!body.buyerName || !body.commodityId || !body.farmers || body.farmers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Buyer name, commodity, and at least one farmer are required"
          }
        },
        { status: 400 }
      )
    }

    // Validate farmers have names and bags
    for (const farmer of body.farmers) {
      if (!farmer.name || !farmer.bags || farmer.bags.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Each farmer must have a name and at least one bag"
            }
          },
          { status: 400 }
        )
      }
    }

    // Get commodity details
    const commodity = await getCommodityById(body.commodityId)
    if (!commodity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Commodity not found"
          }
        },
        { status: 404 }
      )
    }

    // Calculate totals and create farmer data
    const farmers: FarmerInBill[] = []
    let totalBagsCount = 0
    let totalOriginalWeight = 0
    let totalAdjustedWeight = 0

    for (const farmerInput of body.farmers) {
      const farmerId = generateSecureId("farmer_")
      const farmerBags: Bag[] = []
      let farmerOriginalWeight = 0
      let farmerAdjustedWeight = 0

      // Process bags for this farmer
      for (let i = 0; i < farmerInput.bags.length; i++) {
        const bagInput = farmerInput.bags[i]
        const deductionKg = bagInput.deductionKg ?? body.defaultDeductionPerBag
        const adjustedWeight = Math.max(0, bagInput.originalWeight - deductionKg)

        const bag: Bag = {
          _id: generateSecureId("bag_"),
          billId: "", // Will be set after bill creation
          farmerId,
          bagNumber: i + 1,
          originalWeight: bagInput.originalWeight,
          deductionKg,
          adjustedWeight,
          notes: bagInput.notes || ""
        }

        farmerBags.push(bag)
        farmerOriginalWeight += bagInput.originalWeight
        farmerAdjustedWeight += adjustedWeight
        totalBagsCount++
      }

      totalOriginalWeight += farmerOriginalWeight
      totalAdjustedWeight += farmerAdjustedWeight

      // Calculate farmer's portion of the amount
      const farmerAmount = (farmerAdjustedWeight / 100) * body.ratePer100Kg

      farmers.push({
        _id: farmerId,
        name: farmerInput.name,
        bags: farmerBags,
        totalOriginalWeight: farmerOriginalWeight,
        totalAdjustedWeight: farmerAdjustedWeight,
        farmerAmount
      })
    }

    // Calculate bill totals
    const totalAmount = (totalAdjustedWeight / 100) * body.ratePer100Kg
    const totalDeductions = Object.values(body.deductions).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    )
    const finalPayable = totalAmount - totalDeductions

    // Create bill
    const billData: Omit<Bill, "_id" | "createdAt" | "updatedAt"> = {
      invoiceId: `INV-${Date.now()}`,
      buyerName: body.buyerName,
      farmers,
      commodityId: body.commodityId,
      commodityName: commodity.name,
      ratePer100Kg: body.ratePer100Kg,
      defaultDeductionPerBag: body.defaultDeductionPerBag,
      totalBagsCount,
      totalOriginalWeight,
      totalAdjustedWeight,
      totalAmount,
      deductions: body.deductions,
      finalPayable,
      status: "draft",
      createdBy: "admin", // TODO: Get from auth context
      // Legacy fields for backward compatibility
      sellerName: farmers.map(f => f.name).join(", "),
      bagsCount: totalBagsCount,
      adjustedTotalWeight: totalAdjustedWeight
    }

    const bill = await createBill(billData)

    // Update bag billIds and create them
    for (const farmer of farmers) {
      for (const bag of farmer.bags) {
        bag.billId = bill._id
        await createBag(bag)
      }
    }

    // Create audit log
    await createAuditLog({
      entityType: "bill",
      entityId: bill._id,
      action: "create",
      userId: "admin", // TODO: Get from auth context
      userName: "Admin",
      after: {
        type: "multi-farmer",
        buyerName: bill.buyerName,
        farmersCount: farmers.length,
        totalBags: totalBagsCount,
        totalAmount: finalPayable
      }
    })

    return NextResponse.json({
      success: true,
      data: bill
    })

  } catch (error) {
    console.error("Multi-farmer bill creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create multi-farmer bill"
        }
      },
      { status: 500 }
    )
  }
}