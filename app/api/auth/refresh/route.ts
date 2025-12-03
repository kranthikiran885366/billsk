import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyRefreshToken, generateAccessToken, generateRefreshToken, generateTokenId } from "@/lib/auth"
import { getRefreshToken, isTokenRevoked, revokeRefreshToken, storeRefreshToken, findUserById } from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "NO_REFRESH_TOKEN",
            message: "No refresh token provided",
          },
        },
        { status: 401 },
      )
    }

    const payload = await verifyRefreshToken(refreshToken)

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "Invalid or expired refresh token",
          },
        },
        { status: 401 },
      )
    }

    // Check if token is revoked
    if (await isTokenRevoked(payload.tokenId)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "TOKEN_REVOKED",
            message: "Refresh token has been revoked",
          },
        },
        { status: 401 },
      )
    }

    // Get stored token
    const storedToken = await getRefreshToken(payload.tokenId)
    if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Refresh token has expired",
          },
        },
        { status: 401 },
      )
    }

    // Get user
    const user = await findUserById(payload.userId)
    if (!user || user.status !== "active") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "USER_INVALID",
            message: "User not found or inactive",
          },
        },
        { status: 401 },
      )
    }

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(payload.tokenId)

    // Generate new tokens
    const newAccessToken = await generateAccessToken(user)
    const newTokenId = generateTokenId()
    const newRefreshToken = await generateRefreshToken(user._id, newTokenId)

    // Store new refresh token
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await storeRefreshToken(user._id, newTokenId, refreshExpiry)

    // Set new cookies
    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    })

    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Tokens refreshed successfully" },
    })
  } catch (error) {
    console.error("Token refresh error:", error)
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
