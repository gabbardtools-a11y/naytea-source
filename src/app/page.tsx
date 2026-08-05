'use client'

import { useState, useEffect } from 'react'
import {
  Search, Plus, X, AlertTriangle, ShieldCheck, ShieldAlert,
  Loader2, TrendingUp, Download,
  Lightbulb, Layers, Scale, ExternalLink, FileText, Briefcase,
  Building2, Hash,
  Clock, Award, Zap, Moon, Sun, ArrowRight,
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
import { useLanguage } from '@/lib/i18n/useLanguage'

// ============================================================
//  Types
// ============================================================

interface CheckResult {
  id?: string
  certificate: string
  name: string
  status: string
  statusText?: string
  statusFips: number
  markType: string
  similarity: number
  score: number
  owner: { fullName: string; country: string } | string
  imageUrl: string
  mktu: number[]
  catalog: string
  countries: string[]
  disclaimer: string | null
  priorityDate: string
  registrationDate: string
  expirationDate: string
}

interface SearchResponse {
  ok: boolean
  total: number
  results: CheckResult[]
  hasMore: boolean
  error?: string
}

// ============================================================
//  Status helpers (same mapping as brand-search.ru)
// ============================================================

const FIPS_LABELS: Record<number, { label: string; risk: 'critical' | 'high' | 'medium' | 'low' }> = {
  1: { label: 'Действует', risk: 'high' },        // active TM — potential risk
  2: { label: 'Не действует', risk: 'low' },      // inactive TM
  3: { label: 'Не продлён', risk: 'low' },        // expired
  4: { label: 'Истёк', risk: 'low' },             // expired
}

// Color palette for 4 risk levels (Tailwind classes)
const RISK_COLORS: Record<'critical' | 'high' | 'medium' | 'low', { 
  badge: string;     // for inline badge
  card: string;      // for card border/ring
  cardBadge: string; // for absolute card badge
  chip: string;      // for summary chip
}> = {
  critical: {
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    card: 'border-rose-400 ring-2 ring-rose-300',
    cardBadge: 'bg-rose-600 text-white',
    chip: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  high: {
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    card: 'border-orange-300 ring-1 ring-orange-200',
    cardBadge: 'bg-orange-500 text-white',
    chip: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    card: 'border-amber-200',
    cardBadge: 'bg-amber-400 text-amber-900',
    chip: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  low: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    card: 'border-border',
    cardBadge: 'bg-emerald-500 text-white',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
}

const RISK_LABELS: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: 'Критический риск',
  high: 'Высокий риск',
  medium: 'Средний риск',
  low: 'Низкий риск',
}

/**
 * Calculate risk level — calmer thresholds (less false positives).
 *
 * Levels:
 *   🔴 CRITICAL — exact name match (case-insensitive, 100% identical)
 *   🟠 HIGH     — active TM AND similarity ≥ 90%
 *   🟡 MEDIUM   — active TM AND similarity 70-89%
 *   🟢 LOW      — everything else (inactive, low similarity, applications)
 *
 * Note: Pending applications (statusFips=15) are NOT high risk by default.
 */
function getRiskLevel(r: CheckResult, searchQuery?: string): 'critical' | 'high' | 'medium' | 'low' {
  // 🔴 CRITICAL — exact name match
  if (searchQuery && r.name) {
    const q = searchQuery.trim().toLowerCase()
    const n = r.name.trim().toLowerCase()
    if (q && n === q) return 'critical'
  }
  
  // Get similarity as percentage
  const sim = typeof r.similarity === 'number' ? r.similarity : 0
  
  // For active TMs only
  if (r.statusFips === 1) {
    // 🟠 HIGH — similarity ≥ 90%
    if (sim >= 0.9) return 'high'
    // 🟡 MEDIUM — similarity 70-89%
    if (sim >= 0.7) return 'medium'
  }
  
  // 🟢 LOW — everything else
  return 'low'
}

function getRiskLabel(statusFips: number): { text: string; className: string } {
  const s = FIPS_LABELS[statusFips] || { risk: 'low' as const }
  const colors = RISK_COLORS[s.risk]
  return { text: RISK_LABELS[s.risk], className: colors.badge }
}

// Backward-compat: keep old function names but use new logic
function isHighRisk(r: CheckResult, searchQuery?: string): boolean {
  const level = getRiskLevel(r, searchQuery)
  return level === 'high' || level === 'critical'
}

function isExactMatch(r: CheckResult, searchQuery?: string): boolean {
  return getRiskLevel(r, searchQuery) === 'critical'
}

function isMediumRisk(r: CheckResult, searchQuery?: string): boolean {
  return getRiskLevel(r, searchQuery) === 'medium'
}

function sortResultsByRisk(results: CheckResult[], searchQuery?: string): CheckResult[] {
  const tier = (r: CheckResult): number => {
    const level = getRiskLevel(r, searchQuery)
    if (level === 'critical') return 4
    if (level === 'high') return 3
    if (level === 'medium') return 2
    return 1
  }
  return [...results].sort((a, b) => {
    const ta = tier(a), tb = tier(b)
    if (ta !== tb) return tb - ta
    const aSim = typeof a.similarity === 'number' ? a.similarity : 0
    const bSim = typeof b.similarity === 'number' ? b.similarity : 0
    if (bSim !== aSim) return bSim - aSim
    if (a.statusFips === 1 && b.statusFips !== 1) return -1
    if (b.statusFips === 1 && a.statusFips !== 1) return 1
    return (a.certificate || '').localeCompare(b.certificate || '')
  })
}

function simPercent(sim: number | undefined): number | null {
  if (typeof sim !== 'number' || sim <= 0) return null
  return Math.round(sim * 100)
}

// ============================================================
//  Page
// ============================================================

export default function CheckPage() {
  const { toast } = useToast()
  const { t, lang, switchLang } = useLanguage()

  const PAGE_SIZE = 50
  const MAX_RESULTS = 500

  const [search, setSearch] = useState('')
  const [subjectTin, setSubjectTin] = useState('')
  const [subjectPsrn, setSubjectPsrn] = useState('')
  const [showSubjectFilter, setShowSubjectFilter] = useState(false)
  const [mktuClasses, setMktuClasses] = useState<number[]>([])
  const [showMktuList, setShowMktuList] = useState(false)
  const [mktuSearch, setMktuSearch] = useState('')
  const [okvedSections, setOkvedSections] = useState<string[]>([])
  const [showOkvedList, setShowOkvedList] = useState(false)
  const [okvedSearch, setOkvedSearch] = useState('')
  // Unified filter tab: 'mktu' | 'okved' | 'subject' | null
  const [activeFilter, setActiveFilter] = useState<'mktu' | 'okved' | 'subject' | null>(null)
  // Hero block visibility — auto-close after 15 seconds
  const [heroVisible, setHeroVisible] = useState(true)
  const [heroClosing, setHeroClosing] = useState(false)  // for fade-out animation
  useEffect(() => {
    const timer = setTimeout(() => closeHero(), 15000)
    return () => clearTimeout(timer)
  }, [])
  function closeHero() {
    setHeroClosing(true)
    setTimeout(() => {
      setHeroVisible(false)
      setHeroClosing(false)
    }, 400)  // match CSS transition duration
  }
  function openHero() {
    setHeroVisible(true)
  }
  // Risk assessment visibility — hidden by default, shown via button click
  const [showRiskAssessment, setShowRiskAssessment] = useState(false)
  // Image search
  const [imageSearching, setImageSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [results, setResults] = useState<CheckResult[]>([])
  const [totalFound, setTotalFound] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  // Reset risk visibility on each new search (when search query changes or new search performed)
  useEffect(() => {
    setShowRiskAssessment(false)
  }, [hasSearched, search])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [resultTab, setResultTab] = useState<'all' | 'certificates' | 'applications'>('all')

  // ---- Linkmark (parallel source, merged into main search) ----
  const [linkmarkResults, setLinkmarkResults] = useState<any[]>([])
  const [linkmarkTotal, setLinkmarkTotal] = useState<number | null>(null)
  const [linkmarkLoading, setLinkmarkLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<'name' | 'number' | 'owner'>('name')
  const [dbSource, setDbSource] = useState<'all' | 'd1' | 'linkmark' | 'brandsearch' | 'wipo'>('all')

  async function searchLinkmark(query: string, mode: 'name' | 'number' | 'owner') {
    setLinkmarkLoading(true)
    setLinkmarkResults([])
    setLinkmarkTotal(null)
    try {
      const body: any = { search: query, mktu: [] }
      if (mode === 'number') { body.searchType = '3'; body.number = query }
      else if (mode === 'owner') { body.searchType = '4'; body.owner = query }
      const res = await fetch('/api/linkmark/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.ok) {
        setLinkmarkResults(data.results || [])
        const total = typeof data.total === 'object'
          ? (data.total?.trademarks || data.total?.applications || 0)
          : (data.total || 0)
        setLinkmarkTotal(total)
      }
    } catch { /* silent — linkmark is secondary source */ }
    finally { setLinkmarkLoading(false) }
  }

  // ---- Search ----
  // Если заполнен ИНН/ОГРН — поиск по субъекту (название игнорируется, tm-api /by_subject не умеет совмещать).
  // Иначе — обычный поиск по названию + MKTU + OKVED.

  async function handleImageSearch(file: File) {
    setImageSearching(true)
    setLoading(true)
    setHasSearched(true)
    setError(null)
    setResults([])
    setTotalFound(null)
    setPage(1)
    setHasMore(false)
    setLinkmarkResults([])
    setLinkmarkTotal(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mktu', mktuClasses.join(','))
      formData.append('pageSize', String(PAGE_SIZE))

      const res = await fetch('/api/brand-search/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Ошибка поиска по изображению')
      } else {
        setResults(data.results)
        setTotalFound(data.total)
        setHasMore(data.hasMore && data.results.length < MAX_RESULTS)
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setImageSearching(false)
      setLoading(false)
    }
  }

  async function handleSearch() {
    const hasSubject = !!(subjectTin.trim() || subjectPsrn.trim())

    if (!hasSubject && !search.trim()) {
      toast({ title: 'Введите название или ИНН/ОГРН', variant: 'destructive' })
      return
    }

    setLoading(true)
    setHasSearched(true)
    setError(null)
    setResults([])
    setTotalFound(null)
    setPage(1)
    setHasMore(false)
    setLinkmarkResults([])
    setLinkmarkTotal(null)

    // ===== D1 (Rospatent) — primary source if selected =====
    if (dbSource === 'd1' && search.trim()) {
      try {
        const res = await fetch('/api/rospatent/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search: search.trim(),
            page: 1,
            pageSize: PAGE_SIZE,
          }),
        })
        const data = await res.json()
        if (data.ok) {
          const d1Results = (data.results || []).map((r: any) => ({
            id: `d1-${r.registrationNumber}`,
            certificate: r.registrationNumber || '',
            name: r.name || '',
            status: r.status || '',
            statusText: r.statusText || '',
            statusFips: r.statusFips || 0,
            markType: '',
            similarity: 0,
            score: 0,
            owner: typeof r.owner === 'string' ? r.owner : (r.owner?.fullName || ''),
            imageUrl: r.imageUrl || '',
            mktu: r.mktu || [],
            catalog: 'RUTM',
            countries: [],
            disclaimer: null,
            priorityDate: r.priorityDate || '',
            registrationDate: r.registrationDate || '',
            expirationDate: r.expirationDate || '',
            sourceUrl: r.source || '',
          }))
          setResults(d1Results)
          setTotalFound(data.total || d1Results.length)
          setHasMore(data.hasMore || false)
        } else {
          setError(data.error || 'D1 search error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'D1 search error')
      } finally {
        setLoading(false)
      }
      return
    }

    // ===== linkmark-only mode =====
    if (dbSource === 'linkmark' && search.trim()) {
      setLinkmarkLoading(true)
      try {
        const body: any = { search: search.trim(), mktu: [], searchType: '1', owner: '' }
        if (searchMode === 'owner') {
          body.searchType = '4'
          body.owner = search.trim()
        }
        const res = await fetch('/api/linkmark/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.ok) {
          const lmResults = data.results || []
          setResults(lmResults.map((r: any) => ({
            id: r.certificate,
            certificate: r.certificate || '',
            name: r.name || '',
            status: r.status || '',
            statusText: r.statusText || '',
            statusFips: r.status === 'active' ? 1 : r.status === 'expired' ? 4 : 0,
            markType: '',
            similarity: 0,
            score: 0,
            owner: r.owner || '',
            imageUrl: r.imageUrl || '',
            mktu: (r.mktu || []).map((m: string) => parseInt(m, 10)).filter((n: number) => !isNaN(n)),
            catalog: 'RUTM',
            countries: [],
            disclaimer: null,
            priorityDate: r.priorityDate || '',
            registrationDate: r.registrationDate || '',
            expirationDate: '',
            sourceUrl: r.sourceUrl || '',
          })))
          const total = typeof data.total === 'object'
            ? (data.total?.trademarks || data.total?.applications || 0)
            : (data.total || 0)
          setTotalFound(total)
          setHasMore(false)
        } else {
          setError(data.error || 'linkmark search error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'linkmark search error')
      } finally {
        setLinkmarkLoading(false)
        setLoading(false)
      }
      return
    }

    // ===== Default "all" mode — original logic below =====

    // Поиск по владельцу — основной через linkmark (searchType=4), brand-search не используется
    if (searchMode === 'owner' && !hasSubject && search.trim()) {
      // Linkmark — основной источник для поиска по владельцу
      setLinkmarkLoading(true)
      try {
        const body: any = { search: search.trim(), mktu: [], searchType: '4', owner: search.trim() }
        const res = await fetch('/api/linkmark/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.ok) {
          const lmResults = data.results || []
          setLinkmarkResults(lmResults)
          const total = typeof data.total === 'object'
            ? (data.total?.trademarks || data.total?.applications || 0)
            : (data.total || 0)
          setLinkmarkTotal(total)
          setTotalFound(total)
          // Copy linkmark results to main results array so UI shows them
          setResults(lmResults.map((r: any) => ({
            id: r.certificate,
            certificate: r.certificate || '',
            name: r.name || '',
            status: r.status || '',
            statusText: r.statusText || '',
            statusFips: r.status === 'active' ? 1 : r.status === 'expired' ? 4 : 0,
            markType: '',
            similarity: 0,
            score: 0,
            owner: r.owner || '',
            imageUrl: r.imageUrl || '',
            mktu: (r.mktu || []).map((m: string) => parseInt(m, 10)).filter((n: number) => !isNaN(n)),
            catalog: 'RUTM',
            countries: [],
            disclaimer: null,
            priorityDate: r.priorityDate || '',
            registrationDate: r.registrationDate || '',
            expirationDate: '',
          })))
          setHasMore(false)
        } else {
          setError(data.error || 'Ошибка поиска по владельцу')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка поиска')
      } finally {
        setLinkmarkLoading(false)
        setLoading(false)
      }

      // Show "no results" message if linkmark returned nothing
      setTimeout(() => {
        if (linkmarkResults.length === 0 && !linkmarkLoading) {
          // already handled by UI
        }
      }, 100)
      return
    }

    // Fire linkmark search in parallel (non-blocking — secondary source)
    if (!hasSubject && search.trim()) {
      searchLinkmark(search.trim(), searchMode)
    }

    try {
      let data: SearchResponse
      if (hasSubject) {
        // Поиск по правообладателю (ИНН/ОГРН)
        const res = await fetch('/api/brand-search/by-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tin: subjectTin.trim() || undefined,
            psrn: subjectPsrn.trim() || undefined,
            page: 1,
            pageSize: PAGE_SIZE,
          }),
        })
        data = await res.json()
      } else {
        // Поиск по названию + MKTU + OKVED
        const okvedMktu = okvedToMktu(okvedSections)
        const allMktu = Array.from(new Set([...mktuClasses, ...okvedMktu])).sort((a, b) => a - b)
        const res = await fetch('/api/brand-search/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search: search.trim(),
            mktu: allMktu,
            pageSize: PAGE_SIZE,
            searchMode: 'standard',
          }),
        })
        data = await res.json()
      }

      if (!data.ok) {
        setError(data.error || 'Ошибка поиска')
      } else {
        setResults(data.results)
        setTotalFound(data.total)
        setHasMore(data.hasMore && data.results.length < MAX_RESULTS)
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  // ---- Load more (50 at a time, up to MAX_RESULTS) ----
  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const hasSubject = !!(subjectTin.trim() || subjectPsrn.trim())
      let res: Response
      if (hasSubject) {
        res = await fetch('/api/brand-search/by-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tin: subjectTin.trim() || undefined,
            psrn: subjectPsrn.trim() || undefined,
            page: nextPage,
            pageSize: PAGE_SIZE,
          }),
        })
      } else {
        const okvedMktu = okvedToMktu(okvedSections)
        const allMktu = Array.from(new Set([...mktuClasses, ...okvedMktu])).sort((a, b) => a - b)
        res = await fetch('/api/brand-search/more', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search: search.trim(),
            mktu: allMktu,
            page: nextPage,
            pageSize: PAGE_SIZE,
            searchMode: 'standard',
          }),
        })
      }
      const data: SearchResponse = await res.json()
      if (!data.ok) {
        toast({ title: 'Ошибка загрузки', description: data.error, variant: 'destructive' })
      } else {
        setResults(prev => [...prev, ...data.results])
        setPage(nextPage)
        const newCount = results.length + data.results.length
        setHasMore(data.hasMore && newCount < MAX_RESULTS)
      }
    } catch (err) {
      toast({
        title: 'Ошибка загрузки',
        description: err instanceof Error ? err.message : 'Network error',
        variant: 'destructive',
      })
    } finally {
      setLoadingMore(false)
    }
  }

  // ---- Risk assessment ----
  // Risk level summary — based on actual risk levels of results, not just count
  const riskLevel = (() => {
    if (totalFound === null) return null
    if (totalFound === 0) return 'safe' as const
    
    // Count by actual risk levels
    const criticalCount = results.filter(r => getRiskLevel(r, search) === 'critical').length
    const highCount = results.filter(r => getRiskLevel(r, search) === 'high').length
    const mediumCount = results.filter(r => getRiskLevel(r, search) === 'medium').length
    
    // Decide overall level: critical > high > medium > safe
    if (criticalCount > 0) return 'critical' as const
    if (highCount > 0) return 'high' as const
    if (mediumCount > 0) return 'medium' as const
    return 'safe' as const
  })()

  const riskConfig = {
    safe: {
      label: 'Регистрация возможна',
      sub: 'Низкий риск отказа',
      icon: ShieldCheck,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      barBg: 'bg-emerald-500',
      percent: 100,
    },
    medium: {
      label: 'Регистрация возможна',
      sub: 'Средний риск — требуется доработка',
      icon: ShieldAlert,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      barBg: 'bg-amber-500',
      percent: 70,
    },
    high: {
      label: 'Требуется доработка',
      sub: 'Высокий риск — найдены похожие знаки',
      icon: AlertTriangle,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      barBg: 'bg-orange-500',
      percent: 40,
    },
    critical: {
      label: 'Регистрация невозможна',
      sub: 'Критический риск — найдено точное совпадение',
      icon: ShieldAlert,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      barBg: 'bg-rose-500',
      percent: 15,
    },
  } as const

  // ---- MKTU helpers ----
  const toggleMktu = (n: number) => {
    setMktuClasses(prev => prev.includes(n) ? prev.filter(c => c !== n) : [...prev, n])
  }

  const filteredMktu = MKTU_CLASSES.filter(c => {
    if (!mktuSearch) return true
    const q = mktuSearch.toLowerCase()
    return String(c.number).includes(q) || c.title.toLowerCase().includes(q)
  })

  // ---- OKVED helpers ----
  const toggleOkved = (letter: string) => {
    setOkvedSections(prev => prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter])
  }

  const filteredOkved = OKVED_SECTIONS.filter(s => {
    if (!okvedSearch) return true
    const q = okvedSearch.toLowerCase()
    return s.letter.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  })

  const okvedDerivedMktu = okvedToMktu(okvedSections)

  // ---- RTF export ----
  const handleExport = () => {
    if (results.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' })
      return
    }
    const hasSubject = !!(subjectTin.trim() || subjectPsrn.trim())
    const queryLabel = hasSubject
      ? `${subjectTin || subjectPsrn}`
      : search.trim()
    exportToRTF(results.map(r => ({
      certificate: r.certificate,
      name: r.name,
      statusText: r.statusText,
      status: r.status,
      markType: r.markType,
      owner: typeof r.owner === 'object' ? r.owner : { fullName: r.owner },
      mktu: r.mktu,
      priorityDate: r.priorityDate,
      registrationDate: r.registrationDate,
      expirationDate: r.expirationDate,
      similarity: r.similarity,
      source: 'brand-search.ru',
      sourceUrl: '',
    })), queryLabel, `naytea-check-${Date.now()}.rtf`)
  }

  // ---- SVG export ----
  const handleSvgExport = async () => {
    if (results.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' })
      return
    }
    const queryLabel = search.trim()
    toast({ title: 'Генерация SVG...', description: 'Загружаем изображения — подождите' })
    await exportToSVG(results.map(r => ({
      certificate: r.certificate,
      name: r.name,
      statusText: r.statusText,
      status: r.status,
      markType: r.markType,
      owner: typeof r.owner === 'object' ? r.owner : { fullName: r.owner },
      mktu: r.mktu,
      priorityDate: r.priorityDate,
      similarity: r.similarity,
      imageUrl: r.imageUrl,
    })), queryLabel, `naytea-check-${Date.now()}.svg`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — semi-transparent (like partner landing style) */}
      <header className="border-b border-border/50 bg-popover/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/teapot.svg" alt="NayTea.ru" className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-foreground">NayTea.ru</span>

            </div>
          </Link>
          <div className="flex items-center gap-2">
            {/* Услуги — link to partner-style landing */}
            <Link href="/znakvsem.html">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                {t('header.services')}
              </Button>
            </Link>
            {/* Партнёрам — link to partner program page */}
            <Link href="/partners">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                {t('header.partners')}
              </Button>
            </Link>
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 p-0.5 bg-secondary/70 rounded-md">
              <button
                onClick={() => switchLang('ru')}
                className={cn('px-1.5 py-0.5 text-[11px] font-bold rounded transition-colors', lang === 'ru' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >RU</button>
              <button
                onClick={() => switchLang('en')}
                className={cn('px-1.5 py-0.5 text-[11px] font-bold rounded transition-colors', lang === 'en' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >EN</button>
              <button
                onClick={() => switchLang('zh')}
                className={cn('px-1.5 py-0.5 text-[11px] font-bold rounded transition-colors', lang === 'zh' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >中</button>
            </div>
            {/* Theme toggle */}
            <button
              onClick={() => {
                const isLight = document.documentElement.classList.contains('light')
                if (isLight) {
                  document.documentElement.classList.remove('light')
                  localStorage.setItem('theme', 'dark')
                } else {
                  document.documentElement.classList.add('light')
                  localStorage.setItem('theme', 'light')
                }
              }}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('header.themeToggle')}
            >
              <Sun className="w-4 h-4 block light:hidden" />
              <Moon className="w-4 h-4 hidden light:block" />
            </button>
            <Link href="/contacts">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                {t('header.contacts')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ============ HERO TEXT BLOCK (closeable, auto-fade after 15s) ============ */}
        {heroVisible && (
          <section
            className="relative overflow-hidden border-b border-border transition-all duration-400"
            style={{
              opacity: heroClosing ? 0 : 1,
              transform: heroClosing ? 'translateY(-20px)' : 'translateY(0)',
              maxHeight: heroClosing ? '0' : '1000px',
              transitionProperty: 'opacity, transform, max-height, padding, margin',
            }}
          >
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none block light:hidden" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none block light:hidden" />

            {/* Close button — top-right */}
            <button
              onClick={closeHero}
              aria-label={t('header.close')}
              className="absolute top-4 right-4 z-10 w-8 h-8 inline-flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
                <Zap className="w-3 h-3" />
                {t('hero.badge')}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                {t('hero.h1Prefix')} <span className="text-cyan-400 [text-shadow:0_0_20px_rgba(34,211,238,0.6),0_0_40px_rgba(34,211,238,0.3)] light:text-cyan-600 light:[text-shadow:none]">{t('hero.h1Highlight')}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('hero.description')}
              </p>
            </div>
          </section>
        )}

        {/* "Reopen Hero" link — shown only when Hero is closed */}
        {!heroVisible && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <button
              onClick={openHero}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap className="w-3 h-3" />
              {t('hero.showDescription')}
            </button>
          </div>
        )}

        {/* ============ SEARCH FORM BLOCK (always visible) ============ */}
        <section className="relative">
          <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
            {/* Database freshness badge */}
            <div className="flex items-center justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 light:text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('db.freshness')}
              </span>
            </div>
            {/* Search form */}
            <div className="bg-card rounded-2xl border border-border shadow-xl p-5 md:p-6">
              {/* Database source switcher (above mode tabs) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 text-xs">
                <span className="text-muted-foreground mr-1">{t('db.label')}</span>
                {([
                  { key: 'all', label: t('db.all') },
                  { key: 'd1', label: t('db.d1') },
                  { key: 'linkmark', label: t('db.linkmark') },
                  { key: 'brandsearch', label: t('db.brandsearch') },
                  { key: 'wipo', label: t('db.wipo') },
                ] as const).map((db) => (
                  <button
                    key={db.key}
                    onClick={() => setDbSource(db.key)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-medium transition-all border',
                      dbSource === db.key
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                    )}
                    title={db.key === 'd1' ? t('db.d1Hint') : undefined}
                  >
                    {db.label}
                  </button>
                ))}
              </div>
              {/* Mode tabs: По названию / По номеру / По правообладателю */}
              <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-4 max-w-md mx-auto">
                <button
                  onClick={() => setSearchMode('name')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    searchMode === 'name'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('mode.name')}
                </button>
                <button
                  onClick={() => setSearchMode('number')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    searchMode === 'number'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('mode.number')}
                </button>
                <button
                  onClick={() => setSearchMode('owner')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    searchMode === 'owner'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('mode.owner')}
                </button>
              </div>

              {/* Единая поисковая строка */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder={subjectTin || subjectPsrn
                      ? t('search.placeholder.subjectTin')
                      : searchMode === 'number' ? t('search.placeholder.number')
                      : searchMode === 'owner' ? t('search.placeholder.owner')
                      : t('search.placeholder.name')}
                    className="pl-11 h-12 text-base transition-all duration-300 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 focus:shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:border-primary/40"
                    disabled={!!(subjectTin || subjectPsrn)}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-12 px-7 bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {t('search.button')}
                </Button>
              </div>

              {/* Image search — drag & drop / upload */}
              <div className="mt-3">
                <label
                  className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-primary/30 rounded-lg py-3 px-4 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group bg-primary/5"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/10') }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/10') }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/10')
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
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-sm text-primary font-medium">{t('search.imageSearching')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-primary font-medium">
                        {t('search.imageDrop')}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* External search links — collapsible under "Поиск в других поисковых системах" */}
              {search.trim() && (
                <div className="flex flex-col items-center gap-2 mt-3">
                  <details className="group w-full max-w-md">
                    <summary className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground border border-border transition-colors list-none">
                      <Search className="w-3.5 h-3.5 text-primary" />
                      {t('search.otherSystems')}
                      <Plus className="w-3.5 h-3.5 ml-0.5 transition-transform group-open:rotate-45" />
                    </summary>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      <a
                        href={`https://guardium.ru/advanced-search/?q=${encodeURIComponent(search.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground border border-border transition-colors"
                      >
                        Гардиум
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a
                        href={`https://searchplatform.rospatent.gov.ru/search?q=${encodeURIComponent(search.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground border border-border transition-colors"
                      >
                        Роспатент
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a
                        href={`https://brand-search.ru/search?text=${encodeURIComponent(search.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground border border-border transition-colors"
                      >
                        Brand-search
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a
                        href={`https://www.tmdn.org/tmview/?q=${encodeURIComponent(search.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground border border-border transition-colors"
                      >
                        TMdex
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  </details>
                </div>
              )}

              {/* Filter tabs: МКТУ / ОКВЭД / ИНН-ОГРН — в ряд как mode tabs */}
              <div className="flex items-center gap-2 mt-4 max-w-lg mx-auto">
                <div className="flex gap-1 p-1 bg-secondary rounded-lg flex-1">
                  <button
                    onClick={() => setActiveFilter(v => v === 'mktu' ? null : 'mktu')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5',
                      activeFilter === 'mktu'
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('filter.mktuFull')}</span>
                    <span className="sm:hidden">{t('filter.mktuShort')}</span>
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
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Briefcase className="w-4 h-4" />
                  {t('filter.okved')}
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
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">ИНН / ОГРН</span>
                  <span className="sm:hidden">ИНН</span>
                  {(subjectTin || subjectPsrn) && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </button>
                </div>
              </div>

              {/* Selected MKTU chips (always visible when chosen) */}
              {mktuClasses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 max-w-2xl mx-auto">
                  {mktuClasses.map(n => (
                    <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs text-slate-700">
                      {String(n).padStart(2, '0')} · {MKTU_CLASSES.find(c => c.number === n)?.title.slice(0, 24) || ''}
                      <button onClick={() => toggleMktu(n)} className="text-muted-foreground/70 hover:text-red-500 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Selected OKVED chips (always visible when chosen) */}
              {okvedSections.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 max-w-2xl mx-auto">
                  {okvedSections.map(letter => {
                    const s = OKVED_SECTIONS.find(x => x.letter === letter)
                    if (!s) return null
                    return (
                      <span key={letter} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <span className="font-mono font-bold">{s.letter}</span> · {s.title.slice(0, 28)}
                        <button onClick={() => toggleOkved(letter)} className="text-emerald-400 hover:text-red-500 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {okvedDerivedMktu.length > 0 && (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-2 max-w-2xl mx-auto">
                  <span className="font-medium">→ МКТУ из ОКВЭД:</span>{' '}
                  {okvedDerivedMktu.map(n => String(n).padStart(2, '0')).join(', ')}
                </div>
              )}

              {/* Selected ИНН/ОГРН chips (always visible when chosen) */}
              {(subjectTin || subjectPsrn) && (
                <div className="flex flex-wrap gap-1.5 mt-3 max-w-2xl mx-auto">
                  {subjectTin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      <span className="font-mono font-bold">ИНН:</span> {subjectTin}
                      <button onClick={() => setSubjectTin('')} className="text-emerald-400 hover:text-red-500 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {subjectPsrn && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      <span className="font-mono font-bold">ОГРН:</span> {subjectPsrn}
                      <button onClick={() => setSubjectPsrn('')} className="text-emerald-400 hover:text-red-500 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* MKTU panel — shown when activeFilter === 'mktu' */}
              {activeFilter === 'mktu' && (
                <div className="mt-3 border border-border rounded-lg bg-card max-h-72 overflow-y-auto p-2 shadow-lg max-w-2xl mx-auto">
                  <Input
                    value={mktuSearch}
                    onChange={(e) => setMktuSearch(e.target.value)}
                    placeholder={t('filter.classSearch')}
                    className="h-8 mb-2"
                    autoFocus
                  />
                  <div className="space-y-0.5">
                    {filteredMktu.map(c => (
                      <label
                        key={c.number}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-background cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={mktuClasses.includes(c.number)}
                          onChange={() => toggleMktu(c.number)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="font-mono text-xs text-muted-foreground w-7">{String(c.number).padStart(2, '0')}</span>
                        <span className="text-slate-700">{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* OKVED panel — shown when activeFilter === 'okved' */}
              {activeFilter === 'okved' && (
                <div className="mt-3 border border-border rounded-lg bg-card max-h-72 overflow-y-auto p-2 shadow-lg max-w-2xl mx-auto">
                  <Input
                    value={okvedSearch}
                    onChange={(e) => setOkvedSearch(e.target.value)}
                    placeholder="Поиск вида деятельности..."
                    className="h-8 mb-2"
                    autoFocus
                  />
                  <div className="space-y-0.5">
                    {filteredOkved.map(s => (
                      <label
                        key={s.letter}
                        className="flex items-start gap-2 p-1.5 rounded hover:bg-background cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={okvedSections.includes(s.letter)}
                          onChange={() => toggleOkved(s.letter)}
                          className="w-4 h-4 accent-primary mt-0.5"
                        />
                        <span className="font-mono text-xs text-emerald-600 font-bold w-6">{s.letter}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-700">{s.title}</div>
                          <div className="text-[10px] text-muted-foreground/70 line-clamp-1">{s.description}</div>
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            МКТУ: {s.mktuClasses.join(', ')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ИНН/ОГРН panel — shown when activeFilter === 'subject' */}
              {activeFilter === 'subject' && (
                <div className="mt-3 border border-border rounded-lg bg-card p-3 shadow-lg max-w-2xl mx-auto">
                  <p className="text-xs text-muted-foreground mb-2">
                    Фильтр по владельцу: найти все товарные знаки компании по ИНН или ОГРН — для проверки портфеля конкурентов
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        value={subjectTin}
                        onChange={(e) => setSubjectTin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder={t('filter.tinPlaceholder')}
                        className="pl-9 h-10"
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        value={subjectPsrn}
                        onChange={(e) => setSubjectPsrn(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        placeholder={t('filter.psrnPlaceholder')}
                        className="pl-9 h-10"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI MKTU helper — separate block below filters */}
              <div className="mt-4 max-w-lg mx-auto">
                <a
                  href="https://мкту.рус"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium border border-primary/20 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  {t('filter.aiMktuHint')}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>

              {error && (
                <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3" />
              Поиск займёт ~3 секунды · Без регистрации
            </p>
          </div>
        </section>

        {/* ============ RESULTS ============ */}
        {hasSearched && (
          <section id="results-section" className="max-w-6xl mx-auto px-4 py-12">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Ищем по реестрам Роспатента…</p>
              </div>
            ) : totalFound !== null && (
              <>
                {/* Risk assessment — toggle via button */}
                {riskLevel && (
                  showRiskAssessment ? (
                    <div className={cn(
                      'rounded-2xl border p-6 md:p-8 mb-8 shadow-sm relative',
                      riskConfig[riskLevel].bg,
                      riskConfig[riskLevel].border,
                    )}>
                      {/* Close button to hide risk assessment */}
                      <button
                        onClick={() => setShowRiskAssessment(false)}
                        aria-label="Скрыть оценку рисков"
                        className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-full bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className={cn('flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-card shadow-sm', riskConfig[riskLevel].text)}>
                          {(() => {
                            const Icon = riskConfig[riskLevel].icon
                            return <Icon className="w-9 h-9" />
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className={cn('text-2xl font-bold mb-1', riskConfig[riskLevel].text)}>
                            {riskConfig[riskLevel].label}
                          </h2>
                          <p className="text-sm text-muted-foreground mb-3">
                            {riskConfig[riskLevel].sub}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                              <div
                                className={cn('h-full transition-all duration-700', riskConfig[riskLevel].barBg)}
                                style={{ width: `${riskConfig[riskLevel].percent}%` }}
                              />
                            </div>
                            <span className={cn('text-sm font-semibold', riskConfig[riskLevel].text)}>
                              {riskConfig[riskLevel].percent}%
                            </span>
                          </div>
                        </div>
                        <div className="text-center md:text-right">
                          <div className="text-3xl font-bold text-foreground">{totalFound}</div>
                          <div className="text-xs text-muted-foreground">найдено совпадений</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Button to show risk assessment */
                    <div className="mb-6">
                      <button
                        onClick={() => setShowRiskAssessment(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors border border-border"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Предварительная оценка рисков
                      </button>
                    </div>
                  )
                )}

                {/* Tabs: Все / Свидетельства / Заявки */}
                {results.length > 0 && (() => {
                  const isCertificate = (r: CheckResult) => !!(r.registrationDate && r.registrationDate.trim())
                  const isApplication = (r: CheckResult) => !isCertificate(r)
                  const certCount = results.filter(isCertificate).length
                  const appCount = results.filter(isApplication).length
                  return (
                    <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-4 max-w-md">
                      <button
                        onClick={() => setResultTab('all')}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                          resultTab === 'all'
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Все ({results.length})
                      </button>
                      <button
                        onClick={() => setResultTab('certificates')}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                          resultTab === 'certificates'
                            ? 'bg-card text-emerald-600 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Свидетельства ({certCount})
                      </button>
                      <button
                        onClick={() => setResultTab('applications')}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                          resultTab === 'applications'
                            ? 'bg-card text-amber-600 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Заявки ({appCount})
                      </button>
                    </div>
                  )
                })()}

                {/* Carousel */}
                {results.length > 0 ? (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <h3 className="text-lg font-bold text-foreground">
                        Найденные знаки
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          {(() => {
                            const isCert = (r: CheckResult) => !!(r.registrationDate && r.registrationDate.trim())
                            const filtered = resultTab === 'all' ? results
                              : resultTab === 'certificates' ? results.filter(isCert)
                              : results.filter(r => !isCert(r))
                            return `${filtered.length} показано${totalFound !== null && totalFound > results.length ? ` из ${Math.min(totalFound, MAX_RESULTS)}` : ''}`
                          })()}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {showRiskAssessment && (() => {
                          const isCert = (r: CheckResult) => !!(r.registrationDate && r.registrationDate.trim())
                          const criticalCount = results.filter(r => getRiskLevel(r, search) === 'critical').length
                          const highCount = results.filter(r => getRiskLevel(r, search) === 'high').length
                          const mediumCount = results.filter(r => getRiskLevel(r, search) === 'medium').length
                          if (criticalCount === 0 && highCount === 0 && mediumCount === 0) return null
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              {criticalCount > 0 && (
                                <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', RISK_COLORS.critical.chip)}>
                                  <ShieldAlert className="w-3 h-3" />
                                  {criticalCount} критич.
                                </span>
                              )}
                              {highCount > 0 && (
                                <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', RISK_COLORS.high.chip)}>
                                  <AlertTriangle className="w-3 h-3" />
                                  {highCount} высок. риск
                                </span>
                              )}
                              {mediumCount > 0 && (
                                <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', RISK_COLORS.medium.chip)}>
                                  <AlertTriangle className="w-3 h-3" />
                                  {mediumCount} средн. риск
                                </span>
                              )}
                            </div>
                          )
                        })()}
                        <Button variant="outline" size="sm" onClick={handleExport}>
                          <FileText className="w-4 h-4 mr-1.5" />
                          RTF
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSvgExport}>
                          <Download className="w-4 h-4 mr-1.5" />
                          SVG
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {(() => {
                        const isCert = (r: CheckResult) => !!(r.registrationDate && r.registrationDate.trim())
                        const filtered = resultTab === 'all' ? results
                          : resultTab === 'certificates' ? results.filter(isCert)
                          : results.filter(r => !isCert(r))
                        const sorted = sortResultsByRisk(filtered, search)
                        return sorted.map((r, i) => {
                          const level = getRiskLevel(r, search)
                          const colors = RISK_COLORS[level]
                          const isApp = !isCert(r)
                          // When risk assessment is hidden, use neutral colors (no risk badges)
                          const showRisk = showRiskAssessment
                          return (
                            <div
                              key={r.id || r.certificate || i}
                              className={cn(
                                'relative bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all',
                                showRisk ? colors.card : 'border-border',
                              )}
                            >
                              {/* Badges (top-left, absolute) — only when risk assessment is shown */}
                              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                {showRisk && level !== 'low' && (
                                  <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-md', colors.cardBadge)}>
                                    {level === 'critical' && <ShieldAlert className="w-3 h-3" />}
                                    {level !== 'critical' && <AlertTriangle className="w-3 h-3" />}
                                    {level === 'critical' ? 'Точное совпад.' : level === 'high' ? 'Высокий риск' : 'Средний риск'}
                                  </div>
                                )}
                                {isApp && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wide shadow-md border border-border">
                                    Заявка
                                  </div>
                                )}
                                {r.catalog === 'wotm' && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 light:text-violet-600 text-[10px] font-bold uppercase tracking-wide shadow-md border border-violet-500/30">
                                    Международный
                                  </div>
                                )}
                              </div>
                              {/* Similarity % (top-right, absolute) */}
                              {(() => {
                                const pct = simPercent(r.similarity)
                                return pct !== null ? (
                                  <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-md">
                                    {pct}%
                                  </div>
                                ) : null
                              })()}
                              {/* Image */}
                              <div className="h-32 bg-secondary flex items-center justify-center p-3">
                                {r.imageUrl ? (
                                  <img
                                    src={r.imageUrl ? `/api/tm-image?url=${encodeURIComponent(r.imageUrl)}` : ''}
                                    alt={r.name}
                                    loading="lazy"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                ) : r.name ? (
                                  // No image but name exists → render name as styled text (VERBAL fallback)
                                  <div className="text-center">
                                    <span className="text-foreground font-bold text-base leading-tight line-clamp-3 block">
                                      {r.name}
                                    </span>
                                  </div>
                                ) : r.certificate ? (
                                  // No name, no image → show certificate number as styled placeholder
                                  <div className="text-center">
                                    <div className="text-muted-foreground/50 text-[10px] uppercase tracking-wider mb-0.5">ТЗ №</div>
                                    <div className="text-foreground font-mono font-bold text-lg">{r.certificate}</div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground/70 text-xs text-center">нет изображения</div>
                                )}
                              </div>
                              {/* Body */}
                              <div className="p-3 space-y-2">
                                <div className="font-semibold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
                                  {r.name || r.certificate || '—'}
                                </div>
                                {showRisk && (
                                  <div className={cn('text-xs px-2 py-0.5 rounded border inline-block', colors.badge)}>
                                    {RISK_LABELS[level]}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                                  <div className="font-mono">
                                    Св-во: {r.certificate ? (
                                      <a
                                        href={r.catalog === 'wotm'
                                          ? `https://www3.wipo.int/madrid/monitor/en/showData.jsp?ID=ROM.${r.certificate}`
                                          : `http://www1.fips.ru/fips_servl/fips_servlet?DB=RUTM&DocNumber=${r.certificate}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {r.certificate}
                                      </a>
                                    ) : '—'}
                                  </div>
                                  {r.mktu && r.mktu.length > 0 && (
                                    <div className="line-clamp-1">МКТУ: {r.mktu.join(', ')}</div>
                                  )}
                                  {(() => {
                                    const owner = typeof r.owner === 'object' ? r.owner?.fullName : r.owner
                                    return owner ? <div className="line-clamp-1">{owner}</div> : null
                                  })()}
                                  {(r.priorityDate || r.registrationDate) && (
                                    <div className="text-[10px] text-muted-foreground/70 line-clamp-1">
                                      {[r.priorityDate && `Приоритет: ${r.priorityDate}`, r.registrationDate && `Рег: ${r.registrationDate}`].filter(Boolean).join(' · ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>

                    {/* Load more — 50 at a time, up to 500 total */}
                    {(hasMore || loadingMore) && (
                      <div className="text-center mt-6">
                        <Button
                          onClick={loadMore}
                          disabled={loadingMore}
                          variant="outline"
                          size="lg"
                          className="px-8"
                        >
                          {loadingMore ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          {loadingMore ? 'Загрузка...' : 'Загрузить ещё 50'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Показано {results.length} из {Math.min(totalFound || 0, MAX_RESULTS)}
                          {totalFound !== null && totalFound > MAX_RESULTS && (
                            <span className="text-amber-600"> (всего в реестре: {totalFound})</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Reached 500 cap */}
                    {!hasMore && !loadingMore && results.length >= MAX_RESULTS && (
                      <div className="text-center mt-6">
                        <p className="text-xs text-amber-600">
                          Достигнут лимит в {MAX_RESULTS} результатов.
                          {totalFound !== null && totalFound > MAX_RESULTS && (
                            <> В реестре всего: {totalFound}. </>
                          )}
                          Для полного поиска используйте <Link href="/search" className="underline">полный агрегатор →</Link>
                        </p>
                      </div>
                    )}

                    {/* All loaded (less than 500) */}
                    {!hasMore && !loadingMore && results.length > 0 && results.length < MAX_RESULTS && totalFound !== null && (
                      <div className="text-center mt-6">
                        <p className="text-xs text-muted-foreground/70">
                          Загружены все {results.length} результатов из реестра
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-lg font-medium text-foreground mb-1">
                      Товарные знаки не найдены
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Вероятно, название свободно для регистрации
                    </p>
                  </div>
                )}

                {/* Linkmark.ru parallel results */}
                {linkmarkLoading && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <h3 className="font-bold text-foreground">linkmark.ru — поиск...</h3>
                    </div>
                  </div>
                )}

                {!linkmarkLoading && linkmarkResults.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">linkmark.ru</span>
                        Найдено: {linkmarkTotal ?? linkmarkResults.length}
                      </h3>
                      <a
                        href="https://linkmark.ru"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Открыть на linkmark.ru
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {linkmarkResults.map((r, i) => (
                        <div key={i} className="bg-secondary rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors">
                          <div className="h-32 bg-background flex items-center justify-center p-3">
                            {r.imageUrl ? (
                              <img src={r.imageUrl ? `/api/tm-image?url=${encodeURIComponent(r.imageUrl)}` : ''} alt={r.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                            ) : r.name ? (
                              <div className="text-center">
                                <span className="text-foreground font-bold text-base leading-tight line-clamp-3 block">{r.name}</span>
                              </div>
                            ) : r.certificate ? (
                              <div className="text-center">
                                <div className="text-muted-foreground/50 text-[10px] uppercase tracking-wider mb-0.5">ТЗ №</div>
                                <div className="text-foreground font-mono font-bold text-lg">{r.certificate}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">нет изображения</span>
                            )}
                          </div>
                          <div className="p-3 space-y-1.5">
                            <div className="font-semibold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">{r.name || r.certificate || '—'}</div>
                            <div className={cn(
                              'text-xs px-2 py-0.5 rounded border inline-block',
                              r.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              r.status === 'expired' ? 'bg-slate-500/10 border-slate-500/30 text-slate-400' :
                              'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            )}>
                              {r.statusText || r.status || '—'}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {r.certificate && (
                                <div className="font-mono">
                                  Св-во: <a
                                    href={`http://www1.fips.ru/fips_servl/fips_servlet?DB=RUTM&DocNumber=${r.certificate}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {r.certificate}
                                  </a>
                                </div>
                              )}
                              {r.owner && <div className="line-clamp-1">{r.owner}</div>}
                              {r.mktu && r.mktu.length > 0 && <div className="line-clamp-1">МКТУ: {r.mktu.join(', ')}</div>}
                              {r.priorityDate && <div className="text-[10px]">Приоритет: {r.priorityDate}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full results link */}
                <div className="text-center">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-base transition-colors"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Дополнительный поиск →
                  </Link>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    linkmark.ru · brand-search.ru · WIPO GBD · поиск по изображению
                  </p>
                </div>
              </>
            )}
          </section>
        )}

        {/* ============ FIPS ROSPATENT BUTTON (between search form and features) ============ */}
        {!hasSearched && (
          <section className="max-w-3xl mx-auto px-4 pb-2">
            <div className="flex justify-center">
              <Link
                href="/FIPS_Rospatent_Sistema_poisk_znakov.html"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('fips.buttonFull')}</span>
                <span className="sm:hidden">{t('fips.buttonShort')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ============ FEATURES (before first search) ============ */}
        {!hasSearched && (
          <>
            <section className="max-w-6xl mx-auto px-4 py-8">
              <details className="group">
                <summary className="cursor-pointer flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors list-none">
                  {t('features.title')}
                  <Plus className="w-4 h-4 transition-transform group-open:rotate-45" />
                </summary>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  {[
                    { icon: Search, title: t('features.free.title'), text: t('features.free.text') },
                    { icon: ShieldCheck, title: t('features.risk.title'), text: t('features.risk.text') },
                    { icon: Layers, title: t('features.mktu.title'), text: t('features.mktu.text') },
                    { icon: FileText, title: t('features.export.title'), text: t('features.export.text') },
                    { icon: Clock, title: t('features.fast.title'), text: t('features.fast.text') },
                    { icon: Award, title: t('features.accurate.title'), text: t('features.accurate.text') },
                  ].map((f, i) => {
                    const Icon = f.icon
                    return (
                      <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow">
                        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                      </div>
                    )
                  })}
                </div>
              </details>
            </section>

            {/* How it works */}
            <section className="bg-popover border-y border-border">
              <div className="max-w-6xl mx-auto px-4 py-8">
                <details className="group">
                  <summary className="cursor-pointer flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors list-none">
                    Как проверить товарный знак
                    <Plus className="w-4 h-4 transition-transform group-open:rotate-45" />
                  </summary>
                  <div className="grid md:grid-cols-4 gap-6 mt-6">
                    {[
                      { step: 1, title: t('how.step1.title'), text: t('how.step1.text') },
                      { step: 2, title: t('how.step2.title'), text: t('how.step2.text') },
                      { step: 3, title: t('how.step3.title'), text: t('how.step3.text') },
                      { step: 4, title: t('how.step4.title'), text: t('how.step4.text') },
                    ].map(s => (
                      <div key={s.step} className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-4">
                          {s.step}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-4 py-16 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {t('cta.title')}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t('cta.description')}
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-base transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                {t('cta.openFullSearch')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-popover">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline font-medium">NayTea.ru</Link>
          {' · '}
          {t('footer.tagline')}
          <div className="mt-1.5 text-muted-foreground/70">
            {t('footer.sources')}
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
