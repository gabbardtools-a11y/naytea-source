'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Gift, Database, Clock, Palette, Globe, Image as ImageIcon,
  Download, ExternalLink, Mail, MessageCircle, Sparkles, Zap,
  Building2, Scale, Megaphone, Calculator, Rocket, Code,
  Check, X, ChevronDown, TrendingUp, Users, Shield, Heart,
  ArrowRight, FileText, Layers, Award, Briefcase, Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { pt } from '@/lib/i18n/partners-content'

export default function PartnersPage() {
  const { lang } = useLanguage()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const benefits = [
    { icon: Gift, key: 'benefit1' as const, color: 'emerald' },
    { icon: Database, key: 'benefit2' as const, color: 'blue' },
    { icon: Clock, key: 'benefit3' as const, color: 'violet' },
    { icon: Palette, key: 'benefit4' as const, color: 'pink' },
    { icon: Globe, key: 'benefit5' as const, color: 'cyan' },
    { icon: ImageIcon, key: 'benefit6' as const, color: 'amber' },
  ]

  const useCases = [
    { icon: Scale, key: 'useCase1' as const },
    { icon: Building2, key: 'useCase2' as const },
    { icon: Megaphone, key: 'useCase3' as const },
    { icon: Calculator, key: 'useCase4' as const },
    { icon: Rocket, key: 'useCase5' as const },
    { icon: Code, key: 'useCase6' as const },
  ]

  const features = [
    { icon: Search, key: 'feature1' as const },
    { icon: Hash, key: 'feature2' as const },
    { icon: Users, key: 'feature3' as const },
    { icon: ImageIcon, key: 'feature4' as const },
    { icon: Layers, key: 'feature5' as const },
    { icon: FileText, key: 'feature6' as const },
    { icon: Shield, key: 'feature7' as const },
    { icon: ExternalLink, key: 'feature8' as const },
  ]

  const numbers = [
    { value: 'number1' as const, label: 'number1Label' as const },
    { value: 'number2' as const, label: 'number2Label' as const },
    { value: 'number3' as const, label: 'number3Label' as const },
    { value: 'number4' as const, label: 'number4Label' as const },
    { value: 'number5' as const, label: 'number5Label' as const },
    { value: 'number6' as const, label: 'number6Label' as const },
  ]

  const comparison = [
    { f: 'compareRow1F' as const, n: 'compareRow1N' as const, o: 'compareRow1O' as const },
    { f: 'compareRow2F' as const, n: 'compareRow2N' as const, o: 'compareRow2O' as const },
    { f: 'compareRow3F' as const, n: 'compareRow3N' as const, o: 'compareRow3O' as const },
    { f: 'compareRow4F' as const, n: 'compareRow4N' as const, o: 'compareRow4O' as const },
    { f: 'compareRow5F' as const, n: 'compareRow5N' as const, o: 'compareRow5O' as const },
    { f: 'compareRow6F' as const, n: 'compareRow6N' as const, o: 'compareRow6O' as const },
  ]

  const faqs = [
    { q: 'faq1Q' as const, a: 'faq1A' as const },
    { q: 'faq2Q' as const, a: 'faq2A' as const },
    { q: 'faq3Q' as const, a: 'faq3A' as const },
    { q: 'faq4Q' as const, a: 'faq4A' as const },
    { q: 'faq5Q' as const, a: 'faq5A' as const },
    { q: 'faq6Q' as const, a: 'faq6A' as const },
  ]

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    violet: 'bg-violet-500/10 text-violet-400',
    pink: 'bg-pink-500/10 text-pink-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
            <Sparkles className="w-3 h-3" />
            {pt('heroBadge', lang)}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            {pt('title', lang)}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {pt('subtitle', lang)}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="https://raw.githubusercontent.com/gabbardtools-a11y/znakvsem-ru/main/tilda-embed-code.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-base transition-colors"
            >
              <Download className="w-5 h-5" />
              {pt('heroCta', lang)}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#why"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-base transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              {pt('heroSecondaryCta', lang)}
            </a>
          </div>

          {/* Live form preview — embedded iframe */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/50">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">example.ru — {pt('title', lang)}</span>
              </div>
              <iframe
                src="https://naytea.ru/partners/search"
                title="NayTea search form preview"
                className="w-full"
                style={{ height: '600px', border: 0, display: 'block' }}
                loading="lazy"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              ↑ {pt('heroSecondaryCta', lang)}
            </p>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section id="why" className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {pt('whyTitle', lang)}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {pt('whySubtitle', lang)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-xl hover:border-primary/40 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[b.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {pt(`${b.key}Title` as any, lang)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pt(`${b.key}Text` as any, lang)}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== NUMBERS ===== */}
      <section className="bg-popover/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            {pt('numbersTitle', lang)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {numbers.map((n, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-1">
                  {pt(n.value, lang)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pt(n.label, lang)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW TO INSTALL ===== */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {pt('installTitle', lang)}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {pt('installSubtitle', lang)}
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: Download, text: pt('step1', lang), num: 1 },
            { icon: FileText, text: pt('step2', lang), num: 2 },
            { icon: Code, text: pt('step3', lang), num: 3 },
            { icon: Check, text: pt('step4', lang), num: 4 },
          ].map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex gap-4 items-start bg-card rounded-2xl border border-border p-5">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="text-foreground leading-relaxed">{step.text}</p>
                </div>
                <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <Link
            href="https://raw.githubusercontent.com/gabbardtools-a11y/znakvsem-ru/main/tilda-embed-code.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            {pt('downloadCodeBtn', lang)}
          </Link>
          <Link
            href="/znakvsem.html"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            {pt('viewExampleBtn', lang)}
          </Link>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="bg-popover/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {pt('useCasesTitle', lang)}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {pt('useCasesSubtitle', lang)}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((u, i) => {
              const Icon = u.icon
              return (
                <div key={i} className="bg-background rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold mb-2">
                    {pt(`${u.key}Title` as any, lang)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pt(`${u.key}Text` as any, lang)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {pt('featuresTitle', lang)}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="flex items-start gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm pt-1.5">{pt(f.key, lang)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== COMPARISON ===== */}
      <section className="bg-popover/50 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            {pt('compareTitle', lang)}
          </h2>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-secondary/50 border-b border-border">
              <div className="p-4 text-sm font-semibold">{pt('compareCol1', lang)}</div>
              <div className="p-4 text-sm font-bold text-primary text-center">{pt('compareCol2', lang)}</div>
              <div className="p-4 text-sm font-semibold text-muted-foreground text-center">{pt('compareCol3', lang)}</div>
            </div>
            {comparison.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-border last:border-0">
                <div className="p-4 text-sm text-muted-foreground">{pt(row.f, lang)}</div>
                <div className="p-4 text-sm text-center font-medium text-foreground">{pt(row.n, lang)}</div>
                <div className="p-4 text-sm text-center text-muted-foreground">{pt(row.o, lang)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          {pt('faqTitle', lang)}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-medium text-sm md:text-base">{pt(faq.q, lang)}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {pt(faq.a, lang)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== OPEN PROGRAM ===== */}
      <section className="bg-popover/50 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {pt('programTitle', lang)}
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {pt('programText', lang)}
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white mb-6">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {pt('finalCtaTitle', lang)}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          {pt('finalCtaSubtitle', lang)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="https://raw.githubusercontent.com/gabbardtools-a11y/znakvsem-ru/main/tilda-embed-code.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            {pt('finalCtaBtn1', lang)}
          </Link>
          <Link
            href="/znakvsem.html"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            {pt('finalCtaBtn2', lang)}
          </Link>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          {pt('contactTitle', lang)}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          {pt('contactText', lang)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:info@naytea.ru"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            {pt('emailUs', lang)}
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-popover">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline font-medium">NayTea.ru</Link>
          {' · '}
          {pt('title', lang)}
        </div>
      </footer>
    </div>
  )
}
