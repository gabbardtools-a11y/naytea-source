import { promises as fs } from 'fs'
import path from 'path'

/**
 * Public Bearer token for tm-api.codeontime.ru (brand-search.ru / legal-support.ru / Garant-Gardium).
 *
 * This is a PUBLIC token embedded in legal-support.ru's Angular bundle
 * (https://legal-support.ru/local/templates/main/js/search.js) — accessible
 * to any anonymous user. It is NOT a secret.
 *
 * Source: window.__IPID_WIDGET_TOKEN__ in pF() function:
 *   `if (window.__IPID_WIDGET_TOKEN__) return String(t); return "f0e93829-4b26-4583-9fb3-3208b5b10361"`
 *
 * If we want to override (e.g. if this token gets revoked), put a different
 * one in scripts/brand-search-token.txt — that file takes precedence.
 */
const PUBLIC_FALLBACK_TOKEN = 'f0e93829-4b26-4583-9fb3-3208b5b10361'

const TOKEN_FILE = path.join(process.cwd(), 'scripts', 'brand-search-token.txt')
let cachedToken: string | null = null

async function loadTokenFromFile(): Promise<string | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      // Accept both "BRAND_SEARCH_TOKEN=xxx" and just "xxx"
      const value = eq === -1 ? trimmed : trimmed.slice(eq + 1).trim()
      if (value && value.length >= 20) {
        cachedToken = value
        return value
      }
    }
    return null
  } catch { return null }
}

export async function getBrandSearchToken(): Promise<string> {
  // 1. Try token file (gitignored, can be overridden on VPS)
  const fileToken = await loadTokenFromFile()
  if (fileToken) return fileToken

  // 2. Fall back to hardcoded public token (always works)
  return PUBLIC_FALLBACK_TOKEN
}
