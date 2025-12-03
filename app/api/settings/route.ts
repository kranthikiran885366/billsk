import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { getSettings, updateSettings, createAuditLog, findUserById } from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
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

    // Only admins can view settings
    if (payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const settings = await getSettings()

    if (!settings) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "Settings not found" } },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Only admins can update settings
    if (payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const currentSettings = await getSettings()

    if (!currentSettings) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "Settings not found" } },
        { status: 404 },
      )
    }

    // Validate inputs
    const updates: Record<string, unknown> = {}

    if (body.deductionPerBagDefault !== undefined) {
      if (![0, 1, 2].includes(body.deductionPerBagDefault)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Invalid deduction value (must be 0, 1, or 2)" },
          },
          { status: 400 },
        )
      }
      updates.deductionPerBagDefault = body.deductionPerBagDefault
    }

    if (body.roundingMode !== undefined) {
      if (!["floor", "ceil", "round"].includes(body.roundingMode)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid rounding mode" } },
          { status: 400 },
        )
      }
      updates.roundingMode = body.roundingMode
    }

    if (body.defaultRatePer100Kg !== undefined) {
      if (typeof body.defaultRatePer100Kg !== "number" || body.defaultRatePer100Kg < 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid default rate" } },
          { status: 400 },
        )
      }
      updates.defaultRatePer100Kg = body.defaultRatePer100Kg
    }

    const updatedSettings = await updateSettings(updates)

    // Audit log
    const user = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "settings",
      entityId: currentSettings._id,
      action: "update",
      userId: payload.userId,
      userName: user?.name || "Unknown",
      before: currentSettings as unknown as Record<string, unknown>,
      after: updatedSettings as unknown as Record<string, unknown>,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedSettings,
    })
  } catch (error) {
    console.error("Update settings error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
