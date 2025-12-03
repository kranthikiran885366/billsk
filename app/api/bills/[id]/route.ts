import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import {
  getBillById,
  updateBill,
  deleteBill,
  getCommodityById,
  createAuditLog,
  findUserById,
  deleteBagsByBillId,
  createBag,
} from "@/lib/db"
import { calculateBilling } from "@/lib/billing"
import { updateBillSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      )
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid token" } },
        { status: 401 },
      )
    }

    const bill = await getBillById(id)
    if (!bill) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "Bill not found" } },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: bill,
    })
  } catch (error) {
    console.error("Get bill error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      )
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const bill = await getBillById(id)
    if (!bill) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "Bill not found" } },
        { status: 404 },
      )
    }

    const body = await request.json()
    const parsed = updateBillSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten().fieldErrors as Record<string, string[]>,
          },
        },
        { status: 400 },
      )
    }

    const data = parsed.data
    const updates: Record<string, unknown> = {}

    if (data.sellerName) updates.sellerName = data.sellerName
    if (data.buyerName) updates.buyerName = data.buyerName
    if (data.status) updates.status = data.status

    // If bags or rates are updated, recalculate
    if (data.bags || data.ratePer100Kg !== undefined || data.deductionPerBag !== undefined || data.deductions) {
      const bags = data.bags || []
      const ratePer100Kg = data.ratePer100Kg ?? bill.ratePer100Kg
      const deductionPerBag = data.deductionPerBag ?? bill.deductionPerBag
      const deductions = data.deductions || bill.deductions

      if (data.bags) {
        const calculation = calculateBilling(bags, ratePer100Kg, deductionPerBag, deductions)

        updates.bagsCount = bags.length
        updates.originalTotalWeight = calculation.originalTotalWeight
        updates.adjustedTotalWeight = calculation.adjustedTotalWeight
        updates.totalAmount = calculation.totalAmount
        updates.finalPayable = calculation.finalPayable
        updates.ratePer100Kg = ratePer100Kg
        updates.deductionPerBag = deductionPerBag
        updates.deductions = deductions

        // Update bags
        await deleteBagsByBillId(id)
        for (let i = 0; i < bags.length; i++) {
          await createBag({
            billId: id,
            bagNumber: i + 1,
            originalWeight: bags[i].originalWeight,
            adjustedWeight: calculation.adjustedBags[i].adjustedWeight,
            notes: bags[i].notes,
          })
        }
      }

      if (data.commodityId) {
        const commodity = await getCommodityById(data.commodityId)
        if (commodity) {
          updates.commodityId = data.commodityId
          updates.commodityName = commodity.name
        }
      }
    }

    const updatedBill = await updateBill(id, updates as Parameters<typeof updateBill>[1])

    // Audit log
    const user = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "bill",
      entityId: id,
      action: "update",
      userId: payload.userId,
      userName: user?.name || "Unknown",
      before: bill as unknown as Record<string, unknown>,
      after: updatedBill as unknown as Record<string, unknown>,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedBill,
    })
  } catch (error) {
    console.error("Update bill error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      )
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const bill = await getBillById(id)
    if (!bill) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "Bill not found" } },
        { status: 404 },
      )
    }

    await deleteBill(id)

    // Audit log
    const user = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "bill",
      entityId: id,
      action: "delete",
      userId: payload.userId,
      userName: user?.name || "Unknown",
      before: bill as unknown as Record<string, unknown>,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Bill deleted successfully" },
    })
  } catch (error) {
    console.error("Delete bill error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
