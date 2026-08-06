'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Search, Plus, X, Loader2, ArrowLeft, Download,
  Image as ImageIcon, Upload, Sparkles, ExternalLink,
  ShieldCheck, ShieldAlert, AlertTriangle, Sun, Moon,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { MKTU_CLASSES } from '@/lib/mktu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { exportToRTF } from '@/lib/rtf-export'

// ============================================================
//  Types — unified result shape across all sources
// ============================================================

type Source = 'linkmark' | 'brand-search' | 'wipo'

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

interface SourceState {
  loading: boolean
  total: number
  results: UnifiedResult[]
  hasMore: boolean
  requestId?: string | null
  page: number
  error?: string | null
}

const SOURCE_LABELS: Record<Source, { label: string; color: string; dot: string }> = {
  'linkmark': { label: 'linkmark.ru', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', dot: 'bg-amber-500' },
  'brand-search': { label: 'brand-search.ru', color: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300', dot: 'bg-violet-500' },
  'wipo': { label: 'WIPO GBD', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300', dot: 'bg-sky-500' },
}

// ============================================================
//  Status helpers
// ============================================================

const FIPS_LABELS: Record<number, { label: string; risk: 'high' | 'medium' | 'low' }> = {
  1: { label: 'Действует', risk: 'high' },
  2: { label: 'Не действует', risk: 'low' },
  3: { label: 'Не продлён', risk: 'low' },
  4: { label: 'Истёк', risk: 'low' },
}

function getRiskClass(status: string, statusFips?: number): string {
  const s = statusFips ? FIPS_LABELS[statusFips] : null
  const risk = s?.risk || 'medium'
  if (risk === 'high') return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
  if (risk === 'low') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
  return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
}

// ============================================================
//  Page
// ============================================================

export default function FullSearchPage() {
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [mktuClasses, setMktuClasses] = useState<number[]>([])
  const [showMktuList, setShowMktuList] = useState(false)
  const [mktuSearch, setMktuSearch] = useState('')

  const [sources, setSources] = useState<Record<Source, SourceState>>({
    'linkmark': { loading: false, total: 0, results: [], hasMore: false, page: 1 },
    'brand-search': { loading: false, total: 0, results: [], hasMore: false, page: 1 },
    'wipo': { loading: false, total: 0, results: [], hasMore: false, page: 1 },
  })

  const [hasSearched, setHasSearched] = useState(false)

  // Image search state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- Search handlers ----

  const triggerSearch = useCallback(async () => {
    if (!search.trim()) {
      toast({ title: 'Введите название', variant: 'destructive' })
      return
    }
    setHasSearched(true)

    // Reset
    setSources({
      'linkmark': { loading: true, total: 0, results: [], hasMore: false, page: 1 },
      'brand-search': { loading: true, total: 0, results: [], hasMore: false, page: 1 },
      'wipo': { loading: true, total: 0, results: [], hasMore: false, page: 1 },
    })

    // Fire all 3 in parallel
    const tasks: Promise<void>[] = [
      searchLinkmark(search, mktuClasses, setSources),
      searchBrandSearch(search, mktuClasses, setSources),
      searchWipo(search, mktuClasses, setSources),
    ]
    await Promise.allSettled(tasks)
  }, [search, mktuClasses, toast])

  // ---- Load more ----

  const loadMore = async (source: Source) => {
    const state = sources[source]
    if (!state.hasMore || state.loading) return

    setSources(prev => ({
      ...prev,
      [source]: { ...prev[source], loading: true },
    }))

    try {
      const nextPage = state.page + 1
      if (source === 'linkmark' && state.requestId) {
        const res = await fetch('/api/linkmark/more', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: state.requestId, offset: state.results.length, num: 100 }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error)
        setSources(prev => ({
          ...prev,
          linkmark: {
            ...prev.linkmark,
            loading: false,
            results: [...prev.linkmark.results, ...normalizeLinkmark(data.results)],
            hasMore: data.hasMore,
            page: nextPage,
          },
        }))
      } else if (source === 'brand-search') {
        const res = await fetch('/api/brand-search/more', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ search, mktu: mktuClasses, page: nextPage, pageSize: 100 }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error)
        setSources(prev => ({
          ...prev,
          'brand-search': {
            ...prev['brand-search'],
            loading: false,
            results: [...prev['brand-search'].results, ...normalizeBrandSearch(data.results)],
            hasMore: data.hasMore,
            page: nextPage,
          },
        }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toast({ title: `Ошибка загрузки (${source})`, description: msg, variant: 'destructive' })
      setSources(prev => ({ ...prev, [source]: { ...prev[source], loading: false } }))
    }
  }

  // ---- Image search ----

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Выберите изображение', variant: 'destructive' })
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const searchByImage = async () => {
    if (!imageFile) {
      toast({ title: 'Сначала выберите изображение', variant: 'destructive' })
      return
    }
    setHasSearched(true)
    setSources(prev => ({
      ...prev,
      'brand-search': { loading: true, total: 0, results: [], hasMore: false, page: 1 },
      linkmark: { loading: false, total: 0, results: [], hasMore: false, page: 1 },
      wipo: { loading: false, total: 0, results: [], hasMore: false, page: 1 },
    }))

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('mktu', mktuClasses.join(','))
      formData.append('page', '1')
      formData.append('pageSize', '100')

      const res = await fetch('/api/brand-search/image', { method: 'POST', body: formData })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)

      setSources(prev => ({
        ...prev,
        'brand-search': {
          loading: false,
          results: normalizeBrandSearch(data.results),
          total: data.total,
          hasMore: data.hasMore,
          page: 1,
        },
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toast({ title: 'Ошибка поиска по изображению', description: msg, variant: 'destructive' })
      setSources(prev => ({ ...prev, 'brand-search': { loading: false, total: 0, results: [], hasMore: false, page: 1 } }))
    }
  }

  // ---- RTF export ----

  const allResults: UnifiedResult[] = Object.values(sources).flatMap(s => s.results)
  const handleExport = () => {
    if (allResults.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' })
      return
    }
    exportToRTF(allResults.map(r => ({
      certificate: r.certificate,
      name: r.name,
      statusText: r.statusText,
      status: r.status,
      markType: r.markType,
      owner: { fullName: r.owner, country: r.country },
      mktu: r.mktu,
      priorityDate: r.priorityDate,
      registrationDate: r.registrationDate,
      expirationDate: r.expirationDate,
      similarity: r.similarity,
      source: SOURCE_LABELS[r.source].label,
      sourceUrl: r.sourceUrl,
    })), search.trim(), `naytea-search-${Date.now()}.rtf`)
  }

  // ---- MKTU helpers ----

  const toggleMktu = (n: number) => {
    setMktuClasses(prev => prev.includes(n) ? prev.filter(c => c !== n) : [...prev, n])
  }

  const filteredMktu = MKTU_CLASSES.filter(c => {
    if (!mktuSearch) return true
    const q = mktuSearch.toLowerCase()
    return String(c.number).includes(q) || c.title.toLowerCase().includes(q)
  })

  const totalAcross = allResults.length

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">NayTea.ru</span>
                <span className="sm:hidden">Назад</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src="/teapot.svg" alt="NayTea.ru" className="w-5 h-5" />
              </div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">Полный поиск</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mktu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="МКТУ простыми словами — справочник"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">МКТУ</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={totalAcross === 0}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-1.5" />
              RTF
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
        {/* Search form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerSearch() }}
                placeholder="Название товарного знака..."
                className="pl-9 h-11"
              />
            </div>
            <Button
              onClick={triggerSearch}
              disabled={sources.linkmark.loading || sources['brand-search'].loading || sources.wipo.loading}
              className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            >
              {sources.linkmark.loading || sources['brand-search'].loading || sources.wipo.loading
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Sparkles className="w-4 h-4 mr-2" />}
              Проверить
            </Button>
          </div>

          {/* MKTU selector */}
          <div className="mt-3">
            <button
              onClick={() => setShowMktuList(v => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Plus className="w-4 h-4" />
              Классы МКТУ {mktuClasses.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-medium">
                  {mktuClasses.length}
                </span>
              )}
            </button>

            {mktuClasses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {mktuClasses.map(n => (
                  <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {n} — {MKTU_CLASSES.find(c => c.number === n)?.title.slice(0, 24) || ''}
                    <button onClick={() => toggleMktu(n)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showMktuList && (
              <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 max-h-72 overflow-y-auto p-2">
                <Input
                  value={mktuSearch}
                  onChange={(e) => setMktuSearch(e.target.value)}
                  placeholder="Поиск класса..."
                  className="h-8 mb-2"
                />
                <div className="space-y-0.5">
                  {filteredMktu.map(c => (
                    <label
                      key={c.number}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={mktuClasses.includes(c.number)}
                        onChange={() => toggleMktu(c.number)}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="font-mono text-xs text-slate-500 w-7">{String(c.number).padStart(2, '0')}</span>
                      <span className="text-slate-700 dark:text-slate-300">{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider + image search */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Поиск по изображению (через brand-search.ru)
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1.5" />
                {imageFile ? imageFile.name.slice(0, 30) : 'Выбрать изображение'}
              </Button>
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700" />
              )}
              <Button
                size="sm"
                onClick={searchByImage}
                disabled={!imageFile || sources['brand-search'].loading}
                variant="secondary"
              >
                {sources['brand-search'].loading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Search className="w-4 h-4 mr-2" />}
                Поиск по лого
              </Button>
            </div>
          </div>
        </div>

        {/* Source tabs / results */}
        {!hasSearched && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Введите название для поиска по 3 базам: linkmark.ru, brand-search.ru, WIPO GBD.
              Или загрузите изображение для поиска по лого.
            </p>
          </div>
        )}

        {hasSearched && (
          <div className="space-y-5">
            {(Object.keys(sources) as Source[]).map(src => {
              const state = sources[src]
              const info = SOURCE_LABELS[src]
              if (!state.loading && state.results.length === 0 && !state.error) return null
              return (
                <section key={src} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', info.dot)} />
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{info.label}</h3>
                      {state.total > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {state.results.length} / {state.total}
                        </span>
                      )}
                    </div>
                    {state.loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </header>

                  {state.error && (
                    <div className="px-4 py-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30">
                      {state.error}
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {state.results.map((r) => (
                      <div key={r.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-start gap-3">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.name} className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                          ) : r.name ? (
                            <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 px-1">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center line-clamp-3 leading-tight">{r.name}</span>
                            </div>
                          ) : r.certificate ? (
                            <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{r.certificate.slice(0, 8)}</span>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-900 dark:text-white">{r.name || r.certificate || '—'}</span>
                              <span className={cn('text-xs px-1.5 py-0.5 rounded border', getRiskClass(r.status, r.statusFips))}>
                                {r.statusText || r.status}
                              </span>
                              {typeof r.similarity === 'number' && r.similarity > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  {Math.round(r.similarity)}%
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                              {r.certificate && <div>Св-во: <span className="font-mono">{r.certificate}</span></div>}
                              {r.owner && <div>Правообладатель: {r.owner}</div>}
                              {r.mktu.length > 0 && <div>МКТУ: {r.mktu.join(', ')}</div>}
                              {(r.priorityDate || r.registrationDate) && (
                                <div>
                                  {r.priorityDate && <span>Приоритет: {r.priorityDate}</span>}
                                  {r.priorityDate && r.registrationDate && ' · '}
                                  {r.registrationDate && <span>Рег: {r.registrationDate}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          {r.sourceUrl && (
                            <a
                              href={r.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {state.hasMore && !state.loading && (
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMore(src)}
                        className="w-full"
                      >
                        Загрузить ещё
                      </Button>
                    </div>
                  )}
                </section>
              )
            })}

            {/* Mobile RTF button */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={totalAcross === 0}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт в RTF ({totalAcross})
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">NayTea.ru</Link>
          {' · '}Агрегатор поиска товарных знаков
        </div>
      </footer>

      <Toaster />
    </div>
  )
}

// ============================================================
//  Normalizers — convert each source's API shape → UnifiedResult
// ============================================================

function normalizeLinkmark(items: any[]): UnifiedResult[] {
  return (items || []).map((r, i) => ({
    id: `lm-${r.certificate || i}-${i}`,
    source: 'linkmark',
    certificate: r.certificate || '',
    name: r.name || '',
    status: r.status || 'unknown',
    statusText: r.statusText || '',
    owner: r.owner || '',
    imageUrl: r.imageUrl || '',
    mktu: r.mktu || [],
    priorityDate: r.priorityDate || '',
    registrationDate: r.registrationDate || '',
    expirationDate: '',
    sourceUrl: r.sourceUrl || '',
  }))
}

function normalizeBrandSearch(items: any[]): UnifiedResult[] {
  return (items || []).map((r, i) => ({
    id: `bs-${r.id || r.certificate || i}-${i}`,
    source: 'brand-search',
    certificate: r.certificate || '',
    name: r.name || '',
    status: r.status || 'unknown',
    statusText: r.statusText || '',
    statusFips: r.statusFips,
    markType: r.markType || '',
    similarity: typeof r.similarity === 'number' ? r.similarity * 100 : undefined,
    score: r.score,
    owner: typeof r.owner === 'object' ? r.owner?.fullName || '' : r.owner || '',
    country: typeof r.owner === 'object' ? r.owner?.country || '' : '',
    imageUrl: r.imageUrl || '',
    mktu: r.mktu || [],
    catalog: r.catalog || '',
    countries: r.countries || [],
    disclaimer: r.disclaimer,
    priorityDate: r.priorityDate || '',
    registrationDate: r.registrationDate || '',
    expirationDate: r.expirationDate || '',
    sourceUrl: r.imageUrl ? `https://brand-search.ru/mark/${r.certificate}` : '',
  }))
}

function normalizeWipo(items: any[]): UnifiedResult[] {
  return (items || []).map((r, i) => ({
    id: `wipo-${r.id || r.certificate || i}-${i}`,
    source: 'wipo',
    certificate: r.certificate || r.markNumber || '',
    name: r.name || r.markName || '',
    status: r.status || 'unknown',
    statusText: r.statusText || r.status || '',
    owner: typeof r.owner === 'object' ? r.owner?.name || '' : r.owner || '',
    country: typeof r.owner === 'object' ? r.owner?.country || '' : '',
    imageUrl: r.imageUrl || r.imagePath || '',
    mktu: r.mktu || [],
    priorityDate: r.priorityDate || '',
    registrationDate: r.registrationDate || '',
    expirationDate: r.expirationDate || '',
    sourceUrl: r.sourceUrl || `https://branddb.wipo.int/en/quicksearch/${r.id || ''}`,
  }))
}

// ============================================================
//  Search functions
// ============================================================

async function searchLinkmark(
  search: string,
  mktu: number[],
  setSources: React.Dispatch<React.SetStateAction<Record<Source, SourceState>>>,
) {
  try {
    const res = await fetch('/api/linkmark/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search, mktu }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    const total = typeof data.total === 'object'
      ? (data.total.trademarks || data.total.applications || 0)
      : (data.total || 0)
    setSources(prev => ({
      ...prev,
      linkmark: {
        loading: false,
        results: normalizeLinkmark(data.results),
        total,
        hasMore: data.hasMore,
        requestId: data.requestId,
        page: 1,
      },
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    setSources(prev => ({ ...prev, linkmark: { loading: false, total: 0, results: [], hasMore: false, page: 1, error: msg } }))
  }
}

async function searchBrandSearch(
  search: string,
  mktu: number[],
  setSources: React.Dispatch<React.SetStateAction<Record<Source, SourceState>>>,
) {
  try {
    const res = await fetch('/api/brand-search/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search, mktu, pageSize: 100 }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    setSources(prev => ({
      ...prev,
      'brand-search': {
        loading: false,
        results: normalizeBrandSearch(data.results),
        total: data.total,
        hasMore: data.hasMore,
        page: 1,
      },
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    setSources(prev => ({ ...prev, 'brand-search': { loading: false, total: 0, results: [], hasMore: false, page: 1, error: msg } }))
  }
}

async function searchWipo(
  search: string,
  mktu: number[],
  setSources: React.Dispatch<React.SetStateAction<Record<Source, SourceState>>>,
) {
  try {
    const res = await fetch('/api/wipo/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search, mktu, pageSize: 100 }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    setSources(prev => ({
      ...prev,
      wipo: {
        loading: false,
        results: normalizeWipo(data.results),
        total: data.total,
        hasMore: data.hasMore,
        page: 1,
      },
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    setSources(prev => ({ ...prev, wipo: { loading: false, total: 0, results: [], hasMore: false, page: 1, error: msg } }))
  }
}
