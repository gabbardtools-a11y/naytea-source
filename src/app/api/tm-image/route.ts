import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Image proxy — bypasses CORS + Authorization for trademark images.
 *
 * Supported upstreams:
 *   - tm-api.codeontime.ru (brand-search.ru API storage)
 *   - brand-search.ru (CDN fallback)
 *   - linkmark.ru (TM images)
 *
 * Usage: /api/tm-image?url=<absolute-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }
  
  // Allow only known safe upstreams
  const ALLOWED_PREFIXES = [
    'https://tm-api.codeontime.ru/',
    'https://brand-search.ru/',
    'https://linkmark.ru/',
    'https://www.linkmark.ru/',
  ]
  if (!ALLOWED_PREFIXES.some(p => url.startsWith(p))) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // tm-api.codeontime.ru/storage/ returns 404 — use brand-search.ru as CDN instead
  const fetchUrl = url.replace('https://tm-api.codeontime.ru/', 'https://brand-search.ru/')

  try {
    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        // linkmark.ru may need Referer to serve images
        ...(fetchUrl.includes('linkmark.ru') ? { Referer: 'https://linkmark.ru/' } : {}),
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buf = await res.arrayBuffer()

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}
