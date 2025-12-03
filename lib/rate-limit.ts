const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10
}

const endpointConfigs: Record<string, RateLimitConfig> = {
  login: { windowMs: 60 * 1000, maxRequests: 5 },
  register: { windowMs: 60 * 1000, maxRequests: 3 },
  'password-reset': { windowMs: 60 * 1000, maxRequests: 2 }
}

export function checkRateLimit(ip: string, endpoint = 'default') {
  const config = endpointConfigs[endpoint] || defaultConfig
  const key = `${endpoint}:${ip}`
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, resetIn: config.windowMs }
  }
  
  if (current.count >= config.maxRequests) {
    return { allowed: false, resetIn: current.resetTime - now }
  }
  
  current.count++
  return { allowed: true, resetIn: current.resetTime - now }
}