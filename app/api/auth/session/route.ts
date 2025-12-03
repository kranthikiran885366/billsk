import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { findUserById } from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "NO_TOKEN",
            message: "No access token provided",
          },
        },
        { status: 401 },
      )
    }

    const payload = await verifyAccessToken(accessToken)

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired token",
          },
        },
        { status: 401 },
      )
    }

    const user = await findUserById(payload.userId)

    if (!user || user.status !== "active") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found or inactive",
          },
        },
        { status: 401 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 },
    )
  }
}
