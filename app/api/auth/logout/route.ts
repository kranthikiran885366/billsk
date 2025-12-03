import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyRefreshToken } from "@/lib/auth"
import { revokeRefreshToken, createAuditLog, findUserById } from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value

    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken)
      if (payload) {
        // Revoke the refresh token
        await revokeRefreshToken(payload.tokenId)

        // Log logout
        const user = await findUserById(payload.userId)
        if (user) {
          await createAuditLog({
            entityType: "user",
            entityId: user._id,
            action: "logout",
            userId: user._id,
            userName: user.name,
            ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          })
        }
      }
    }

    // Clear cookies
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Logged out successfully" },
    })
  } catch (error) {
    console.error("Logout error:", error)
    // Still clear cookies on error
    const cookieStore = await cookies()
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Logged out" },
    })
  }
}
