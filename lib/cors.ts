import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// CORS configuration for API routes
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]

export function corsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Registration-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  }
}

export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin")

  // Handle preflight
  if (request.method === "OPTIONS") {
    return NextResponse.json({}, { status: 200, headers: corsHeaders(origin) })
  }

  return null
}

export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}
