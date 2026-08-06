'use client'

import { useState } from 'react'
import { ArrowLeft, ExternalLink, Shield, AlertTriangle, Loader2, Globe, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TmviewPage() {
  const [iframeError, setIframeError] = useState(false)
  const [loading, setLoading] = useState(true)

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-full px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">NayTea.ru</span>
                <span className="sm:hidden">Назад</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br bg-white border border-slate-200 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">TMview</h1>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Европейская платформа поиска товарных знаков (EUIPO)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mktu"
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors border border-cyan-800/60 font-medium"
              title="МКТУ простыми словами — справочник"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">МКТУ простыми словами</span>
              <span className="sm:hidden">МКТУ</span>
            </Link>
            <a
              href="https://www.tmdn.org/tmview/#/tmview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Открыть в новой вкладке <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* If iframe blocked — show fallback */}
      {iframeError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-lg font-semibold text-white mb-2">
              Встроенное окно недоступно
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Сайт TMview (tmdn.org) блокирует встраивание в iframe из соображений безопасности.
              Но вы можете открыть его в новой вкладке — это работает идентично.
            </p>
            <a
              href="https://www.tmdn.org/tmview/#/tmview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all shadow-lg shadow-cyan-500/30"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть TMview в новой вкладке
            </a>
          </div>
          <div className="text-xs text-slate-500 max-w-md text-center">
            TMview — это европейская платформа поиска товарных знаков от EUIPO.
            Покрывает страны ЕС, а также некоторые другие (не включает российские ТЗ).
          </div>
        </div>
      ) : (
        <>
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-40">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              <p className="text-sm text-slate-400">Загрузка TMview…</p>
              <p className="text-xs text-slate-500">Если загрузка долго не завершается — сайт блокирует встраивание</p>
            </div>
          )}

          {/* Hidden iframe — we try to load it, but if it's blocked we show fallback */}
          <iframe
            src="https://www.tmdn.org/tmview/#/tmview"
            className="flex-1 w-full border-0"
            style={{ minHeight: 'calc(100vh - 60px)' }}
            onLoad={() => {
              // Give a short delay — if the iframe loaded but is blank, it was blocked
              setTimeout(() => setLoading(false), 2000)
            }}
            onError={() => {
              setIframeError(true)
              setLoading(false)
            }}
            allow="clipboard-read; clipboard-write; fullscreen"
            title="TMview — поиск товарных знаков"
          />

          {/* Timeout detection — if loading takes > 8s, show fallback */}
          <TimeoutDetector
            onTimeout={() => {
              setIframeError(true)
              setLoading(false)
            }}
          />
        </>
      )}
    </div>
  )
}

/**
 * Invisible component that calls onTimeout after 8 seconds.
 * Used to detect if the iframe was silently blocked.
 */
function TimeoutDetector({ onTimeout }: { onTimeout: () => void }) {
  useState(() => {
    const timer = setTimeout(onTimeout, 8000)
    return () => clearTimeout(timer)
  })
  return null
}
