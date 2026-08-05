import { NextRequest, NextResponse } from 'next/server'
import { searchBySubject } from '@/lib/brand-search-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/brand-search/by-subject
 * Body: { tin?: string, psrn?: string, ogrnip?: string, page?: number, pageSize?: number }
 *
 * Returns all trademarks owned by a specific company/person.
 * Used for "due diligence" — find all IP assets of a competitor.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Accept at least one identifier
    const tin = body.tin ? String(body.tin).trim() : undefined
    const psrn = body.psrn ? String(body.psrn).trim() : undefined
    const ogrnip = body.ogrnip ? String(body.ogrnip).trim() : undefined
    const subjectId = body.subjectId ? String(body.subjectId).trim() : undefined

    if (!tin && !psrn && !ogrnip && !subjectId) {
      return NextResponse.json(
        { ok: false, error: 'Укажите хотя бы один идентификатор: ИНН, ОГРН, ОГРНИП или subject_id' },
        { status: 400 },
      )
    }

    // Basic format validation
    if (tin && !/^\d{10,12}$/.test(tin)) {
      return NextResponse.json(
        { ok: false, error: 'ИНН должен содержать 10-12 цифр' },
        { status: 400 },
      )
    }
    if (psrn && !/^\d{13,15}$/.test(psrn)) {
      return NextResponse.json(
        { ok: false, error: 'ОГРН должен содержать 13-15 цифр' },
        { status: 400 },
      )
    }
    if (ogrnip && !/^\d{13,15}$/.test(ogrnip)) {
      return NextResponse.json(
        { ok: false, error: 'ОГРНИП должен содержать 13-15 цифр' },
        { status: 400 },
      )
    }

    const page = body.page ? parseInt(body.page, 10) : 1
    const pageSize = body.pageSize ? parseInt(body.pageSize, 10) : 100

    const result = await searchBySubject({
      tin, psrn, ogrnip, subjectId, page, pageSize,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, results: [], total: 0, hasMore: false },
      { status: 500 },
    )
  }
}
