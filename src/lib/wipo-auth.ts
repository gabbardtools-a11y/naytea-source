import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * WIPO Global Brand Database — session management.
 *
 * The GBD API requires an altcha proof-of-work challenge to be solved
 * before search requests are accepted. The flow is:
 *
 * 1. GET /captcha → {algorithm, challenge, maxnumber, salt, signature}
 * 2. Brute-force: find `number` where SHA-256(salt + number) < challenge
 * 3. Construct payload: base64(JSON({algorithm, challenge, salt, signature, number}))
 * 4. Generate a random hashSearch UUID (used as session ID + AES key component)
 * 5. GET /dbinfo?token=<payload> with header HashSearch: <hashSearch>
 * 6. If 200 → session is established, use hashSearch for subsequent /search calls
 *
 * Sessions are cached for 25 minutes.
 *
 * Fallback: if altcha solving fails (rate limiting, etc.), the server reads
 * a pre-configured hashSearch from /scripts/wipo-hashsearch.txt. This file
 * can be refreshed by running a browser session on branddb.wipo.int and
 * copying the localStorage value.
 */

const CAPTCHA_URL = 'https://api.branddb.wipo.int/captcha'
const DBINFO_URL = 'https://api.branddb.wipo.int/dbinfo'
const HASHSEARCH_FILE = path.join(process.cwd(), 'scripts', 'wipo-hashsearch.txt')

interface AltchaChallenge {
  algorithm: string
  challenge: string
  maxnumber: number
  salt: string
  signature: string
}

interface WipoSession {
  hashSearch: string
  createdAt: number
  source: 'altcha' | 'file' | 'cache'
}

let cachedSession: WipoSession | null = null
const SESSION_TTL_MS = 25 * 60 * 1000 // 25 minutes

/**
 * Fetches the altcha challenge from the WIPO GBD API.
 */
async function fetchChallenge(): Promise<AltchaChallenge | null> {
  try {
    const res = await fetch(CAPTCHA_URL, {
      headers: {
        Accept: 'application/json',
        Origin: 'https://branddb.wipo.int',
        Referer: 'https://branddb.wipo.int/',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.challenge || !data.salt) return null
    return data as AltchaChallenge
  } catch {
    return null
  }
}

/**
 * Solves the altcha proof-of-work challenge.
 * Finds `number` (0..maxnumber) where SHA-256(salt + number) < challenge.
 */
function solvePoW(challenge: AltchaChallenge): number | null {
  const { challenge: target, salt, maxnumber } = challenge
  for (let i = 0; i <= maxnumber; i++) {
    const hash = crypto.createHash('sha256').update(salt + i, 'utf8').digest('hex')
    if (hash < target) {
      return i
    }
  }
  return null
}

/**
 * Attempts to create a new session via altcha PoW.
 * Returns null if it fails (rate limiting, network error, etc.)
 */
async function createSessionViaAltcha(): Promise<string | null> {
  try {
    const challenge = await fetchChallenge()
    if (!challenge) return null

    const solution = solvePoW(challenge)
    if (solution === null) return null

    const payload = Buffer.from(JSON.stringify({
      algorithm: challenge.algorithm,
      challenge: challenge.challenge,
      number: solution,
      salt: challenge.salt,
      signature: challenge.signature,
    })).toString('base64')

    const hashSearch = crypto.randomUUID()
    const url = `${DBINFO_URL}?token=${payload}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        HashSearch: hashSearch,
        Accept: 'application/json',
        Origin: 'https://branddb.wipo.int',
        Referer: 'https://branddb.wipo.int/',
      },
    })

    if (res.ok) {
      return hashSearch
    }
    return null
  } catch {
    return null
  }
}

/**
 * Reads a fallback hashSearch from the file system.
 * The file should contain a single line with a UUID.
 */
async function readHashSearchFromFile(): Promise<string | null> {
  try {
    const raw = await fs.readFile(HASHSEARCH_FILE, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      // The line might be "WIPO_HASHSEARCH=<uuid>" or just "<uuid>"
      const value = trimmed.includes('=') ? trimmed.split('=')[1].trim() : trimmed
      if (value.length > 10) return value
    }
    return null
  } catch {
    return null
  }
}

/**
 * Returns a valid hashSearch for WIPO GBD API calls.
 *
 * Tries (in order):
 * 1. Cached session (if still valid)
 * 2. Altcha PoW (creates new session)
 * 3. File fallback (/scripts/wipo-hashsearch.txt)
 */
export async function getWipoHashSearch(): Promise<string | null> {
  // 1. Check cache
  if (cachedSession && Date.now() - cachedSession.createdAt < SESSION_TTL_MS) {
    return cachedSession.hashSearch
  }

  // 2. Try altcha
  const altchaHash = await createSessionViaAltcha()
  if (altchaHash) {
    cachedSession = {
      hashSearch: altchaHash,
      createdAt: Date.now(),
      source: 'altcha',
    }
    return altchaHash
  }

  // 3. Fall back to file
  const fileHash = await readHashSearchFromFile()
  if (fileHash) {
    cachedSession = {
      hashSearch: fileHash,
      createdAt: Date.now(),
      source: 'file',
    }
    return fileHash
  }

  return null
}

/**
 * Force-clears the cached session (used on auth errors to trigger re-auth).
 */
export function clearWipoSession(): void {
  cachedSession = null
}
