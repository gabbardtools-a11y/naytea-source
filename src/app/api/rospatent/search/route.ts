import { NextRequest, NextResponse } from 'next/server'
import { searchTrademarks } from '@/lib/rospatent-d1'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/rospatent/search
 * Body: { search: string, page?: number, pageSize?: number }
 *
 * Searches Rospatent trademarks by right_holder (owner) name.
 * Note: Rospatent open data CSV doesn't include the trademark NAME itself —
 * only the owner name, dates, status, and publication URL.
 * For full-text trademark name search, use /api/brand-search/search.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const search = (body.search || '').toString().trim()
    const page = body.page ? parseInt(body.page, 10) : 1
    const pageSize = body.pageSize ? parseInt(body.pageSize, 10) : 100

    if (!search) {
      return NextResponse.json(
        { ok: false, error: 'Поисковый запрос обязателен' },
        { status: 400 },
      )
    }

    const result = await searchTrademarks({ search, page, pageSize })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, results: [], total: 0, hasMore: false },
      { status: 500 },
    )
  }
}
