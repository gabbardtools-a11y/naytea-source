import CryptoJS from 'crypto-js'
import { getWipoHashSearch, clearWipoSession } from './wipo-auth'

const API_BASE = 'https://api.branddb.wipo.int'
const AES_KEY_PREFIX = '8?)i_~Nk6qv0IX;2'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

export interface WipoResult {
  certificate: string
  name: string
  priorityDate: string
  registrationDate: string
  mktu: string[]
  owner: string
  unprotectedElements: string
  sourceUrl: string
  imageUrl: string
  status: 'active' | 'inactive' | 'expired' | 'unknown'
  statusText: string
  // WIPO extras
  applicationNumber: string
  applicationDate: string
  expirationDate: string
  markType: string
  markFeature: string
  similarity: number
  ownerCountry: string
  office: string
  collection: string
  st13: string
}

export interface WipoSearchResponse {
  ok: boolean
  query: { search: string; mktu: number[] }
  total: number
  start: number
  rows: number
  results: WipoResult[]
  hasMore: boolean
  error?: string
}

export interface WipoMoreResponse {
  ok: boolean
  results: WipoResult[]
  total: number
  hasMore: boolean
  error?: string
}

interface WipoApiItem {
  brandName?: string[]
  applicationNumber?: string
  kind?: string[]
  collection?: string
  office?: string
  type?: string
  applicant?: string[]
  applicantCountryCode?: string[]
  markFeature?: string
  score?: number
  niceClass?: number[]
  st13?: string
  logo?: string[]
  designation?: string[]
  applicationDate?: string
  registrationDate?: string
  expiryDate?: string
  status?: string
  statusDate?: string
  runid?: string
}

interface WipoApiResponse {
  response?: {
    numFound?: number
    start?: number
    docs?: WipoApiItem[]
  }
}

/**
 * Decrypts an AES-ECB encrypted response from the WIPO GBD API.
 * Key = AES_KEY_PREFIX + hashSearch (parsed as UTF-8 WordArray by CryptoJS).
 */
function decryptResponse(encrypted: string, hashSearch: string): WipoApiResponse {
  const key = CryptoJS.enc.Utf8.parse(AES_KEY_PREFIX + hashSearch)
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    mode: CryptoJS.mode.ECB,
  }).toString(CryptoJS.enc.Utf8)
  return JSON.parse(decrypted) as WipoApiResponse
}

/**
 * Formats an ISO date string to Russian "1 января 2024 г." format.
 */
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

/**
 * Maps a WIPO API item to the unified WipoResult format.
 */
function mapItem(item: WipoApiItem): WipoResult {
  const status = (item.status || '').toLowerCase()
  let mappedStatus: WipoResult['status'] = 'unknown'
  let statusText = item.status || 'Unknown'

  if (status.includes('registered') || status.includes('live') || status.includes('active')) {
    mappedStatus = 'active'
  } else if (status.includes('ended') || status.includes('expired') || status.includes('inactive')) {
    mappedStatus = 'expired'
  } else if (status.includes('pending') || status.includes('application') || status.includes('filed')) {
    mappedStatus = 'inactive'
  }

  // Build owner string with country
  const ownerName = item.applicant?.[0] || ''
  const ownerCountry = item.applicantCountryCode?.[0] || ''
  const owner = ownerName + (ownerCountry ? ` (${ownerCountry})` : '')

  // Build image URL — WIPO stores logos by ID, accessible via a CDN
  const logoId = item.logo?.[0] || ''
  const imageUrl = logoId
    ? `https://branddb.wipo.int/images/${item.office?.toLowerCase() || 'wo'}/${logoId}.jpg`
    : ''

  // Build source URL — link to the WIPO GBD detail page
  const st13 = item.st13 || ''
  const sourceUrl = st13
    ? `https://branddb.wipo.int/en/trademark/${st13}`
    : 'https://branddb.wipo.int/'

  return {
    certificate: item.applicationNumber || '',
    name: item.brandName?.join(' ') || '',
    priorityDate: formatDate(item.applicationDate),
    registrationDate: formatDate(item.registrationDate),
    mktu: (item.niceClass || []).map(String),
    owner,
    unprotectedElements: '',
    sourceUrl,
    imageUrl,
    status: mappedStatus,
    statusText,
    applicationNumber: item.applicationNumber || '',
    applicationDate: formatDate(item.applicationDate),
    expirationDate: formatDate(item.expiryDate),
    markType: item.type || '',
    markFeature: item.markFeature || '',
    similarity: item.score || 0,
    ownerCountry,
    office: item.office || '',
    collection: item.collection || '',
    st13,
  }
}

/**
 * Performs a trademark search via WIPO Global Brand Database.
 *
 * Endpoint: POST /search
 * Body: {sort, start, rows, asStructure: {boolean, bricks: [{key, value, strategy}]}}
 * Response: AES-ECB encrypted, base64 encoded
 */
export async function searchTrademarks(params: {
  search: string
  mktu: number[]
  start?: number
  rows?: number
}): Promise<WipoSearchResponse> {
  const hashSearch = await getWipoHashSearch()
  if (!hashSearch) {
    throw new Error(
      'WIPO hashSearch not available. Altcha solving failed and no fallback file found.'
    )
  }

  const start = params.start || 0
  const rows = Math.min(params.rows || 30, 100)

  // Build search structure — WIPO GBD uses asStructure with "bricks"
  // Note: MKTU class filtering is done client-side after results are returned,
  // because the WIPO API uses a different filter mechanism for classes
  // (not through asStructure bricks).
  const bricks: Array<{ _id: string; key: string; value: string; strategy: string }> = [
    {
      _id: 'd69b',
      key: 'brandName',
      value: params.search,
      strategy: 'Simple',
    },
  ]

  const searchBody = {
    sort: 'score desc',
    start,
    rows,
    asStructure: {
      _id: 'd69a',
      boolean: 'AND',
      bricks,
    },
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        HashSearch: hashSearch,
        Accept: 'application/json',
        Origin: 'https://branddb.wipo.int',
        Referer: 'https://branddb.wipo.int/',
        'User-Agent': UA,
      },
      body: JSON.stringify(searchBody),
    })
  } catch (err) {
    throw new Error(`WIPO search network error: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  if (res.status === 401 || res.status === 403) {
    // Session expired — clear cache and retry once
    clearWipoSession()
    const newHash = await getWipoHashSearch()
    if (!newHash) {
      throw new Error('WIPO session expired and could not be refreshed')
    }
    res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        HashSearch: newHash,
        Accept: 'application/json',
        Origin: 'https://branddb.wipo.int',
        Referer: 'https://branddb.wipo.int/',
        'User-Agent': UA,
      },
      body: JSON.stringify(searchBody),
    })
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WIPO search failed: HTTP ${res.status} — ${text.slice(0, 200)}`)
  }

  const encryptedText = await res.text()
  if (encryptedText.length < 50) {
    throw new Error(`WIPO search: unexpectedly short response (${encryptedText.length} bytes)`)
  }

  const data = decryptResponse(encryptedText, hashSearch)
  const numFound = data.response?.numFound || 0
  const docs = data.response?.docs || []
  const results = docs.map(mapItem)

  return {
    ok: true,
    query: { search: params.search, mktu: params.mktu },
    total: numFound,
    start,
    rows,
    results,
    hasMore: start + results.length < numFound,
  }
}

/**
 * Loads additional pages of WIPO results.
 */
export async function loadMoreTrademarks(params: {
  search: string
  mktu: number[]
  start: number
  rows?: number
}): Promise<WipoMoreResponse> {
  const result = await searchTrademarks({
    search: params.search,
    mktu: params.mktu,
    start: params.start,
    rows: params.rows,
  })

  return {
    ok: true,
    results: result.results,
    total: result.total,
    hasMore: result.hasMore,
  }
}

/**
 * Performs a logo-based (image similarity) search via WIPO GBD.
 *
 * Same endpoint POST /search, but with extra fields:
 *   - bases64: array of "data:image/...;base64,..." strings
 *   - strategy: "concept" | "shape" | "color" | "composite"
 *   - asStructure: passed as a JSON string (not object), with empty bricks
 *
 * Response is AES-ECB encrypted, same as text search.
 */
export async function searchByLogo(params: {
  imageData: string // "data:image/jpeg;base64,...."
  strategy?: 'concept' | 'shape' | 'color' | 'composite'
  start?: number
  rows?: number
}): Promise<WipoSearchResponse> {
  const hashSearch = await getWipoHashSearch()
  if (!hashSearch) {
    throw new Error(
      'WIPO hashSearch not available. Altcha solving failed and no fallback file found.'
    )
  }

  const start = params.start || 0
  const rows = Math.min(params.rows || 30, 100)
  const strategy = params.strategy || 'concept'

  // WIPO logo search body format (captured from browser):
  // - asStructure is a STRING (JSON.stringify'd), not an object
  // - bases64 is an array of data URIs
  // - strategy selects the AI similarity mode
  const searchBody = {
    strategy,
    sort: 'score desc',
    start: String(start),
    rows: String(rows),
    asStructure: JSON.stringify({
      _id: '5d5b',
      boolean: 'AND',
      bricks: [],
    }),
    fg: '_void_',
    bases64: [params.imageData],
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        HashSearch: hashSearch,
        Accept: 'application/json',
        Origin: 'https://branddb.wipo.int',
        Referer: 'https://branddb.wipo.int/',
        'User-Agent': UA,
      },
      body: JSON.stringify(searchBody),
    })
  } catch (err) {
    throw new Error(`WIPO logo search network error: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  if (res.status === 401 || res.status === 403) {
    clearWipoSession()
    const newHash = await getWipoHashSearch()
    if (!newHash) {
      throw new Error('WIPO session expired and could not be refreshed')
    }
    res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        HashSearch: newHash,
        Accept: 'application/json',
        Origin: 'https://branddb.wipo.int',
        Referer: 'https://branddb.wipo.int/',
        'User-Agent': UA,
      },
      body: JSON.stringify(searchBody),
    })
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WIPO logo search failed: HTTP ${res.status} — ${text.slice(0, 200)}`)
  }

  const encryptedText = await res.text()
  if (encryptedText.length < 50) {
    throw new Error(`WIPO logo search: unexpectedly short response (${encryptedText.length} bytes)`)
  }

  const data = decryptResponse(encryptedText, hashSearch)
  const numFound = data.response?.numFound || 0
  const docs = data.response?.docs || []
  const results = docs.map(mapItem)

  return {
    ok: true,
    query: { search: `[logo: ${strategy}]`, mktu: [] },
    total: numFound,
    start,
    rows,
    results,
    hasMore: start + results.length < numFound,
  }
}

/**
 * Loads additional pages of WIPO logo search results.
 */
export async function loadMoreByLogo(params: {
  imageData: string
  strategy?: 'concept' | 'shape' | 'color' | 'composite'
  start: number
  rows?: number
}): Promise<WipoMoreResponse> {
  const result = await searchByLogo({
    imageData: params.imageData,
    strategy: params.strategy,
    start: params.start,
    rows: params.rows,
  })

  return {
    ok: true,
    results: result.results,
    total: result.total,
    hasMore: result.hasMore,
  }
}
