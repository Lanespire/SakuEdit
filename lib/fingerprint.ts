/**
 * Browser Fingerprint Generator
 * Generates a unique identifier for anonymous users based on browser characteristics
 */

interface FingerprintData {
  userAgent: string
  language: string
  platform: string
  screenResolution: string
  timezone: string
  colorDepth: number
  deviceMemory?: number
  hardwareConcurrency?: number
  touchSupport: boolean
  canvas?: string
}

// Generate a simple hash from string
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)

  // Use SubtleCrypto for hashing (available in browsers)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Get canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Draw unique pattern
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('SakuEdit', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('fingerprint', 4, 17)

    return canvas.toDataURL()
  } catch {
    return ''
  }
}

// Collect fingerprint data
async function collectFingerprintData(): Promise<FingerprintData> {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    hardwareConcurrency?: number
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    canvas: getCanvasFingerprint(),
  }
}

// Generate fingerprint (call this on client side)
export async function generateFingerprint(): Promise<string> {
  const data = await collectFingerprintData()
  const fingerprintString = JSON.stringify(data)
  return hashString(fingerprintString)
}

// Get or create fingerprint from localStorage
export function getStoredFingerprint(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sakuedit_fingerprint')
}

// Store fingerprint in localStorage
export function storeFingerprint(fingerprint: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('sakuedit_fingerprint', fingerprint)
}

// Initialize fingerprint (generate if not exists)
export async function initFingerprint(): Promise<string> {
  const stored = getStoredFingerprint()
  if (stored) return stored

  const fingerprint = await generateFingerprint()
  storeFingerprint(fingerprint)
  return fingerprint
}
