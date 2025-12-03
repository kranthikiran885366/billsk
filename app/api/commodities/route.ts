import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { getAllCommodities, createCommodity, createAuditLog, findUserById } from "@/lib/db"
import { createCommoditySchema } from "@/lib/validation"
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

    const commodities = await getAllCommodities()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: commodities,
    })
  } catch (error) {
    console.error("Get commodities error:", error)
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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = createCommoditySchema.safeParse(body)

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

    const commodity = await createCommodity(parsed.data)

    // Audit log
    const user = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "commodity",
      entityId: commodity._id,
      action: "create",
      userId: payload.userId,
      userName: user?.name || "Unknown",
      after: commodity as unknown as Record<string, unknown>,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: commodity,
    })
  } catch (error) {
    console.error("Create commodity error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
