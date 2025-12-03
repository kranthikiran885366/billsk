import { SecurityLog } from '@/backend/models/SecurityLog'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const lockoutMap = new Map<string, { attempts: number; lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

export async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now()
  const key = `rate_${ip}`
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= MAX_ATTEMPTS) {
    await SecurityLog.create({
      ip,
      action: 'RATE_LIMITED',
      details: { attempts: current.count }
    })
    return false
  }

  current.count++
  return true
}

export function checkAccountLockout(identifier: string) {
  const lockout = lockoutMap.get(identifier)
  if (!lockout) return { locked: false, remainingTime: 0 }
  
  const now = Date.now()
  if (now > lockout.lockedUntil) {
    lockoutMap.delete(identifier)
    return { locked: false, remainingTime: 0 }
  }
  
  return { locked: true, remainingTime: Math.ceil((lockout.lockedUntil - now) / 1000) }
}

export function recordFailedAttempt(identifier: string) {
  const current = lockoutMap.get(identifier) || { attempts: 0, lockedUntil: 0 }
  current.attempts++
  
  if (current.attempts >= MAX_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION
  }
  
  lockoutMap.set(identifier, current)
}

export function clearFailedAttempts(identifier: string) {
  lockoutMap.delete(identifier)
}

export function generateAdvancedFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  
  return crypto.createHash('sha256')
    .update(userAgent + acceptLanguage + acceptEncoding)
    .digest('hex')
}

export async function logSecurityEvent(
  action: string,
  userId: string,
  userName: string,
  details: any,
  request: NextRequest
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  await SecurityLog.create({
    userId,
    ip,
    userAgent,
    action,
    details: { ...details, userName }
  })
}

export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
}

export async function trackLoginAttempt(ip: string, userAgent: string, userId?: string, success = false) {
  await SecurityLog.create({
    userId,
    ip,
    userAgent,
    action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED'
  })
}

export async function checkBruteForce(ip: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const attempts = await SecurityLog.countDocuments({
    ip,
    action: 'LOGIN_FAILED',
    timestamp: { $gte: oneHourAgo }
  })
  
  return attempts < 10
}