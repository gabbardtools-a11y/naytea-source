import { getBrandSearchToken } from './brand-search-auth'

const API_BASE = 'https://tm-api.codeontime.ru'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// ============================================================
//  Types
// ============================================================

export interface BrandSearchResult {
  id?: string
  certificate: string
  applicationNumber?: string
  name: string
  description?: string | null
  status: string
  statusFips: number
  statusText?: string
  applicationDate?: string
  priorityDate: string
  registrationDate: string
  expirationDate: string
  markType: string
  similarity: number
  score: number
  owner: { fullName: string; legalAddress?: string; country: string; tin?: string; psrn?: string; ogrnip?: string; subjectType?: string }
  imageUrl: string
  catalog: string
  countries: string[]
  mktu: number[]
  disclaimer: string | null
}

export interface BrandSearchResponse {
  ok: boolean
  query?: { search: string; mktu: number[]; searchMode?: string }
  total: number
  page: number
  pageSize: number
  totalPages: number
  results: BrandSearchResult[]
  hasMore: boolean
  error?: string
}

export interface BrandSearchMoreResponse {
  ok: boolean
  results: BrandSearchResult[]
  page: number
  total: number
  hasMore: boolean
  error?: string
}

interface ApiItem {
  id?: string
  mark_number: string
  application_number?: string
  mark_name: string
  description?: string | null
  status: string
  status_fips: number
  application_date?: string
  priority_date?: string
  registration_date?: string
  expiration_date: string
  mark_type: string
  similarity: number
  score: number
  owner: { full_name: string; legal_address?: string; country: string; tin?: string; psrn?: string; ogrnip?: string; subject_type?: string } | null
  mark_file_url: string | null
  mktu_codes: number[]
  catalog: string
  countries: string[]
  mark_disclaimer: string | null
  formatted_priority_date?: string
  formatted_reg_date?: string
}

// ============================================================
//  Helpers
// ============================================================

function formatDate(d?: string): string {
  if (!d) return ''
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return d
  }
}

function mapItem(item: ApiItem): BrandSearchResult {
  const status = item.status || ''
  const statusFips = item.status_fips
  const upper = status.toUpperCase()
  const statusText = ({
    1: 'действует',
    2: 'не действует',
    3: 'не продлён',
    4: 'истёк',
  } as Record<number, string>)[statusFips] || status || 'статус неизвестен'

  let statusClass: 'active' | 'expired' | 'inactive' | 'unknown' = 'unknown'
  if (statusFips === 1 || upper === 'ACTIVE') statusClass = 'active'
  else if (statusFips === 3 || statusFips === 4 || upper === 'EXPIRED') statusClass = 'expired'
  else if (statusFips === 2 || upper === 'INACTIVE') statusClass = 'inactive'

  return {
    id: item.id,
    certificate: item.mark_number || '',
    applicationNumber: item.application_number || '',
    name: item.mark_name || '',
    description: item.description,
    status: statusClass === 'unknown' ? status : statusClass,
    statusFips,
    statusText,
    applicationDate: formatDate(item.application_date),
    priorityDate: formatDate(item.priority_date) || item.formatted_priority_date || '',
    registrationDate: formatDate(item.registration_date) || item.formatted_reg_date || '',
    expirationDate: item.expiration_date || '',
    markType: item.mark_type || '',
    similarity: item.similarity,
    score: item.score,
    owner: {
      fullName: item.owner?.full_name || '',
      legalAddress: item.owner?.legal_address || '',
      country: item.owner?.country || '',
      tin: item.owner?.tin,
      psrn: item.owner?.psrn,
      ogrnip: item.owner?.ogrnip,
      subjectType: item.owner?.subject_type || '',
    },
    imageUrl: item.mark_file_url || '',
    catalog: item.catalog || '',
    countries: item.countries || [],
    mktu: item.mktu_codes || [],
    disclaimer: item.mark_disclaimer,
  }
}

// ============================================================
//  Public API
// ============================================================

export async function searchTrademarks(params: {
  search: string
  mktu: number[]
  page?: number
  pageSize?: number
  searchMode?: string
}): Promise<BrandSearchResponse> {
  const token = await getBrandSearchToken()

  const page = params.page || 1
  const pageSize = Math.min(params.pageSize || 100, 1000)
  const searchMode = params.searchMode || 'standard'

  const url = new URL(API_BASE + '/search/tm')
  url.searchParams.set('q', params.search)
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(pageSize))
  url.searchParams.set('search_mode', searchMode)
  for (const c of params.mktu) url.searchParams.append('classes', String(c))

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`brand-search.ru API error: HTTP ${res.status} — ${text.slice(0, 300)}`)
  }

  const data = await res.json() as { items: ApiItem[]; total: number; page: number; page_size: number; total_pages: number }
  const results = (data.items || []).map(mapItem)
  const isLastPage = results.length < data.page_size
  const effectiveTotal = isLastPage ? (data.page - 1) * data.page_size + results.length : data.total

  return {
    ok: true,
    query: { search: params.search, mktu: params.mktu, searchMode },
    total: effectiveTotal,
    page: data.page,
    pageSize: data.page_size,
    totalPages: isLastPage ? data.page : data.total_pages,
    results,
    hasMore: !isLastPage && data.page < data.total_pages,
  }
}

export async function loadMoreTrademarks(params: {
  search: string
  mktu: number[]
  page: number
  pageSize?: number
  searchMode?: string
}): Promise<BrandSearchMoreResponse> {
  const result = await searchTrademarks({
    search: params.search,
    mktu: params.mktu,
    page: params.page,
    pageSize: params.pageSize,
    searchMode: params.searchMode,
  })
  return { ok: true, results: result.results, page: result.page, total: result.total, hasMore: result.hasMore }
}

export async function searchByImage(params: {
  file: Blob
  fileName: string
  mktu: number[]
  page?: number
  pageSize?: number
  rectangle?: { x1: number; y1: number; x2: number; y2: number }
}): Promise<BrandSearchResponse> {
  const token = await getBrandSearchToken()

  const page = params.page || 1
  const pageSize = Math.min(params.pageSize || 100, 1000)

  const url = new URL(API_BASE + '/search/tm/by_image')
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(pageSize))
  for (const c of params.mktu) url.searchParams.append('classes', String(c))
  if (params.rectangle) {
    const r = params.rectangle
    url.searchParams.set('rectangle', `[${r.x1},${r.y1},${r.x2},${r.y2}]`)
  }

  const formData = new FormData()
  formData.append('file', params.file, params.fileName)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'User-Agent': UA, Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`brand-search.ru image API error: HTTP ${res.status} — ${text.slice(0, 300)}`)
  }

  const data = await res.json() as { items: ApiItem[]; total: number; page: number; page_size: number; total_pages: number }
  const results = (data.items || []).map(mapItem)
  const isLastPage = results.length < data.page_size
  const effectiveTotal = isLastPage ? (data.page - 1) * data.page_size + results.length : data.total

  return {
    ok: true,
    query: { search: `[image: ${params.fileName}]`, mktu: params.mktu, searchMode: 'image' },
    total: effectiveTotal,
    page: data.page,
    pageSize: data.page_size,
    totalPages: isLastPage ? data.page : data.total_pages,
    results,
    hasMore: !isLastPage && data.page < data.total_pages,
  }
}

export async function loadMoreByImage(params: {
  file: Blob
  fileName: string
  mktu: number[]
  page: number
  pageSize?: number
  rectangle?: { x1: number; y1: number; x2: number; y2: number }
}): Promise<BrandSearchMoreResponse> {
  const result = await searchByImage({
    file: params.file,
    fileName: params.fileName,
    mktu: params.mktu,
    page: params.page,
    pageSize: params.pageSize,
    rectangle: params.rectangle,
  })
  return { ok: true, results: result.results, page: result.page, total: result.total, hasMore: result.hasMore }
}

// ============================================================
//  Search by subject (company INN / OGRN / OGRNIP)
//  GET /search/tm/by_subject?tin=...&psrn=...&ogrnip=...
//  Returns all trademarks owned by a specific legal entity.
// ============================================================

export interface SubjectSearchParams {
  tin?: string         // ИНН
  psrn?: string        // ОГРН
  ogrnip?: string      // ОГРНИП
  subjectId?: string   // UUID субъекта (если известен)
  page?: number
  pageSize?: number
  statusFips?: number[]
  catalog?: string[]
  countries?: string[]
}

export async function searchBySubject(params: SubjectSearchParams): Promise<BrandSearchResponse> {
  const token = await getBrandSearchToken()

  const page = params.page || 1
  const pageSize = Math.min(params.pageSize || 100, 1000)

  const url = new URL(API_BASE + '/search/tm/by_subject')
  if (params.tin) url.searchParams.set('tin', params.tin)
  if (params.psrn) url.searchParams.set('psrn', params.psrn)
  if (params.ogrnip) url.searchParams.set('ogrnip', params.ogrnip)
  if (params.subjectId) url.searchParams.set('subject_id', params.subjectId)
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(pageSize))
  for (const s of params.statusFips || []) url.searchParams.append('status_fips', String(s))
  for (const c of params.catalog || []) url.searchParams.append('catalog', c)
  for (const cn of params.countries || []) url.searchParams.append('countries', cn)

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`brand-search.ru by_subject API error: HTTP ${res.status} — ${text.slice(0, 300)}`)
  }

  const data = await res.json() as { items: ApiItem[]; total: number; page: number; page_size: number; total_pages: number }
  const results = (data.items || []).map(mapItem)
  const isLastPage = results.length < data.page_size
  const effectiveTotal = isLastPage ? (data.page - 1) * data.page_size + results.length : data.total

  return {
    ok: true,
    query: { search: `[subject: ${params.tin || params.psrn || params.ogrnip || params.subjectId}]`, mktu: [], searchMode: 'subject' },
    total: effectiveTotal,
    page: data.page,
    pageSize: data.page_size,
    totalPages: isLastPage ? data.page : data.total_pages,
    results,
    hasMore: !isLastPage && data.page < data.total_pages,
  }
}
