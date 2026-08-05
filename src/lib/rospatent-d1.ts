/**
 * Cloudflare D1 client — Rospatent trademarks database.
 *
 * DB: naytea-tm (uuid 323853d9-3256-40c9-924b-6fdddbc67bb8)
 * Source: https://rospatent.gov.ru/opendata/7730176088-tz/data-20260601-structure-20180828.csv
 * Rows: 1.15M Russian Federation trademark registrations from 1936 to 2026.
 *
 * Schema:
 *   trademarks(
 *     id INTEGER PRIMARY KEY,
 *     registration_number TEXT UNIQUE,
 *     text TEXT,                    -- name (currently NULL — Rospatent CSV doesn't include text)
 *     right_holder TEXT,
 *     applying_date TEXT,           -- 'YYYY-MM-DD'
 *     registration_date TEXT,
 *     expiration_date TEXT,
 *     status TEXT,                  -- 'active' | 'expired'
 *     thumbnail_url TEXT,           -- NULL (no images in CSV)
 *     source TEXT                   -- publication URL on fips.ru
 *   )
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '3831989c82841862df148347d2fbf198'
const D1_DB_ID = process.env.CF_D1_DB_ID || '323853d9-3256-40c9-924b-6fdddbc67bb8'
const CF_API_TOKEN = process.env.CF_D1_TOKEN // must be set in env

export interface D1TrademarksRow {
  id: number
  registration_number: string
  text: string | null
  right_holder: string | null
  applying_date: string | null
  registration_date: string | null
  expiration_date: string | null
  status: string
  thumbnail_url: string | null
  source: string | null
  mktu?: string | null  // JSON array as string, e.g. "[1,9,42]" — enriched from beboss/brand-search
}

export interface D1QueryResult<T = D1TrademarksRow> {
  results: T[]
  meta: {
    served_by?: string
    duration?: number
    changes?: number
    last_row_id?: number
    rows_read?: number
    rows_written?: number
    size_after?: number
  }
  success: boolean
}

interface D1Response {
  result: D1QueryResult[]
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: unknown[]
}

/**
 * Execute a SQL query against D1 via REST API.
 * Returns the first result set (D1 REST API wraps query in array).
 */
export async function d1Query<T = D1TrademarksRow>(
  sql: string,
  params?: (string | number | null)[],
  timeoutMs = 30000,
): Promise<D1QueryResult<T>> {
  if (!CF_API_TOKEN) {
    throw new Error('CF_D1_TOKEN environment variable is not set')
  }

  const url = `${CF_API_BASE}/accounts/${ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`
  const body: Record<string, unknown> = { sql }
  if (params && params.length > 0) {
    body.params = params
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`D1 HTTP ${res.status}: ${text.slice(0, 300)}`)
    }

    const data = (await res.json()) as D1Response
    if (!data.success) {
      const err = data.errors?.[0]
      throw new Error(`D1 error: ${err?.message || 'unknown'} (code ${err?.code})`)
    }

    return data.result[0]
  } finally {
    clearTimeout(timer)
  }
}

// ============================================================
//  Search types & helpers
// ============================================================

export interface RospatentSearchResult {
  id: number
  registrationNumber: string
  name: string
  status: string
  statusText: string
  statusFips: number
  owner: { fullName: string; country: string }
  imageUrl: string
  priorityDate: string
  registrationDate: string
  expirationDate: string
  applicationDate: string
  similarity: number
  score: number
  source: string
  mktu: number[]
}

export interface RospatentSearchResponse {
  ok: boolean
  total: number
  page: number
  pageSize: number
  results: RospatentSearchResult[]
  hasMore: boolean
  error?: string
}

function escapeLike(s: string): string {
  // Escape special chars for LIKE pattern
  return s.replace(/[%_\\]/g, c => '\\' + c)
}

function formatRuDate(d: string | null): string {
  if (!d) return ''
  // d is 'YYYY-MM-DD'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

function mapRow(row: D1TrademarksRow): RospatentSearchResult {
  const statusText = row.status === 'active' ? 'действует' : 'истёк'
  const statusFips = row.status === 'active' ? 1 : 4

  // Parse mktu (stored as JSON string like "[1,2,3]" or comma-separated "1,2,3")
  let mktu: number[] = []
  if ((row as any).mktu) {
    const raw = (row as any).mktu as string
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        mktu = parsed.map((n: any) => Number(n)).filter((n: number) => !isNaN(n))
      }
    } catch {
      // Fallback: comma-separated
      mktu = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    }
  }

  return {
    id: row.id,
    registrationNumber: row.registration_number || '',
    name: row.text || '', // enriched from beboss/brand-search
    status: row.status,
    statusText,
    statusFips,
    owner: {
      fullName: row.right_holder || '',
      country: '',
    },
    imageUrl: row.thumbnail_url || '', // enriched from beboss/brand-search
    priorityDate: formatRuDate(row.applying_date),
    registrationDate: formatRuDate(row.registration_date),
    expirationDate: row.expiration_date || '',
    applicationDate: formatRuDate(row.applying_date),
    similarity: 1,
    score: 100,
    source: row.source || '',
    mktu,
  }
}

// ============================================================
//  Public: searchTrademarks
// ============================================================

export interface SearchParams {
  search: string
  page?: number
  pageSize?: number
}

/**
 * Search Rospatent trademarks by right_holder name (LIKE %query%).
 * Note: Rospatent CSV doesn't include the trademark NAME itself — only
 * right_holder, dates, status, and source URL. So search is on owner.
 *
 * For name-based search, use brand-search.ru (which has full text index).
 */
export async function searchTrademarks(params: SearchParams): Promise<RospatentSearchResponse> {
  const page = params.page || 1
  const pageSize = Math.min(params.pageSize || 100, 500)
  const offset = (page - 1) * pageSize
  const search = params.search.trim()

  if (!search) {
    return {
      ok: false,
      total: 0,
      page,
      pageSize,
      results: [],
      hasMore: false,
      error: 'Поисковый запрос обязателен',
    }
  }

  const escapedSearch = escapeLike(search)
  const likePattern = `%${escapedSearch}%`
  const isNumeric = /^\d+$/.test(search)

  // Count total matches — search across text (name), right_holder (owner), registration_number
  let countSql: string
  let countParams: (string | number)[]

  if (isNumeric) {
    countSql = `SELECT COUNT(*) as c FROM trademarks WHERE registration_number = ? OR text LIKE ? ESCAPE '\\' OR right_holder LIKE ? ESCAPE '\\'`
    countParams = [search, likePattern, likePattern]
  } else {
    countSql = `SELECT COUNT(*) as c FROM trademarks WHERE text LIKE ? ESCAPE '\\' OR right_holder LIKE ? ESCAPE '\\'`
    countParams = [likePattern, likePattern]
  }

  const countResult = await d1Query<{ c: number }>(countSql, countParams)
  const total = countResult.results[0]?.c || 0

  if (total === 0) {
    return { ok: true, total: 0, page, pageSize, results: [], hasMore: false }
  }

  // Fetch page — prioritize rows with name (text) and image
  let dataSql: string
  let dataParams: (string | number)[]

  if (isNumeric) {
    dataSql = `SELECT * FROM trademarks
      WHERE registration_number = ? OR text LIKE ? ESCAPE '\\' OR right_holder LIKE ? ESCAPE '\\'
      ORDER BY (CASE WHEN text IS NOT NULL AND text != '' THEN 0 ELSE 1 END), status DESC, registration_date DESC
      LIMIT ? OFFSET ?`
    dataParams = [search, likePattern, likePattern, pageSize, offset]
  } else {
    dataSql = `SELECT * FROM trademarks
      WHERE text LIKE ? ESCAPE '\\' OR right_holder LIKE ? ESCAPE '\\'
      ORDER BY (CASE WHEN text IS NOT NULL AND text != '' THEN 0 ELSE 1 END), status DESC, registration_date DESC
      LIMIT ? OFFSET ?`
    dataParams = [likePattern, likePattern, pageSize, offset]
  }

  const dataResult = await d1Query<D1TrademarksRow>(dataSql, dataParams)

  const results = dataResult.results.map(mapRow)
  const hasMore = offset + results.length < total

  return {
    ok: true,
    total,
    page,
    pageSize,
    results,
    hasMore,
  }
}

// ============================================================
//  Public: searchByRegistrationNumber
// ============================================================

export interface SearchByNumberParams {
  number: string
}

export async function searchByRegistrationNumber(
  params: SearchByNumberParams,
): Promise<RospatentSearchResponse> {
  const num = params.number.trim()
  if (!num) {
    return {
      ok: false,
      total: 0,
      page: 1,
      pageSize: 100,
      results: [],
      hasMore: false,
      error: 'Номер регистрации обязателен',
    }
  }

  // Try exact match first
  let result = await d1Query<D1TrademarksRow>(
    `SELECT * FROM trademarks WHERE registration_number = ? LIMIT 1`,
    [num],
  )

  // If no exact, try prefix match (user may have typed partial)
  if (!result.results.length) {
    result = await d1Query<D1TrademarksRow>(
      `SELECT * FROM trademarks WHERE registration_number LIKE ? ESCAPE '\\' ORDER BY registration_number LIMIT 100`,
      [`${escapeLike(num)}%`],
    )
  }

  const results = result.results.map(mapRow)
  return {
    ok: true,
    total: results.length,
    page: 1,
    pageSize: 100,
    results,
    hasMore: false,
  }
}

// ============================================================
//  Public: getStats — DB statistics for UI/health check
// ============================================================

export interface D1Stats {
  total: number
  active: number
  expired: number
  oldest: string | null
  newest: string | null
  distinctHolders: number
}

export async function getStats(): Promise<D1Stats> {
  const r = await d1Query<{
    total: number
    active: number
    expired: number
    oldest: string | null
    newest: string | null
  }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
       MIN(registration_date) as oldest,
       MAX(registration_date) as newest
     FROM trademarks WHERE registration_date IS NOT NULL AND registration_date != ''`,
  )
  const row = r.results[0]
  return {
    total: row?.total || 0,
    active: row?.active || 0,
    expired: row?.expired || 0,
    oldest: row?.oldest || null,
    newest: row?.newest || null,
    distinctHolders: 0,
  }
}
