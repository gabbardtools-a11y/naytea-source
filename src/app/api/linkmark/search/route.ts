import { NextRequest, NextResponse } from 'next/server'
import { searchTrademarks } from '@/lib/linkmark'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/linkmark/search
 * Body: {
 *   search: string,            // required
 *   mktu?: number[],
 *   searchType?: '1' | '3' | '4',  // 1=name, 3=number, 4=owner
 *   number?: string,           // for searchType='3'
 *   owner?: string,            // for searchType='4'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const search = (body.search || '').toString().trim()
    const mktu: number[] = Array.isArray(body.mktu)
      ? body.mktu.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 45)
      : []

    if (!search) {
      return NextResponse.json(
        { ok: false, error: 'Поисковый запрос обязателен' },
        { status: 400 },
      )
    }

    const searchType = body.searchType === '3' || body.searchType === '4'
      ? body.searchType
      : '1'

    const params: Parameters<typeof searchTrademarks>[0] = { search, mktu, searchType }
    if (searchType === '3') {
      params.number = (body.number || search).toString().trim()
    } else if (searchType === '4') {
      params.owner = (body.owner || search).toString().trim()
    }

    const result = await searchTrademarks(params)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, results: [], total: 0, hasMore: false },
      { status: 500 },
    )
  }
}
