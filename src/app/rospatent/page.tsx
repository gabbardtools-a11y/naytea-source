'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ExternalLink, Info, Shield, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function RospatentPage() {
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src="/teapot.svg" alt="NayTea.ru" className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Роспатент</h1>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Официальная платформа поиска товарных знаков
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mktu"
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors border border-emerald-700/50 font-medium"
              title="МКТУ простыми словами — справочник"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">МКТУ простыми словами</span>
              <span className="sm:hidden">МКТУ</span>
            </Link>
            <a
              href="https://searchplatform.rospatent.gov.ru/trademarks?source=tm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              Открыть в новой вкладке <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Info banner */}
      {!loading && (
        <div className="bg-emerald-950/40 border-b border-emerald-900/60 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Для поиска товарных знаков на Роспатенте необходима авторизация (вход в личный кабинет).
              Если вы не залогинены — нажмите «Войти» на странице ниже.
            </span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-400">Загрузка платформы Роспатент…</p>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src="https://searchplatform.rospatent.gov.ru/trademarks?source=tm"
        className="flex-1 w-full border-0"
        style={{ minHeight: 'calc(100vh - 120px)' }}
        onLoad={() => setLoading(false)}
        allow="clipboard-read; clipboard-write; fullscreen"
        title="Роспатент — поиск товарных знаков"
      />
    </div>
  )
}
