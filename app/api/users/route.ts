import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken, hashPassword } from "@/lib/auth"
import { getAllUsers, createUser, createAuditLog, findUserById } from "@/lib/db"
import { createUserSchema } from "@/lib/validation"
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

    const users = await getAllUsers()

    // Remove password hashes from response
    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sanitizedUsers,
    })
  } catch (error) {
    console.error("Get users error:", error)
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
    const parsed = createUserSchema.safeParse(body)

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

    const { name, email, password, role } = parsed.data

    // Hash password
    const passwordHash = await hashPassword(password)

    const user = await createUser({
      name,
      email,
      passwordHash,
      role,
      status: "active",
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Audit log
    const adminUser = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "user",
      entityId: user._id,
      action: "create",
      userId: payload.userId,
      userName: adminUser?.name || "Unknown",
      after: { ...user, passwordHash: "[REDACTED]" },
    })

    // Remove password hash from response
    const { passwordHash: _, ...sanitizedUser } = user

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sanitizedUser,
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
