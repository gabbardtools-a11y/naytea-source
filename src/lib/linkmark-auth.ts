import { promises as fs } from 'fs'
import path from 'path'

/**
 * linkmark.ru session cookies for the authorized account.
 *
 * In production these would come from environment variables. For the sandbox
 * we read them from a local file written by the operator. The file format is
 * a series of `name=value` lines (one cookie per line); comments start with `#`.
 *
 * Cookies needed for authenticated requests:
 *   - laravel_session         (primary auth token, HttpOnly)
 *   - remember_<hash>         (long-lived "remember me" token)
 *   - XSRF-TOKEN              (CSRF token, must be URL-decoded for the X-XSRF-TOKEN header)
 *   - login_email             (informational, pre-fills the login form)
 */

const COOKIES_FILE = path.join(process.cwd(), 'scripts', 'linkmark-cookies.txt')

let cachedCookies: string | null = null
let cachedParsed: Record<string, string> = {}

async function loadCookies(): Promise<Record<string, string>> {
  // Always check if the file still exists before returning cached values.
  // This allows temporarily disabling auth by renaming/removing the cookies
  // file without having to restart the dev server.
  try {
    await fs.access(COOKIES_FILE)
  } catch {
    // File doesn't exist — clear cache and return empty (anonymous mode)
    cachedCookies = null
    cachedParsed = {}
    return {}
  }

  if (cachedCookies !== null) return cachedParsed
  try {
    const raw = await fs.readFile(COOKIES_FILE, 'utf8')
    const parsed: Record<string, string> = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const name = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      parsed[name] = value
    }
    cachedParsed = parsed
    cachedCookies = raw
    return parsed
  } catch {
    cachedCookies = null
    cachedParsed = {}
    return {}
  }
}

/**
 * Returns the cookie string for use in the `Cookie` HTTP header.
 * e.g. "laravel_session=...; XSRF-TOKEN=...; remember_...=..."
 */
export async function getCookieHeader(): Promise<string> {
  const parsed = await loadCookies()
  return Object.entries(parsed)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

/**
 * Returns the URL-decoded XSRF-TOKEN value, suitable for the X-XSRF-TOKEN
 * request header (Laravel expects the decoded value here while the Cookie
 * header carries the encoded form).
 */
export async function getXsrfToken(): Promise<string | null> {
  const parsed = await loadCookies()
  const raw = parsed['XSRF-TOKEN']
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/**
 * Whether we have an authenticated session (laravel_session cookie present).
 */
export async function isAuthenticated(): Promise<boolean> {
  const parsed = await loadCookies()
  return !!parsed['laravel_session']
}

/**
 * Best-effort detection of the login email from cookies (informational only).
 */
export async function getLoginEmail(): Promise<string | null> {
  const parsed = await loadCookies()
  const raw = parsed['login_email']
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/**
 * Force a reload of the cookies file (used after the file is updated).
 */
export function resetCookieCache(): void {
  cachedCookies = null
  cachedParsed = {}
}
