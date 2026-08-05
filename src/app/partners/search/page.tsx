'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Search, Plus, X, AlertTriangle, ShieldCheck, ShieldAlert,
  Loader2, Download, Lightbulb, Layers, Scale, ExternalLink,
  FileText, Briefcase, Building2, Hash, Clock, Award, Zap,
  ArrowRight, ArrowLeft, Image as ImageIcon, Upload,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { MKTU_CLASSES } from '@/lib/mktu'
import { OKVED_SECTIONS, okvedToMktu } from '@/lib/okved'
import { exportToRTF } from '@/lib/rtf-export'
import { exportToSVG } from '@/lib/svg-export'

// ============================================================
//  /partners/search — публичная embed-страница для партнёров
//  • Принудительная СВЕТЛАЯ тема (даже если на NayTea по умолчанию тёмная)
//  • Полная поисковая форма как на главной NayTea
//  • Результаты, оценка рисков, экспорт — всё работает
//  • Без header-навигации и Hero — только форма + результаты
//  • Footer «Powered by NayTea»
// ============================================================

type Source = 'linkmark' | 'brand-search' | 'wipo' | 'rospatent'
type SearchMode = 'name' | 'number' | 'owner'

interface UnifiedResult {
  id: string
  source: Source
  certificate: string
  name: string
  status: string
  statusText: string
  statusFips?: number
  markType?: string
  similarity?: number
  score?: number
  owner: string
  country?: string
  imageUrl: string
  mktu: (number | string)[]
  catalog?: string
  countries?: string[]
  disclaimer?: string | null
  priorityDate: string
  registrationDate: string
  expirationDate: string
  sourceUrl: string
}

const PAGE_SIZE = 60

const SOURCE_LABELS: Record<Source, { label: string; color: string; dot: string }> = {
  'linkmark': { label: 'linkmark.ru', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  'brand-search': { label: 'brand-search.ru', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  'wipo': { label: 'WIPO GBD', color: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  'rospatent': { label: 'Роспатент (D1)', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
}

// Note: this page uses hardcoded light-theme Tailwind classes (bg-white, text-slate-900, etc.)
// without `dark:` variants — so it always renders in light colors regardless of NayTea's theme.
// Background is transparent so the parent site's background shows through.

export default function PartnersSearchPage() {
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('name')
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UnifiedResult[]>([])
  const [totalFound, setTotalFound] = useState<number | null>(null)
  const [linkmarkLoading, setLinkmarkLoading] = useState(false)
  const [linkmarkTotal, setLinkmarkTotal] = useState<number | null>(null)
  const [linkmarkResults, setLinkmarkResults] = useState<UnifiedResult[]>([])
  const [linkmarkHasMore, setLinkmarkHasMore] = useState(false)
  const [linkmarkLoadingMore, setLinkmarkLoadingMore] = useState(false)
  const [imageSearching, setImageSearching] = useState(false)
  const [riskLevel, setRiskLevel] = useState<'high' | 'medium' | 'low' | null>(null)
  const [showRiskAssessment, setShowRiskAssessment] = useState(false)

  // Filters
  const [activeFilter, setActiveFilter] = useState<'mktu' | 'okved' | 'subject' | null>(null)
  const [mktuClasses, setMktuClasses] = useState<number[]>([])
  const [mktuSearch, setMktuSearch] = useState('')
  const [okvedSections, setOkvedSections] = useState<string[]>([])
  const [subjectTin, setSubjectTin] = useState('')
  const [subjectPsrn, setSubjectPsrn] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { toast } = useToast()

  const filteredMktu = MKTU_CLASSES.filter(c => {
    if (!mktuSearch) return true
    const q = mktuSearch.toLowerCase()
    return String(c.number).includes(q) || c.title.toLowerCase().includes(q)
  })

  // (No theme manipulation needed — page uses hardcoded light Tailwind classes + transparent bg)

  // Read ?q= from URL on mount (so parent can pre-fill search)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setSearch(q)
      setTimeout(() => handleSearch(q), 300)
    }
  }, [])

  const toggleMktu = (n: number) => {
    setMktuClasses(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  const toggleOkved = (code: string) => {
    setOkvedSections(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code])
  }

  const assessRisk = (query: string, found: number) => {
    const q = query.toLowerCase().trim()
    if (!q) return null
    if (found === 0) return 'low'
    if (found > 20) return 'high'
    const exactMatch = results.some(r => r.name.toLowerCase() === q)
    if (exactMatch) return 'high'
    return 'medium'
  }

  const searchLinkmark = async (query: string, mode: SearchMode) => {
    setLinkmarkLoading(true)
    try {
      const body: any = { search: query, mktu: [], searchType: '4', owner: query }
      const res = await fetch('/api/linkmark/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) return
      const data = await res.json()
      const mapped = (data.results || []).map((r: any): UnifiedResult => ({
        id: `lm-${r.certificate}`,
        source: 'linkmark',
        certificate: r.certificate || '—',
        name: r.name || 'Без названия',
        status: r.status || 'unknown',
        statusText: r.statusText || r.status || '—',
        statusFips: r.statusFips,
        markType: r.markType,
        owner: r.owner || '—',
        country: r.country,
        imageUrl: r.imageUrl || '',
        mktu: r.mktu || [],
        priorityDate: r.priorityDate || '—',
        registrationDate: r.registrationDate || '—',
        expirationDate: r.expirationDate || '—',
        sourceUrl: r.sourceUrl || '#',
      }))
      setLinkmarkResults(mapped)
      // total from linkmark can be either number or object {trademarks, applications}
      const total = typeof data.total === 'number'
        ? data.total
        : (data.total?.trademarks || 0) + (data.total?.applications || 0) || mapped.length
      setLinkmarkTotal(total)
      setLinkmarkHasMore(mapped.length >= 50)
    } catch (e) {
      // silent
    } finally {
      setLinkmarkLoading(false)
    }
  }

  const handleSearch = async (overrideQuery?: string) => {
    const hasSubject = !!(subjectTin.trim() || subjectPsrn.trim())
    const q = overrideQuery ?? search

    if (!hasSubject && !q.trim()) {
      toast({ title: 'Введите название или ИНН/ОГРН', variant: 'destructive' })
      return
    }

    setLoading(true)
    setHasSearched(true)
    setResults([])
    setTotalFound(null)
    setLinkmarkResults([])
    setLinkmarkTotal(null)

    // Linkmark parallel
    if (!hasSubject && q.trim()) {
      searchLinkmark(q.trim(), searchMode)
    }

    try {
      const allMktu = [
        ...mktuClasses,
        ...okvedSections.flatMap(code => okvedToMktu(code) || []),
      ]
      const body: any = {
        search: q.trim(),
        mktu: allMktu,
        pageSize: PAGE_SIZE,
        searchMode: 'standard',
      }
      if (hasSubject) {
        body.subjectTin = subjectTin.trim() || undefined
        body.subjectPsrn = subjectPsrn.trim() || undefined
        body.searchMode = 'subject'
      }

      const res = await fetch('/api/brand-search/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const mapped = (data.results || []).map((r: any): UnifiedResult => ({
        id: `bs-${r.certificate}`,
        source: 'brand-search',
        certificate: r.certificate || '—',
        name: r.name || 'Без названия',
        status: r.status || 'unknown',
        statusText: r.statusText || r.status || '—',
        statusFips: r.statusFips,
        markType: r.markType,
        owner: r.owner || '—',
        country: r.country,
        imageUrl: r.imageUrl || '',
        mktu: r.mktu || [],
        priorityDate: r.priorityDate || '—',
        registrationDate: r.registrationDate || '—',
        expirationDate: r.expirationDate || '—',
        sourceUrl: r.sourceUrl || '#',
      }))
      setResults(mapped)
      setTotalFound(data.total || mapped.length)
      setPage(1)
      setTotalPages(Math.ceil((data.total || mapped.length) / PAGE_SIZE))
      setRiskLevel(assessRisk(q, data.total || mapped.length))
    } catch (e: any) {
      toast({ title: 'Ошибка поиска', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    const nextPage = page + 1
    setLinkmarkLoadingMore(true)
    try {
      const res = await fetch('/api/brand-search/more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: nextPage, pageSize: PAGE_SIZE, search: search.trim(), requestId: null }),
      })
      if (!res.ok) return
      const data = await res.json()
      const mapped = (data.results || []).map((r: any): UnifiedResult => ({
        id: `bs-${r.certificate}-${nextPage}`,
        source: 'brand-search',
        certificate: r.certificate || '—',
        name: r.name || 'Без названия',
        status: r.status || 'unknown',
        statusText: r.statusText || r.status || '—',
        owner: r.owner || '—',
        imageUrl: r.imageUrl || '',
        mktu: r.mktu || [],
        priorityDate: r.priorityDate || '—',
        registrationDate: r.registrationDate || '—',
        expirationDate: r.expirationDate || '—',
        sourceUrl: r.sourceUrl || '#',
      }))
      setResults(prev => [...prev, ...mapped])
      setPage(nextPage)
    } catch (e) {
      // silent
    } finally {
      setLinkmarkLoadingMore(false)
    }
  }

  const handleImageSearch = async (file: File) => {
    setImageSearching(true)
    setHasSearched(true)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/brand-search/image', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const mapped = (data.results || []).map((r: any): UnifiedResult => ({
        id: `bs-img-${r.certificate}`,
        source: 'brand-search',
        certificate: r.certificate || '—',
        name: r.name || 'Без названия',
        status: r.status || 'unknown',
        statusText: r.statusText || r.status || '—',
        owner: r.owner || '—',
        imageUrl: r.imageUrl || '',
        mktu: r.mktu || [],
        priorityDate: r.priorityDate || '—',
        registrationDate: r.registrationDate || '—',
        expirationDate: r.expirationDate || '—',
        sourceUrl: r.sourceUrl || '#',
        similarity: r.similarity,
      }))
      setResults(mapped)
      setTotalFound(mapped.length)
      setRiskLevel(null)
    } catch (e: any) {
      toast({ title: 'Ошибка поиска по изображению', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
      setImageSearching(false)
    }
  }

  const handleExport = () => {
    const all = [...results, ...linkmarkResults]
    if (all.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' })
      return
    }
    exportToRTF(all.map(r => ({
      certificate: r.certificate,
      name: r.name,
      status: r.statusText,
      owner: r.owner,
      mktu: r.mktu,
      source: r.source,
      sourceUrl: r.sourceUrl,
    })))
  }

  const handleExportSVG = async () => {
    const all = [...results, ...linkmarkResults]
    if (all.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' })
      return
    }
    toast({ title: 'Генерация SVG...', description: 'Загружаем изображения — подождите' })
    await exportToSVG(all.map(r => ({
      certificate: r.certificate,
      name: r.name,
      status: r.statusText,
      owner: r.owner,
      imageUrl: r.imageUrl,
    })))
  }

  const allMktuSelected = [
    ...mktuClasses,
    ...okvedSections.flatMap(code => okvedToMktu(code) || []),
  ]

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col">
      <main className="flex-1 relative">
        {/* Floating export buttons (top-right, only when results exist) */}
        {results.length > 0 && (
          <div className="sticky top-2 z-30 flex justify-end gap-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex gap-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-sm p-1">
              <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1" />
                RTF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportSVG} className="h-8 text-xs">
                <FileText className="w-3.5 h-3.5 mr-1" />
                SVG
              </Button>
            </div>
          </div>
        )}
        {/* ============ SEARCH FORM BLOCK ============ */}
        <section className="relative">
          <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
            {/* Database freshness badge */}
            <div className="flex items-center justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                База от 2026-04-10
              </span>
            </div>

            {/* Search form card — transparent bg, inherits parent site's background */}
            <div className="bg-transparent rounded-2xl border border-slate-300/60 p-5 md:p-6">
              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4 max-w-md mx-auto">
                <button
                  onClick={() => setSearchMode('name')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    searchMode === 'name'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  По названию
                </button>
                <button
                  onClick={() => setSearchMode('number')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    searchMode === 'number'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  По номеру
                </button>
                <button
                  onClick={() => setSearchMode('owner')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    searchMode === 'owner'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  По владельцу
                </button>
              </div>

              {/* Search input + button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder={
                      subjectTin || subjectPsrn
                        ? 'Поиск по ИНН/ОГРН — название не требуется'
                        : searchMode === 'number' ? 'Номер свидетельства (например, 80445)...'
                        : searchMode === 'owner' ? 'Наименование владельца...'
                        : 'Укажите товарный знак или название'
                    }
                    className="pl-11 h-12 text-base transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-blue-400"
                    disabled={!!(subjectTin || subjectPsrn)}
                  />
                </div>
                <Button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="h-12 px-7 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Проверить
                </Button>
              </div>

              {/* Image search — drag & drop */}
              <div className="mt-3">
                <label
                  className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-blue-300 rounded-lg py-3 px-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group bg-blue-50"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-100') }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100') }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100')
                    const file = e.dataTransfer.files[0]
                    if (file && file.type.startsWith('image/')) {
                      handleImageSearch(file)
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageSearch(file)
                    }}
                  />
                  {imageSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-600 font-medium">Ищем по изображению…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-blue-600 font-medium">
                        Поиск по изображению — перетащите или нажмите
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* External search links */}
              {search.trim() && (
                <div className="flex flex-col items-center gap-2 mt-3">
                  <details className="group w-full max-w-md">
                    <summary className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-colors list-none">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      Поиск в других поисковых системах
                      <Plus className="w-3.5 h-3.5 ml-0.5 transition-transform group-open:rotate-45" />
                    </summary>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      <a href={`https://guardium.ru/advanced-search/?q=${encodeURIComponent(search.trim())}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-colors">
                        Гардиум <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a href={`https://searchplatform.rospatent.gov.ru/search?q=${encodeURIComponent(search.trim())}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-colors">
                        Роспатент <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a href={`https://brand-search.ru/search?text=${encodeURIComponent(search.trim())}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-colors">
                        Brand-search <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a href={`https://www.tmdn.org/tmview/?q=${encodeURIComponent(search.trim())}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-colors">
                        TMdex <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  </details>
                </div>
              )}

              {/* Filter tabs: МКТУ / ОКВЭД / ИНН-ОГРН */}
              <div className="flex items-center gap-2 mt-4 max-w-lg mx-auto">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg flex-1">
                  <button
                    onClick={() => setActiveFilter(v => v === 'mktu' ? null : 'mktu')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5',
                      activeFilter === 'mktu'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Классы МКТУ</span>
                    <span className="sm:hidden">МКТУ</span>
                    {mktuClasses.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                        {mktuClasses.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveFilter(v => v === 'okved' ? null : 'okved')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5',
                      activeFilter === 'okved'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <Briefcase className="w-4 h-4" />
                    ОКВЭД
                    {okvedSections.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        {okvedSections.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveFilter(v => v === 'subject' ? null : 'subject')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5',
                      activeFilter === 'subject'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">ИНН / ОГРН</span>
                    <span className="sm:hidden">ИНН</span>
                    {(subjectTin || subjectPsrn) && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                        ●
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* MKTU panel */}
              {activeFilter === 'mktu' && (
                <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700">Классы МКТУ (Ниццкая классификация)</h4>
                    {mktuClasses.length > 0 && (
                      <button onClick={() => setMktuClasses([])} className="text-xs text-slate-500 hover:text-red-500">
                        Очистить ({mktuClasses.length})
                      </button>
                    )}
                  </div>
                  <Input
                    value={mktuSearch}
                    onChange={(e) => setMktuSearch(e.target.value)}
                    placeholder="Поиск класса..."
                    className="h-9 mb-2"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {filteredMktu.map(c => (
                      <label
                        key={c.number}
                        className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={mktuClasses.includes(c.number)}
                          onChange={() => toggleMktu(c.number)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="font-mono text-xs text-slate-500 w-7">{String(c.number).padStart(2, '0')}</span>
                        <span className="text-slate-700">{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* OKVED panel */}
              {activeFilter === 'okved' && (
                <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Разделы ОКВЭД</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {OKVED_SECTIONS.map(s => (
                      <label
                        key={s.code}
                        className="flex items-start gap-2 p-2 rounded hover:bg-white cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={okvedSections.includes(s.code)}
                          onChange={() => toggleOkved(s.code)}
                          className="w-3.5 h-3.5 mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="font-semibold text-slate-700">{s.code} — {s.title}</div>
                          <div className="text-slate-500 text-[10px]">→ МКТУ: {(okvedToMktu(s.code) || []).join(', ') || '—'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject panel */}
              {activeFilter === 'subject' && (
                <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Поиск по правообладателю</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">ИНН</label>
                      <Input
                        value={subjectTin}
                        onChange={(e) => setSubjectTin(e.target.value)}
                        placeholder="10-12 цифр"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">ОГРН</label>
                      <Input
                        value={subjectPsrn}
                        onChange={(e) => setSubjectPsrn(e.target.value)}
                        placeholder="13-15 цифр"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Поиск по ИНН/ОГРН найдёт всех товарных знаков, зарегистрированных на данного правообладателя.
                  </p>
                </div>
              )}

              {/* AI hint for MKTU */}
              <div className="mt-3">
                <a
                  href="https://мкту.рус"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium transition-colors"
                >
                  <Lightbulb className="w-4 h-4 inline mr-1.5" />
                  Определить классы МКТУ с помощью умного сервиса с ИИ
                  <ExternalLink className="w-3.5 h-3.5 inline ml-1.5 opacity-60" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RESULTS ============ */}
        {hasSearched && (
          <section className="max-w-6xl mx-auto px-4 pb-12">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-500">Ищем по реестрам Роспатента…</p>
              </div>
            ) : totalFound !== null && (
              <>
                {/* Stats */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="text-sm text-slate-600">
                    Найдено: <span className="font-bold text-slate-900">{totalFound}</span>
                    {linkmarkTotal !== null && linkmarkTotal > 0 && (
                      <span className="text-slate-500"> + {linkmarkTotal} в linkmark</span>
                    )}
                  </div>
                  {riskLevel && (
                    <button
                      onClick={() => setShowRiskAssessment(v => !v)}
                      className="text-xs text-slate-500 hover:text-slate-900 underline"
                    >
                      {showRiskAssessment ? 'Скрыть оценку рисков' : 'Показать оценку рисков'}
                    </button>
                  )}
                </div>

                {/* Risk assessment */}
                {riskLevel && showRiskAssessment && (
                  <div className={cn(
                    'mb-4 p-4 rounded-xl border',
                    riskLevel === 'high' && 'bg-red-50 border-red-200',
                    riskLevel === 'medium' && 'bg-amber-50 border-amber-200',
                    riskLevel === 'low' && 'bg-emerald-50 border-emerald-200',
                  )}>
                    <div className="flex items-start gap-3">
                      {riskLevel === 'high' && <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}
                      {riskLevel === 'medium' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
                      {riskLevel === 'low' && <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
                      <div>
                        <h3 className={cn(
                          'font-semibold',
                          riskLevel === 'high' && 'text-red-900',
                          riskLevel === 'medium' && 'text-amber-900',
                          riskLevel === 'low' && 'text-emerald-900',
                        )}>
                          {riskLevel === 'high' && 'Высокий риск отказа'}
                          {riskLevel === 'medium' && 'Средний риск'}
                          {riskLevel === 'low' && 'Низкий риск'}
                        </h3>
                        <p className={cn(
                          'text-sm mt-1',
                          riskLevel === 'high' && 'text-red-700',
                          riskLevel === 'medium' && 'text-amber-700',
                          riskLevel === 'low' && 'text-emerald-700',
                        )}>
                          {riskLevel === 'high' && 'Найдено много похожих знаков. Регистрация может быть оспорена.'}
                          {riskLevel === 'medium' && 'Есть похожие знаки. Рекомендуем консультацию патентного поверенного.'}
                          {riskLevel === 'low' && 'Похожих знаков не найдено. Можно подавать заявку.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {results.map(r => (
                    <a
                      key={r.id}
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all overflow-hidden"
                    >
                      <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                        {r.imageUrl ? (
                          <img src={r.imageUrl} alt={r.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" loading="lazy" />
                        ) : (
                          <span className="text-slate-300 text-xs">нет изображения</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-sm font-medium text-slate-900 truncate">{r.name}</div>
                        <div className="text-xs text-slate-500 truncate">{r.certificate}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={cn(
                            'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                            SOURCE_LABELS[r.source].color
                          )}>
                            {SOURCE_LABELS[r.source].label}
                          </span>
                          {r.statusText && (
                            <span className="text-[10px] text-slate-500 truncate ml-1">{r.statusText}</span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Load more */}
                {page < totalPages && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={linkmarkLoadingMore}
                      className="h-10"
                    >
                      {linkmarkLoadingMore ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Загрузить ещё {PAGE_SIZE}
                    </Button>
                  </div>
                )}

                {/* Linkmark results (separate section) */}
                {linkmarkResults.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Дополнительные результаты из linkmark.ru
                      <span className="text-xs text-slate-500">({linkmarkTotal})</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {linkmarkResults.map(r => (
                        <a
                          key={r.id}
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
                        >
                          <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt={r.name} className="w-full h-full object-contain" loading="lazy" />
                            ) : (
                              <span className="text-slate-300 text-xs">нет изображения</span>
                            )}
                          </div>
                          <div className="p-2.5">
                            <div className="text-sm font-medium text-slate-900 truncate">{r.name}</div>
                            <div className="text-xs text-slate-500 truncate">{r.certificate}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {results.length === 0 && linkmarkResults.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-slate-500">Ничего не найдено. Попробуйте изменить запрос.</p>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <Toaster />
    </div>
  )
}
