import * as cheerio from 'cheerio'
import { getCookieHeader, getXsrfToken, isAuthenticated, getLoginEmail } from './linkmark-auth'

const LINKMARK_BASE = 'https://linkmark.ru'

export interface SearchResult {
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

export interface SearchResponse {
  ok: boolean
  query: { search: string; mktu: number[]; searchType: string }
  total: { trademarks: number | null; applications: number | null }
  results: SearchResult[]
  requestUrl: string | null
  requestId: string | null
  loaded: number
  authenticated: boolean
  loginEmail: string | null
  error?: string
}

export interface MoreResultsResponse {
  ok: boolean
  requestId: string
  results: SearchResult[]
  loaded: number
  total: number | null
  hasMore: boolean
  error?: string
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/**
 * Fetches linkmark.ru homepage to extract CSRF token and merge with saved
 * session cookies. When saved cookies include `laravel_session`, the request
 * is authenticated and paid features (full result set, balance) become
 * available.
 */
export async function fetchTokenAndCookies(): Promise<{
  token: string
  cookies: string
  authenticated: boolean
}> {
  const savedCookies = await getCookieHeader()
  const xsrf = await getXsrfToken()

  const res = await fetch(LINKMARK_BASE + '/', {
    method: 'GET',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      ...(savedCookies ? { Cookie: savedCookies } : {}),
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch linkmark.ru homepage: HTTP ${res.status}`)
  }

  const html = await res.text()
  const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/)
  if (!tokenMatch || !tokenMatch[1]) {
    throw new Error('CSRF token not found in linkmark.ru homepage')
  }

  // Merge any newly-set cookies with the saved ones (saved cookies take
  // precedence — they carry our authenticated session).
  const newCookies = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
  const merged = new Map<string, string>()
  // Parse saved cookies first
  if (savedCookies) {
    for (const part of savedCookies.split('; ')) {
      const eq = part.indexOf('=')
      if (eq !== -1) merged.set(part.slice(0, eq), part.slice(eq + 1))
    }
  }
  // Then overlay new cookies (don't overwrite existing saved ones)
  for (const c of newCookies) {
    const eq = c.indexOf('=')
    if (eq !== -1) {
      const name = c.slice(0, eq)
      if (!merged.has(name)) merged.set(name, c.slice(eq + 1))
    }
  }

  const cookieHeader = Array.from(merged.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')

  return {
    token: tokenMatch[1],
    cookies: cookieHeader,
    authenticated: await isAuthenticated(),
  }
}

/**
 * Submits the search form to linkmark.ru and follows the redirect to
 * /request/{id}?new=1 — the results page.
 */
export async function submitSearch(params: {
  token: string
  cookies: string
  search: string
  mktu: number[]
  searchType: string
  owner?: string
  number?: string
}): Promise<{ requestUrl: string; requestId: string | null; html: string }> {
  const formData = new URLSearchParams()
  formData.append('_token', params.token)

  if (params.searchType === '4' && params.owner) {
    formData.append('search_4', params.owner)
    formData.append('search_type', '4')
  } else if (params.searchType === '3' && params.number) {
    formData.append('search', params.number)
    formData.append('search_type', '3')
  } else {
    formData.append('search', params.search)
    formData.append('search_type', '1')
    params.mktu.forEach((n) => {
      formData.append('mktu4[]', String(n))
    })
    formData.append('vena_limit_subclass', '0')
    formData.append('vena_limit_heading', '12')
  }

  const res = await fetch(LINKMARK_BASE + '/search', {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      Referer: LINKMARK_BASE + '/',
      Cookie: params.cookies,
      Origin: LINKMARK_BASE,
    },
    body: formData.toString(),
  })

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location')
    if (!location) throw new Error('Redirect location missing')
    const requestUrl = location.startsWith('http')
      ? location
      : LINKMARK_BASE + (location.startsWith('/') ? '' : '/') + location

    // Extract requestId from URL: /request/{base64-id}?new=1
    const requestId = extractRequestId(requestUrl)

    // Merge new cookies
    const newCookies = res.headers.getSetCookie().map((c) => c.split(';')[0])
    const mergedCookies = mergeCookies(params.cookies, newCookies)

    const resultsRes = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        Referer: LINKMARK_BASE + '/',
        Cookie: mergedCookies,
      },
    })

    if (!resultsRes.ok) {
      throw new Error(`Failed to fetch results page: HTTP ${resultsRes.status}`)
    }

    const html = await resultsRes.text()
    return { requestUrl, requestId, html }
  }

  if (res.ok) {
    const html = await res.text()
    return { requestUrl: LINKMARK_BASE + '/search', requestId: null, html }
  }

  throw new Error(`Search failed: HTTP ${res.status}`)
}

function extractRequestId(url: string): string | null {
  // URL looks like: https://linkmark.ru/request/MDJCeFhWMzB6QUx2VVRUcjRXSVFrUT09?new=1
  const m = url.match(/\/request\/([^/?]+)/)
  return m ? m[1] : null
}

function mergeCookies(existing: string, newCookies: string[]): string {
  const merged = new Map<string, string>()
  if (existing) {
    for (const part of existing.split('; ')) {
      const eq = part.indexOf('=')
      if (eq !== -1) merged.set(part.slice(0, eq), part.slice(eq + 1))
    }
  }
  for (const c of newCookies) {
    const eq = c.indexOf('=')
    if (eq !== -1) {
      const name = c.slice(0, eq)
      if (!merged.has(name)) merged.set(name, c.slice(eq + 1))
    }
  }
  return Array.from(merged.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

/**
 * Parses the search results HTML to extract trademark cards.
 * Structure documented in the linkmark.ru parser:
 *   .result-div-item > .result-div-item-{sequence,image,number,mktu,owner,v2,status,action}
 */
export function parseResults(html: string): {
  total: { trademarks: number | null; applications: number | null }
  results: SearchResult[]
  requestId: string | null
} {
  const $ = cheerio.load(html)
  const results: SearchResult[] = []

  let trademarks: number | null = null
  let applications: number | null = null

  $('a').each((_, el) => {
    const text = $(el).text().trim()
    const tmMatch = text.match(/^([\d\s]+)\s*товарных\s*знаков/i)
    if (tmMatch) trademarks = parseInt(tmMatch[1].replace(/\s/g, ''), 10)
    const appMatch = text.match(/^([\d\s]+)\s*заявок/i)
    if (appMatch) applications = parseInt(appMatch[1].replace(/\s/g, ''), 10)
  })

  // Extract request_id (used for "load more" AJAX calls)
  let requestId: string | null = null
  const requestIdInput = $('#request_id').val()
  if (typeof requestIdInput === 'string' && requestIdInput) {
    requestId = requestIdInput
  } else {
    const moreBtn = $('button.btn-more').first()
    const dataId = moreBtn.attr('data-id')
    if (dataId) requestId = dataId
  }

  $('.result-div-item').each((_, item) => {
    const $item = $(item)
    const result: SearchResult = {
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
    if (wordsPart) result.name = wordsPart

    const numberLink = $item.find('.result-div-item-number a').first()
    if (numberLink.length > 0) result.certificate = numberLink.text().trim()

    const mktuDiv = $item.find('.result-div-item-mktu').first().text().trim()
    if (mktuDiv) {
      result.mktu = mktuDiv.split(',').map((s) => s.trim()).filter(Boolean)
    }

    const ownerDiv = $item.find('.result-div-item-owner').first().text().trim()
    if (ownerDiv) result.owner = ownerDiv

    const $table = $item.find('.result-div-item-v2 table').first()
    if ($table.length > 0) {
      $table.find('tr').each((_, tr) => {
        const $tr = $(tr)
        const header = $tr.find('th').first().text().trim()
        const cell = $tr.find('td').first()
        const cellText = cell.text().trim()
        const isNbspOnly = !cellText || cellText === '\u00a0'

        if (header === 'Свидетельство:' && !isNbspOnly) {
          if (!result.certificate) result.certificate = cellText
        } else if (header === 'Приоритет:' && !isNbspOnly) {
          result.priorityDate = cellText
        } else if (header === 'Дата регистрации:' && !isNbspOnly) {
          result.registrationDate = cellText
        } else if (header === 'МКТУ:' && !isNbspOnly) {
          if (result.mktu.length === 0) {
            result.mktu = cellText.split(',').map((s) => s.trim()).filter(Boolean)
          }
        } else if (header === 'Правообладатель:' && !isNbspOnly) {
          if (!result.owner) result.owner = cellText
        } else if (header === 'Неохраняемые элементы товарного знака:' && !isNbspOnly) {
          result.unprotectedElements = cellText
        }
      })
    }

    const $statusDiv = $item.find('.result-div-item-status').first()
    if ($statusDiv.length > 0) {
      const statusClass = $statusDiv.attr('class') || ''
      const $statusTextEl = $statusDiv.find('div').last()
      const statusText = $statusTextEl.text().trim()
      const lower = statusText.toLowerCase()
      result.statusText = statusText

      if (statusClass.includes('status_2')) result.status = 'active'
      else if (statusClass.includes('status_1')) result.status = 'inactive'
      else if (
        statusClass.includes('status_4') ||
        statusClass.includes('status_5') ||
        lower.includes('истёк') ||
        lower.includes('истек') ||
        lower.includes('не продлён') ||
        lower.includes('не продлен')
      ) {
        result.status = 'expired'
      } else if (lower.includes('действует') && !lower.includes('не действует')) {
        result.status = 'active'
      } else if (lower.includes('не действует')) {
        result.status = 'inactive'
      }
    }

    const imageUrl = $item.find('.result-div-item-image img').first().attr('src')
    if (imageUrl) {
      result.imageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : imageUrl.startsWith('//')
          ? 'https:' + imageUrl
          : LINKMARK_BASE + (imageUrl.startsWith('/') ? '' : '/') + imageUrl
    }

    const sourceLink = $item.find('.result-div-item-action a.source').first().attr('href')
    if (sourceLink && sourceLink !== '#') result.sourceUrl = sourceLink

    if (result.certificate || result.name || result.owner) results.push(result)
  })

  // Deduplicate by certificate number
  const seen = new Set<string>()
  const deduped: SearchResult[] = []
  for (const r of results) {
    const key = r.certificate || r.name + '|' + r.owner
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }

  return {
    total: { trademarks, applications },
    results: deduped,
    requestId,
  }
}

/**
 * Calls linkmark.ru's AJAX endpoint to load more results.
 * Endpoint: POST /request.json/{requestId}
 * Body: type=m&num=100&offset=N
 *
 * Works in both authenticated and anonymous modes — if no saved cookies are
 * available, falls back to fetching a fresh XSRF-TOKEN from the linkmark.ru
 * homepage (the same token an anonymous browser session would receive).
 */
export async function loadMoreResults(params: {
  requestId: string
  offset: number
  num?: number
}): Promise<{ results: SearchResult[]; total: number | null; hasMore: boolean }> {
  const num = params.num || 100
  let cookies = await getCookieHeader()
  let xsrf = await getXsrfToken()

  // Anonymous fallback: if no saved cookies, fetch a fresh XSRF-TOKEN from
  // the linkmark.ru homepage. The endpoint works without authentication.
  if (!xsrf) {
    const homeRes = await fetch(LINKMARK_BASE + '/', {
      method: 'GET',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
    })
    if (homeRes.ok) {
      const newCookies = homeRes.headers
        .getSetCookie()
        .map((c) => c.split(';')[0])
        .join('; ')
      const xsrfCookie = newCookies
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='))
      if (xsrfCookie) {
        const raw = xsrfCookie.slice('XSRF-TOKEN='.length)
        try {
          xsrf = decodeURIComponent(raw)
        } catch {
          xsrf = raw
        }
        cookies = newCookies
      }
    }
  }

  if (!xsrf) {
    throw new Error('Could not obtain XSRF-TOKEN from linkmark.ru')
  }

  const body = new URLSearchParams({
    type: 'm',
    num: String(num),
    offset: String(params.offset),
  })

  const res = await fetch(`${LINKMARK_BASE}/request.json/${params.requestId}`, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': xsrf,
      Referer: `${LINKMARK_BASE}/request/${params.requestId}?new=1`,
      ...(cookies ? { Cookie: cookies } : {}),
      Origin: LINKMARK_BASE,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    throw new Error(`loadMore failed: HTTP ${res.status}`)
  }

  const data = await res.json() as {
    res: LinkmarkJsonItem[]
    count?: number
  }
  const items = Array.isArray(data.res) ? data.res : []
  const results = items.map(jsonItemToSearchResult)
  const total = typeof data.count === 'number' ? data.count : null
  const hasMore = total !== null ? params.offset + results.length < total : results.length === num

  return { results, total, hasMore }
}

interface LinkmarkJsonItem {
  id: number
  doc_num: string
  words: string
  code: string
  owner?: { name: string }
  status_name?: { name: string; class: string }
  status?: number
  unprotected?: string | null
  unprotect?: string | null
  link?: string | null
  src_image_link?: string | null
  image_link?: string | null
  formatted_priority_date?: string
  formatted_reg_date?: string
  priority?: string
  reg_date?: string
}

function jsonItemToSearchResult(item: LinkmarkJsonItem): SearchResult {
  const statusClass = item.status_name?.class || ''
  const statusText = item.status_name?.name || ''
  let status: SearchResult['status'] = 'unknown'
  const lower = statusText.toLowerCase()
  if (statusClass.includes('status_2')) status = 'active'
  else if (statusClass.includes('status_1')) status = 'inactive'
  else if (
    statusClass.includes('status_4') ||
    statusClass.includes('status_5') ||
    lower.includes('истёк') ||
    lower.includes('не продлён')
  ) {
    status = 'expired'
  } else if (lower.includes('действует') && !lower.includes('не действует')) {
    status = 'active'
  } else if (lower.includes('не действует')) {
    status = 'inactive'
  }

  const mktu = (item.code || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const imageUrl = item.src_image_link || item.image_link || ''
  const fullImageUrl = imageUrl
    ? imageUrl.startsWith('http')
      ? imageUrl
      : imageUrl.startsWith('//')
        ? 'https:' + imageUrl
        : LINKMARK_BASE + (imageUrl.startsWith('/') ? '' : '/') + imageUrl
    : ''

  return {
    certificate: item.doc_num || '',
    name: item.words || '',
    priorityDate: item.formatted_priority_date || item.priority || '',
    registrationDate: item.formatted_reg_date || item.reg_date || '',
    mktu,
    owner: item.owner?.name || '',
    unprotectedElements: item.unprotected || item.unprotect || '',
    sourceUrl: item.link || '',
    imageUrl: fullImageUrl,
    status,
    statusText,
  }
}

/**
 * Reads the saved login email (informational — used to show which account
 * the proxy is authenticated as).
 */
export async function getAuthInfo(): Promise<{ authenticated: boolean; loginEmail: string | null }> {
  return {
    authenticated: await isAuthenticated(),
    loginEmail: await getLoginEmail(),
  }
}
