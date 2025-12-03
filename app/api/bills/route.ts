import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { getAllBills, createBill, getCommodityById, createBag, createAuditLog, findUserById } from "@/lib/db"
import { calculateBilling, generateInvoiceId } from "@/lib/billing"
import { billsQuerySchema, createBillSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = billsQuerySchema.safeParse(searchParams)

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters" } },
        { status: 400 },
      )
    }

    const { page, limit, startDate, endDate, commodityId, status, search } = parsed.data

    const bills = await getAllBills({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      commodityId: commodityId || undefined,
      status: status || undefined,
      search: search || undefined,
    })

    // Paginate
    const total = bills.length
    const totalPages = Math.ceil(total / limit)
    const paginatedBills = bills.slice((page - 1) * limit, page * limit)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        bills: paginatedBills,
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Get bills error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Only admins can create bills
    if (payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = createBillSchema.safeParse(body)

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

    // Get commodity info
    const commodity = await getCommodityById(data.commodityId)
    if (!commodity) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "Commodity not found" } },
        { status: 404 },
      )
    }

    // Calculate billing
    const calculation = calculateBilling(data.bags, data.ratePer100Kg, data.deductionPerBag, data.deductions)

    // Create bill
    const bill = await createBill({
      invoiceId: generateInvoiceId(data.sellerName),
      sellerName: data.sellerName,
      buyerName: data.buyerName,
      commodityId: data.commodityId,
      commodityName: commodity.name,
      ratePer100Kg: data.ratePer100Kg,
      deductionPerBag: data.deductionPerBag,
      bagsCount: data.bags.length,
      originalTotalWeight: calculation.originalTotalWeight,
      adjustedTotalWeight: calculation.adjustedTotalWeight,
      totalAmount: calculation.totalAmount,
      deductions: data.deductions,
      finalPayable: calculation.finalPayable,
      status: "draft",
      createdBy: payload.userId,
    })

    // Create bags
    for (let i = 0; i < data.bags.length; i++) {
      await createBag({
        billId: bill._id,
        bagNumber: i + 1,
        originalWeight: data.bags[i].originalWeight,
        adjustedWeight: calculation.adjustedBags[i].adjustedWeight,
        notes: data.bags[i].notes,
      })
    }

    // Audit log
    const user = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "bill",
      entityId: bill._id,
      action: "create",
      userId: payload.userId,
      userName: user?.name || "Unknown",
      after: bill as unknown as Record<string, unknown>,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: bill,
    })
  } catch (error) {
    console.error("Create bill error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
