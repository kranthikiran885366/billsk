import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { findUserById, updateUser, deleteUser, createAuditLog } from "@/lib/db"
import { updateUserSchema } from "@/lib/validation"
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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      )
    }

    const user = await findUserById(id)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      )
    }

    const { passwordHash, ...sanitizedUser } = user

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sanitizedUser,
    })
  } catch (error) {
    console.error("Get user error:", error)
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

    const user = await findUserById(id)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      )
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

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

    const updated = await updateUser(id, parsed.data)

    // Audit log
    const adminUser = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "user",
      entityId: id,
      action: "update",
      userId: payload.userId,
      userName: adminUser?.name || "Unknown",
      before: { ...user, passwordHash: "[REDACTED]" },
      after: { ...updated, passwordHash: "[REDACTED]" },
    })

    const { passwordHash, ...sanitizedUser } = updated!

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sanitizedUser,
    })
  } catch (error) {
    console.error("Update user error:", error)
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

    // Prevent self-deletion
    if (id === payload.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot delete your own account" } },
        { status: 403 },
      )
    }

    const user = await findUserById(id)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      )
    }

    await deleteUser(id)

    // Audit log
    const adminUser = await findUserById(payload.userId)
    await createAuditLog({
      entityType: "user",
      entityId: id,
      action: "delete",
      userId: payload.userId,
      userName: adminUser?.name || "Unknown",
      before: { ...user, passwordHash: "[REDACTED]" },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "User deleted successfully" },
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
