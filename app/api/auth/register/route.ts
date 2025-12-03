import { type NextRequest, NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { UserService } from "@/backend/services"
import { createUserSchema } from "@/lib/validation"
import { checkRateLimit } from "@/lib/rate-limit"
import type { ApiResponse } from "@/lib/types"

// WARNING: This endpoint is for initial setup only
// In production, consider:
// 1. Disabling this endpoint after first admin is created
// 2. Requiring an admin token to create new users
// 3. Using an environment variable to enable/disable registration

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for registration
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const rateLimit = checkRateLimit(ip, "login")
    
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
          },
        },
        { status: 429 }
      )
    }

    // Optional: Disable registration in production after initial setup
    if (process.env.DISABLE_REGISTRATION === "true") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "REGISTRATION_DISABLED",
            message: "Registration is disabled. Contact administrator.",
          },
        },
        { status: 403 }
      )
    }

    // Optional: Require registration key for additional security
    const registrationKey = request.headers.get("x-registration-key")
    if (process.env.REGISTRATION_KEY && registrationKey !== process.env.REGISTRATION_KEY) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_REGISTRATION_KEY",
            message: "Invalid registration key",
          },
        },
        { status: 403 }
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

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "A user with this email already exists",
          },
        },
        { status: 409 },
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const newUser = await UserService.create({
      name,
      email,
      passwordHash,
      role: role || "viewer",
      status: "active",
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = newUser

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: userWithoutPassword,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    )
  }
}
