import { NextRequest, NextResponse } from 'next/server'
import { searchByRegistrationNumber } from '@/lib/rospatent-d1'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/rospatent/by-number
 * Body: { number: string }
 *
 * Look up trademark(s) by registration number (exact, then prefix match).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const number = (body.number || '').toString().trim()

    if (!number) {
      return NextResponse.json(
        { ok: false, error: 'Номер регистрации обязателен' },
        { status: 400 },
      )
    }

    if (!/^\d{1,10}$/.test(number)) {
      return NextResponse.json(
        { ok: false, error: 'Номер должен содержать только цифры (1-10 знаков)' },
        { status: 400 },
      )
    }

    const result = await searchByRegistrationNumber({ number })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, results: [], total: 0, hasMore: false },
      { status: 500 },
    )
  }
}
