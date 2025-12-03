import crypto from "crypto"

export interface AdvancedFingerprint {
  userAgent: string
  language: string
  languages: string[]
  timezone: string
  screen: { width: number; height: number; colorDepth: number; pixelRatio: number }
  platform: string
  cookieEnabled: boolean
  doNotTrack: string
  hardwareConcurrency: number
  maxTouchPoints: number
  webgl: { vendor: string; renderer: string }
  canvas: string
  audio: string
  fonts: string[]
  plugins: string[]
  connection: { effectiveType?: string; downlink?: number }
  battery: { charging?: boolean; level?: number }
  permissions: Record<string, string>
  hash: string
}

// Generate advanced device fingerprint
export function generateAdvancedFingerprint(data: Partial<AdvancedFingerprint>): string {
  const components = [
    data.userAgent || "",
    data.language || "",
    JSON.stringify(data.languages || []),
    data.timezone || "",
    JSON.stringify(data.screen || {}),
    data.platform || "",
    String(data.cookieEnabled || false),
    data.doNotTrack || "",
    String(data.hardwareConcurrency || 0),
    String(data.maxTouchPoints || 0),
    JSON.stringify(data.webgl || {}),
    data.canvas || "",
    data.audio || "",
    JSON.stringify(data.fonts || []),
    JSON.stringify(data.plugins || []),
    JSON.stringify(data.connection || {}),
    JSON.stringify(data.battery || {}),
    JSON.stringify(data.permissions || {})
  ].join("|")
  
  return crypto.createHash("sha256").update(components).digest("hex")
}

// Advanced client-side fingerprint collection
export const collectAdvancedFingerprint = `
async function collectAdvancedFingerprint() {
  const fp = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages ? Array.from(navigator.languages) : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    },
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || '',
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    webgl: getWebGLFingerprint(),
    canvas: getCanvasFingerprint(),
    audio: await getAudioFingerprint(),
    fonts: getFontFingerprint(),
    plugins: getPluginFingerprint(),
    connection: getConnectionInfo(),
    battery: await getBatteryInfo(),
    permissions: await getPermissions()
  }
  return fp
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return { vendor: '', renderer: '' }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '',
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''
    }
  } catch { return { vendor: '', renderer: '' } }
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint test 🔒', 2, 2)
    return canvas.toDataURL().slice(-50)
  } catch { return '' }
}

async function getAudioFingerprint() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const analyser = audioContext.createAnalyser()
    const gainNode = audioContext.createGain()
    oscillator.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.value = 1000
    oscillator.start()
    const frequencyData = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(frequencyData)
    oscillator.stop()
    audioContext.close()
    return Array.from(frequencyData.slice(0, 10)).join(',')
  } catch { return '' }
}

function getFontFingerprint() {
  const fonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact']
  const available = []
  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  
  ctx.font = testSize + ' monospace'
  const baselineWidth = ctx.measureText(testString).width
  
  for (const font of fonts) {
    ctx.font = testSize + ' ' + font + ', monospace'
    if (ctx.measureText(testString).width !== baselineWidth) {
      available.push(font)
    }
  }
  return available
}

function getPluginFingerprint() {
  if (!navigator.plugins) return []
  return Array.from(navigator.plugins).map(p => p.name).sort()
}

function getConnectionInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return conn ? {
    effectiveType: conn.effectiveType,
    downlink: conn.downlink
  } : {}
}

async function getBatteryInfo() {
  try {
    const battery = await navigator.getBattery()
    return {
      charging: battery.charging,
      level: Math.round(battery.level * 100)
    }
  } catch { return {} }
}

async function getPermissions() {
  const permissions = {}
  const perms = ['camera', 'microphone', 'geolocation', 'notifications']
  for (const perm of perms) {
    try {
      const result = await navigator.permissions.query({ name: perm })
      permissions[perm] = result.state
    } catch {}
  }
  return permissions
}
`

// Device trust scoring
export function calculateTrustScore(fingerprint: AdvancedFingerprint, knownDevices: AdvancedFingerprint[]): number {
  if (knownDevices.length === 0) return 0.5
  
  let maxSimilarity = 0
  for (const known of knownDevices) {
    const similarity = calculateSimilarity(fingerprint, known)
    maxSimilarity = Math.max(maxSimilarity, similarity)
  }
  
  return maxSimilarity
}

function calculateSimilarity(fp1: AdvancedFingerprint, fp2: AdvancedFingerprint): number {
  const weights = {
    userAgent: 0.15,
    screen: 0.15,
    webgl: 0.15,
    canvas: 0.15,
    fonts: 0.10,
    audio: 0.10,
    timezone: 0.05,
    language: 0.05,
    platform: 0.05,
    other: 0.05
  }
  
  let score = 0
  
  if (fp1.userAgent === fp2.userAgent) score += weights.userAgent
  if (JSON.stringify(fp1.screen) === JSON.stringify(fp2.screen)) score += weights.screen
  if (JSON.stringify(fp1.webgl) === JSON.stringify(fp2.webgl)) score += weights.webgl
  if (fp1.canvas === fp2.canvas) score += weights.canvas
  if (JSON.stringify(fp1.fonts) === JSON.stringify(fp2.fonts)) score += weights.fonts
  if (fp1.audio === fp2.audio) score += weights.audio
  if (fp1.timezone === fp2.timezone) score += weights.timezone
  if (fp1.language === fp2.language) score += weights.language
  if (fp1.platform === fp2.platform) score += weights.platform
  
  return score
}

// Risk assessment
export function assessDeviceRisk(fingerprint: AdvancedFingerprint, trustScore: number): {
  risk: 'low' | 'medium' | 'high'
  factors: string[]
  requiresVerification: boolean
} {
  const factors: string[] = []
  let riskScore = 0
  
  if (trustScore < 0.3) {
    riskScore += 0.4
    factors.push('Unknown device')
  }
  
  if (fingerprint.doNotTrack === '1') {
    riskScore += 0.1
    factors.push('Privacy-focused browser')
  }
  
  if (!fingerprint.cookieEnabled) {
    riskScore += 0.2
    factors.push('Cookies disabled')
  }
  
  if (fingerprint.plugins.length === 0) {
    riskScore += 0.1
    factors.push('No browser plugins')
  }
  
  const risk = riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low'
  
  return {
    risk,
    factors,
    requiresVerification: risk === 'high' || (risk === 'medium' && trustScore < 0.5)
  }
}