/**
 * linkmark.ru — server-side proxy
 *
 * Reverse-engineered from linkmark.ru's frontend:
 *   1. GET / to obtain CSRF token (_token) + cookies (XSRF-TOKEN, laravel_session)
 *   2. POST /search (redirect: manual) — server returns 302 to /request/{id}
 *   3. GET /request/{id} — initial results page (HTML)
 *   4. POST /request.json/{id} — load more results as JSON
 *
 * Status mapping (linkmark status_name.class):
 *   status_2 → active
 *   status_1 → inactive
 *   status_4 / status_5 / "истёк" / "не продлён" → expired
 *
 * Public API (no auth required): linkmark.ru serves anonymous sessions.
 */

import * as cheerio from 'cheerio'
import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

const LINKMARK_BASE = 'https://linkmark.ru'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

export interface LinkmarkResult {
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
}

export interface LinkmarkSearchResponse {
  ok: boolean
  total: { trademarks: number | null; applications: number | null } | number
  results: LinkmarkResult[]
  requestId: string | null
  requestUrl: string
  hasMore: boolean
  error?: string
}

export interface LinkmarkMoreResponse {
  ok: boolean
  results: LinkmarkResult[]
  total: number | null
  hasMore: boolean
  error?: string
}

interface TokenAndCookies {
  token: string
  cookies: string
}

// ============================================================
// Axios instance with cookie jar — handles redirects + cookies automatically
// ============================================================

// Create a fresh axios client with new cookie jar for each search
// (linkmark sessions are per-search, reusing causes wrong results)
function createClient() {
  const jar = new CookieJar()
  return wrapper(axios).create({
    jar,
    withCredentials: true,
    maxRedirects: 5,
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
    timeout: 30000,
    validateStatus: (status: number) => status < 400,
  })
}

// ============================================================
// Step 1: fetch CSRF token + cookies from homepage
// ============================================================

async function fetchTokenAndCookies(): Promise<TokenAndCookies & { client: ReturnType<typeof createClient> }> {
  const c = createClient()
  const res = await c.get(LINKMARK_BASE + '/')
  const html = res.data as string
  const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/)
  if (!tokenMatch || !tokenMatch[1]) throw new Error('CSRF token not found in linkmark.ru homepage')
  const cookies = await c.defaults.jar!.getCookieString(LINKMARK_BASE)
  return { token: tokenMatch[1], cookies, client: c }
}

// ============================================================
// Step 2: submit search — axios follows redirects with cookies automatically
// ============================================================

export interface SubmitSearchParams {
  search: string
  mktu: number[]
  searchType?: '1' | '3' | '4'
  number?: string
  owner?: string
  token: string
  cookies: string
  client: ReturnType<typeof createClient>
}

interface SubmitSearchResult {
  requestUrl: string
  requestId: string | null
  html: string
}

async function submitSearch(params: SubmitSearchParams): Promise<SubmitSearchResult> {
  const body = new URLSearchParams()
  body.append('_token', params.token)

  if (params.searchType === '4' && params.owner) {
    body.append('search_4', params.owner)
    body.append('search_type', '4')
    body.append('vena_limit_subclass', '0')
    body.append('vena_limit_heading', '12')
  } else if (params.searchType === '3' && params.number) {
    body.append('search', params.number)
    body.append('search_type', '3')
  } else {
    body.append('search', params.search)
    body.append('search_type', '1')
    for (const c of params.mktu) body.append('mktu4[]', String(c))
    body.append('vena_limit_subclass', '0')
    body.append('vena_limit_heading', '12')
  }

  const res = await params.client.post(LINKMARK_BASE + '/search', body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: LINKMARK_BASE + '/',
      Origin: LINKMARK_BASE,
    },
    maxRedirects: 5,
  })

  const html = res.data as string
  const requestUrl = (res.request as any)?._redirectable?._currentUrl || res.config.url || LINKMARK_BASE + '/search'
  const idMatch = requestUrl.match(/\/request\/([^/?]+)/)
  const requestId = idMatch ? idMatch[1] : null

  return { requestUrl, requestId, html }
}

// ============================================================
//  Step 3: parse results HTML
// ============================================================

export function parseResults(html: string): {
  total: { trademarks: number | null; applications: number | null }
  results: LinkmarkResult[]
  requestId: string | null
} {
  const $ = cheerio.load(html)
  let trademarks: number | null = null
  let applications: number | null = null

  $('a').each((_, el) => {
    const text = $(el).text().trim()
    const tmMatch = text.match(/^([\d\s]+)\s*товарных\s*знаков/i)
    if (tmMatch) trademarks = parseInt(tmMatch[1].replace(/\s/g, ''), 10)
    const appMatch = text.match(/^([\d\s]+)\s*заявок/i)
    if (appMatch) applications = parseInt(appMatch[1].replace(/\s/g, ''), 10)
  })

  // Try to grab the request_id from a hidden input or data attribute
  let requestId: string | null = null
  const reqIdInput = $('#request_id').val()
  if (typeof reqIdInput === 'string' && reqIdInput) requestId = reqIdInput
  if (!requestId) {
    const dataId = $('button.btn-more').first().attr('data-id')
    if (dataId) requestId = dataId
  }

  const results: LinkmarkResult[] = []

  $('.result-div-item').each((_, el) => {
    const $item = $(el)
    const r: LinkmarkResult = {
      certificate: '',
      name: '',
      priorityDate: '',
      registrationDate: '',
      mktu: [],
      owner: '',
      unprotectedElements: '',
      sourceUrl: '',
      imageUrl: '',
      status: 'unknown',
      statusText: '',
    }

    const wordsPart = $item.find('.words-part').first().text().trim()
    if (wordsPart) r.name = wordsPart

    const certLink = $item.find('.result-div-item-number a').first()
    if (certLink.length > 0) r.certificate = certLink.text().trim()

    const mktuText = $item.find('.result-div-item-mktu').first().text().trim()
    if (mktuText) r.mktu = mktuText.split(',').map(s => s.trim()).filter(Boolean)

    const ownerText = $item.find('.result-div-item-owner').first().text().trim()
    if (ownerText) r.owner = ownerText

    // Fallback table parsing
    const table = $item.find('.result-div-item-v2 table').first()
    if (table.length > 0) {
      table.find('tr').each((_, tr) => {
        const $tr = $(tr)
        const key = $tr.find('th').first().text().trim()
        const val = $tr.find('td').first().text().trim()
        const isEmpty = !val || val === '\xa0'
        if (key === 'Свидетельство:' && !isEmpty) {
          if (!r.certificate) r.certificate = val
        } else if (key === 'Приоритет:' && !isEmpty) {
          r.priorityDate = val
        } else if (key === 'Дата регистрации:' && !isEmpty) {
          r.registrationDate = val
        } else if (key === 'МКТУ:' && !isEmpty) {
          if (r.mktu.length === 0) r.mktu = val.split(',').map(s => s.trim()).filter(Boolean)
        } else if (key === 'Правообладатель:' && !isEmpty) {
          if (!r.owner) r.owner = val
        } else if (key === 'Неохраняемые элементы товарного знака:' && !isEmpty) {
          r.unprotectedElements = val
        }
      })
    }

    // Status
    const $status = $item.find('.result-div-item-status').first()
    if ($status.length > 0) {
      const cls = $status.attr('class') || ''
      const statusText = $status.find('div').last().text().trim()
      const lower = statusText.toLowerCase()
      r.statusText = statusText
      if (cls.includes('status_2')) r.status = 'active'
      else if (cls.includes('status_1')) r.status = 'inactive'
      else if (cls.includes('status_4') || cls.includes('status_5') || lower.includes('истёк') || lower.includes('истек') || lower.includes('не продлён') || lower.includes('не продлен')) r.status = 'expired'
      else if (lower.includes('действует') && !lower.includes('не действует')) r.status = 'active'
      else if (lower.includes('не действует')) r.status = 'inactive'
    }

    // Image
    const imgSrc = $item.find('.result-div-item-image img').first().attr('src')
    if (imgSrc) {
      r.imageUrl = imgSrc.startsWith('http')
        ? imgSrc
        : imgSrc.startsWith('//')
          ? 'https:' + imgSrc
          : LINKMARK_BASE + (imgSrc.startsWith('/') ? '' : '/') + imgSrc
    }

    // Source URL
    const srcHref = $item.find('.result-div-item-action a.source').first().attr('href')
    if (srcHref && srcHref !== '#') r.sourceUrl = srcHref

    if (r.certificate || r.name || r.owner) results.push(r)
  })

  // Deduplicate by certificate (or name+owner if cert is missing)
  const seen = new Set<string>()
  const deduped: LinkmarkResult[] = []
  for (const r of results) {
    const key = r.certificate || r.name + '|' + r.owner
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }

  return { total: { trademarks, applications }, results: deduped, requestId }
}

// ============================================================
//  Step 4: load more results via /request.json/{id}
// ============================================================

interface RawMoreItem {
  doc_num?: string
  words?: string
  formatted_priority_date?: string
  priority?: string
  formatted_reg_date?: string
  reg_date?: string
  code?: string
  src_image_link?: string
  image_link?: string
  owner?: { name?: string }
  unprotected?: string
  unprotect?: string
  link?: string
  status_name?: { class?: string; name?: string }
}

function mapMoreItem(e: RawMoreItem): LinkmarkResult {
  const cls = e.status_name?.class || ''
  const statusName = e.status_name?.name || ''
  let status: LinkmarkResult['status'] = 'unknown'
  const lower = statusName.toLowerCase()
  if (cls.includes('status_2')) status = 'active'
  else if (cls.includes('status_1')) status = 'inactive'
  else if (cls.includes('status_4') || cls.includes('status_5') || lower.includes('истёк') || lower.includes('не продлён')) status = 'expired'
  else if (lower.includes('действует') && !lower.includes('не действует')) status = 'active'
  else if (lower.includes('не действует')) status = 'inactive'

  const mktu = (e.code || '').split(',').map(s => s.trim()).filter(Boolean)
  const imgRaw = e.src_image_link || e.image_link || ''
  const imageUrl = imgRaw
    ? imgRaw.startsWith('http')
      ? imgRaw
      : imgRaw.startsWith('//')
        ? 'https:' + imgRaw
        : LINKMARK_BASE + (imgRaw.startsWith('/') ? '' : '/') + imgRaw
    : ''

  return {
    certificate: e.doc_num || '',
    name: e.words || '',
    priorityDate: e.formatted_priority_date || e.priority || '',
    registrationDate: e.formatted_reg_date || e.reg_date || '',
    mktu,
    owner: e.owner?.name || '',
    unprotectedElements: e.unprotected || e.unprotect || '',
    sourceUrl: e.link || '',
    imageUrl,
    status,
    statusText: statusName,
  }
}

export async function loadMoreResults(params: {
  requestId: string
  offset: number
  num?: number
}): Promise<LinkmarkMoreResponse> {
  const num = params.num || 100

  // Refresh cookies + XSRF token via axios (cookie jar handles everything)
  await client.get(LINKMARK_BASE + '/')
  const cookies = await cookieJar.getCookieString(LINKMARK_BASE)
  const xsrfMatch = cookies.split('; ').find(c => c.startsWith('XSRF-TOKEN='))
  let xsrf = ''
  if (xsrfMatch) {
    const raw = xsrfMatch.slice(11)
    try { xsrf = decodeURIComponent(raw) } catch { xsrf = raw }
  }
  if (!xsrf) throw new Error('Could not obtain XSRF-TOKEN from linkmark.ru')

  const body = new URLSearchParams({
    type: 'm',
    num: String(num),
    offset: String(params.offset),
  })

  const res = await client.post(`${LINKMARK_BASE}/request.json/${params.requestId}`, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': xsrf,
      Referer: `${LINKMARK_BASE}/request/${params.requestId}?new=1`,
      Origin: LINKMARK_BASE,
    },
  })

  const data = res.data as { res?: RawMoreItem[]; count?: number }
  const items = (Array.isArray(data.res) ? data.res : []).map(mapMoreItem)
  const totalCount = typeof data.count === 'number' ? data.count : null
  const hasMore = totalCount !== null
    ? params.offset + items.length < totalCount
    : items.length === num

  return { ok: true, results: items, total: totalCount, hasMore }
}

// ============================================================
//  Public: searchTrademarks
// ============================================================

export async function searchTrademarks(params: {
  search: string
  mktu: number[]
  searchType?: '1' | '3' | '4'
  number?: string
  owner?: string
}): Promise<LinkmarkSearchResponse> {
  const { token, cookies, client } = await fetchTokenAndCookies()
  const { requestUrl, requestId, html } = await submitSearch({
    search: params.search,
    mktu: params.mktu,
    searchType: params.searchType,
    number: params.number,
    owner: params.owner,
    token,
    cookies,
    client,
  })
  const parsed = parseResults(html)
  return {
    ok: true,
    total: parsed.total,
    results: parsed.results,
    requestId: parsed.requestId || requestId,
    requestUrl,
    hasMore: !!parsed.requestId,
  }
}
