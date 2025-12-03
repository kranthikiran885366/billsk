import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { getAuditLogs } from "@/lib/db"
import { auditLogsQuerySchema } from "@/lib/validation"
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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = auditLogsQuerySchema.safeParse(searchParams)

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters" } },
        { status: 400 },
      )
    }

    const { page, limit, entityType, entityId, userId, action, startDate, endDate } = parsed.data

    const { logs, total } = await getAuditLogs({
      entityType: entityType as "user" | "commodity" | "bill" | "bag" | "settings" | undefined,
      entityId,
      userId,
      action: action as "create" | "update" | "delete" | "login" | "logout" | "failed_login" | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset: (page - 1) * limit,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
