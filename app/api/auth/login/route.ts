import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loginSchema, sanitizeEmail } from "@/lib/validation"
import { findUserByEmail, updateUser, createAuditLog, storeRefreshToken } from "@/lib/db"
import { verifyPassword, generateAccessToken, generateRefreshToken, generateTokenId } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { generateAdvancedFingerprint, logSecurityEvent, checkAccountLockout, recordFailedAttempt, clearFailedAttempts, getSecurityHeaders } from "@/lib/security"
import type { ApiResponse } from "@/lib/types"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Enhanced security tracking
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const identifier = `login:${ip}`

    // Enhanced account lockout check
    const lockoutStatus = checkAccountLockout(identifier)
    if (lockoutStatus.locked) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: `Account locked. Try again in ${lockoutStatus.remainingTime} seconds.`,
          },
        },
        { 
          status: 429,
          headers: getSecurityHeaders()
        },
      )
    }

    // Check rate limit
    const rateLimit = checkRateLimit(ip, "login")
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        },
      )
    }

    // Parse and validate input with enhanced security
    const body = await request.json()
    const { deviceFingerprint: clientFingerprint, authMethod } = body
    const parsed = loginSchema.safeParse(body)

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

    const email = sanitizeEmail(parsed.data.email)
    const { password } = parsed.data

    // Debug logging
    console.log('Login attempt:', { email, passwordLength: password?.length })

    // Find user
    const user = await findUserByEmail(email)

    if (!user) {
      console.log('User not found:', email)
      recordFailedAttempt(identifier)
      // Enhanced security logging
      await logSecurityEvent("LOGIN_FAILED", "unknown", "Unknown", {
        email,
        reason: "user_not_found",
        deviceFingerprint: clientFingerprint || 'unknown',
        authMethod: authMethod || 'password'
      }, request)

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { 
          status: 401,
          headers: getSecurityHeaders()
        },
      )
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMs = new Date(user.lockedUntil).getTime() - Date.now()
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: `Account is locked. Please try again in ${Math.ceil(remainingMs / 60000)} minutes.`,
          },
        },
        { status: 423 },
      )
    }

    // Check if account is active
    if (user.status !== "active") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "Your account has been deactivated. Please contact an administrator.",
          },
        },
        { status: 403 },
      )
    }

    // Verify password
    console.log('Verifying password for user:', user.email)
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    console.log('Password valid:', isValidPassword)

    if (!isValidPassword) {
      recordFailedAttempt(identifier)
      
      // Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1
      const updates: Record<string, unknown> = {
        failedLoginAttempts: newFailedAttempts,
      }

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
      }

      await updateUser(user._id, updates as Parameters<typeof updateUser>[1])

      // Enhanced security logging
      await logSecurityEvent("LOGIN_FAILED", user._id, user.name, {
        email,
        reason: "invalid_password",
        failedAttempts: newFailedAttempts,
        deviceFingerprint: clientFingerprint || 'unknown',
        authMethod: authMethod || 'password'
      }, request)

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              newFailedAttempts >= MAX_FAILED_ATTEMPTS
                ? "Account locked due to too many failed attempts"
                : `Invalid email or password. ${MAX_FAILED_ATTEMPTS - newFailedAttempts} attempts remaining.`,
          },
        },
        { 
          status: 401,
          headers: getSecurityHeaders()
        },
      )
    }

    // Clear failed attempts and reset user status
    clearFailedAttempts(identifier)
    await updateUser(user._id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLogin: new Date(),
    })

    // Generate tokens
    const accessToken = await generateAccessToken(user)
    const tokenId = generateTokenId()
    const refreshToken = await generateRefreshToken(user._id, tokenId)

    // Store refresh token
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await storeRefreshToken(user._id, tokenId, refreshExpiry)

    // Enhanced security logging for successful login
    await logSecurityEvent("LOGIN_SUCCESS", user._id, user.name, {
      email,
      deviceFingerprint: clientFingerprint || 'unknown',
      authMethod: authMethod || 'password',
      userAgent,
      loginTime: new Date().toISOString()
    }, request)

    // Set cookies
    const cookieStore = await cookies()

    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    })

    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        security: {
          deviceFingerprint: clientFingerprint || 'unknown',
          authMethod: authMethod || 'password',
          loginTime: new Date().toISOString()
        }
      },
    })

    // Add security headers
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
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
