import Link from 'next/link'
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'FIPS Rospatent — Система поиска знаков | NayTea',
  description: 'Встроенный доступ к официальной платформе Роспатента для проверки товарных знаков.',
}

export const dynamic = 'force-static'

const ROSPATENT_URL = 'https://openstat.rospatent.gov.ru/trademarks'

export default function FipsRospatentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border bg-popover/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground border border-border transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Назад на NayTea</span>
              <span className="sm:hidden">Назад</span>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">
                  ФИПС Роспатент — Система поиска знаков
                </h1>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                  Официальная платформа Роспатента · открытая статистика и поиск по товарным знакам
                </p>
              </div>
            </div>
          </div>
          <a
            href={ROSPATENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Открыть в новой вкладке</span>
            <span className="sm:hidden">Новая вкладка</span>
          </a>
        </div>
      </header>

      {/* Iframe area */}
      <main className="flex-1 relative">
        <iframe
          src={ROSPATENT_URL}
          title="ФИПС Роспатент — Платформа поиска товарных знаков"
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
        {/* Fallback notice shown if iframe is blocked / not yet loaded */}
        <noscript>
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Ваш браузер блокирует встроенные iframe. Откройте платформу Роспатента напрямую:
              </p>
              <a
                href={ROSPATENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть openstat.rospatent.gov.ru
              </a>
            </div>
          </div>
        </noscript>
      </main>
    </div>
  )
}
