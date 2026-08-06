'use client'

import Link from 'next/link'
import {
  Phone, Mail, MapPin, Clock, User, Building2, FileText, Shield,
  ExternalLink, ArrowLeft, Send, MessageCircle, BookOpen, ArrowRight,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/useLanguage'

export default function ContactsPage() {
  const { lang } = useLanguage()

  const content = {
    ru: {
      backHome: '← На главную',
      companyName: 'ООО «Патентные Технологии»',
      tagline: 'Патентное бюро — регистрация и продажа товарных знаков, патентов, авторских прав',
      phone: 'Телефон',
      phoneHint: 'tel./WhatsApp',
      email: 'Email',
      address: 'Адрес',
      addressValue: 'Москва, м. «Бабушкинская», Анадырский проезд, д. 31/1, оф. 31',
      hours: 'Часы работы',
      hoursValue: 'Пн—Пт: 10:00—20:00, Сб—Вс: бесплатные консультации',
      director: 'Генеральный директор',
      directorName: 'Беркутова Наталья Николаевна',
      patentAttorney: 'Патентный поверенный по товарным знакам №957',
      requisitesTitle: 'Реквизиты',
      requisitesSubtitle: 'Юридические реквизиты для договора',
      fullName: 'Полное наименование',
      fullNameValue: 'Общество с ограниченной ответственностью «Патентные Технологии»',
      shortName: 'Краткое наименование',
      shortNameValue: 'ООО «Патентные Технологии»',
      ogrn: 'ОГРН',
      ogrnValue: '1117746321296',
      inn: 'ИНН',
      innValue: '7716687757',
      kpp: 'КПП',
      kppValue: '771601001',
      okpo: 'ОКПО',
      okpoValue: '91506136',
      regDate: 'Дата регистрации',
      regDateValue: '22 апреля 2011',
      okved: 'Основной ОКВЭД',
      okvedValue: '69 — Деятельность в области права и бухгалтерского учета',
      taxAuthority: 'Налоговый орган',
      taxAuthorityValue: 'Межрайонная инспекция ФНС № 46 по г. Москве',
      checkInRegistry: 'Проверить в реестре РБК Компании',
      ctaTitle: 'Готовы обсудить сделку?',
      ctaText: 'Позвоните или напишите — ответим на все вопросы по товарным знакам, патентам и авторским правам',
      callBtn: 'Позвонить',
      telegramBtn: 'Написать в Telegram',
      whatsappBtn: 'Написать в WhatsApp',
      emailBtn: 'Написать на email',
      footerText: 'Контакты — ООО «Патентные Технологии»',
      seeAlsoTitle: 'Смотрите также',
      seeAlsoMktuTitle: 'МКТУ простыми словами',
      seeAlsoMktuText: 'Что такое МКТУ, зачем подбирать классы для товарного знака, какие инструменты помогают и сколько платить Роспатенту. Справочник простым языком — без маркетинга.',
      seeAlsoMktuBtn: 'Открыть справочник',
      footerMktuLink: 'МКТУ простыми словами',
      navMktu: 'МКТУ простыми словами',
    },
    en: {
      backHome: '← Home',
      companyName: 'Patent Technologies LLC',
      tagline: 'Patent bureau — registration and sale of trademarks, patents, copyright',
      phone: 'Phone',
      phoneHint: 'tel./WhatsApp',
      email: 'Email',
      address: 'Address',
      addressValue: 'Moscow, m. Babushkinskaya, Anadyrsky proezd, 31/1, of. 31',
      hours: 'Working hours',
      hoursValue: 'Mon—Fri: 10:00—20:00, Sat—Sun: free consultations',
      director: 'General Director',
      directorName: 'Berkutova Natalya Nikolaevna',
      patentAttorney: 'Patent attorney for trademarks No. 957',
      requisitesTitle: 'Requisites',
      requisitesSubtitle: 'Legal requisites for the contract',
      fullName: 'Full name',
      fullNameValue: 'Limited Liability Company "Patent Technologies"',
      shortName: 'Short name',
      shortNameValue: 'Patent Technologies LLC',
      ogrn: 'OGRN',
      ogrnValue: '1117746321296',
      inn: 'INN',
      innValue: '7716687757',
      kpp: 'KPP',
      kppValue: '771601001',
      okpo: 'OKPO',
      okpoValue: '91506136',
      regDate: 'Registration date',
      regDateValue: 'April 22, 2011',
      okved: 'Main OKVED',
      okvedValue: '69 — Legal and accounting activities',
      taxAuthority: 'Tax authority',
      taxAuthorityValue: 'Interdistrict Inspectorate of the Federal Tax Service No. 46 in Moscow',
      checkInRegistry: 'Check in the RBC Companies registry',
      ctaTitle: 'Ready to discuss a deal?',
      ctaText: 'Call or write — we will answer all questions about trademarks, patents, and copyright',
      callBtn: 'Call',
      telegramBtn: 'Message on Telegram',
      whatsappBtn: 'Message on WhatsApp',
      emailBtn: 'Send email',
      footerText: 'Contacts — Patent Technologies LLC',
      seeAlsoTitle: 'See also',
      seeAlsoMktuTitle: 'MKTU in plain words (in Russian)',
      seeAlsoMktuText: 'What MKTU is, why classes are selected for a trademark, which tools help, and how much to pay Rospatent. Reference guide in plain Russian — no marketing.',
      seeAlsoMktuBtn: 'Open guide',
      footerMktuLink: 'MKTU guide (RU)',
      navMktu: 'MKTU guide',
    },
    zh: {
      backHome: '← 返回首页',
      companyName: '«专利技术」有限责任公司',
      tagline: '专利局 —— 商标、专利和著作权的注册与销售',
      phone: '电话',
      phoneHint: '电话/WhatsApp',
      email: '邮箱',
      address: '地址',
      addressValue: '莫斯科,地铁「Бабушкинская」站,Анадырский 大道 31/1 号 31 室',
      hours: '工作时间',
      hoursValue: '周一至周五:10:00-20:00,周六至周日:免费咨询',
      director: '总经理',
      directorName: 'Беркутова Наталья Николаевна(纳塔利娅·尼古拉耶芙娜·别尔库托娃)',
      patentAttorney: '商标专利代理人 第 957 号',
      requisitesTitle: '企业资料',
      requisitesSubtitle: '合同所需法定资料',
      fullName: '全称',
      fullNameValue: '有限责任公司「专利技术」',
      shortName: '简称',
      shortNameValue: '「专利技术」有限责任公司',
      ogrn: '国家注册号 (ОГРН)',
      ogrnValue: '1117746321296',
      inn: '纳税人识别号 (ИНН)',
      innValue: '7716687757',
      kpp: '立户登记号 (КПП)',
      kppValue: '771601001',
      okpo: '企业分类码 (ОКПО)',
      okpoValue: '91506136',
      regDate: '注册日期',
      regDateValue: '2011 年 4 月 22 日',
      okved: '主要经济活动分类 (ОКВЭД)',
      okvedValue: '69 —— 法律和会计活动',
      taxAuthority: '税务机关',
      taxAuthorityValue: '莫斯科市第 46 跨区联邦税务局',
      checkInRegistry: '在 RBC 公司名录中查询',
      ctaTitle: '准备好讨论合作了吗?',
      ctaText: '致电或致信我们 —— 我们将解答所有关于商标、专利和著作权的问题',
      callBtn: '致电',
      telegramBtn: '在 Telegram 联系',
      whatsappBtn: '在 WhatsApp 联系',
      emailBtn: '发送邮件',
      footerText: '联系方式 —— 「专利技术」有限责任公司',
      seeAlsoTitle: '相关内容',
      seeAlsoMktuTitle: 'МКТУ 通俗讲解(俄文)',
      seeAlsoMktuText: '什么是 МКТУ、为什么要为商标选择类别、有哪些辅助工具、以及向 Роспатент 缴纳多少费用。通俗易懂的俄文参考指南,无营销内容。',
      seeAlsoMktuBtn: '打开指南',
      footerMktuLink: 'МКТУ 指南(俄文)',
      navMktu: 'МКТУ 指南',
    },
  }

  const c = content[lang] || content.ru

  const requisites = [
    { label: c.fullName, value: c.fullNameValue },
    { label: c.shortName, value: c.shortNameValue },
    { label: c.ogrn, value: c.ogrnValue, mono: true },
    { label: c.inn, value: c.innValue, mono: true },
    { label: c.kpp, value: c.kppValue, mono: true },
    { label: c.okpo, value: c.okpoValue, mono: true },
    { label: c.regDate, value: c.regDateValue },
    { label: c.okved, value: c.okvedValue },
    { label: c.taxAuthority, value: c.taxAuthorityValue },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-popover/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/teapot.svg" alt="NayTea.ru" className="w-5 h-5" />
            </div>
            <span className="text-base font-bold text-foreground">NayTea.ru</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/mktu"
              className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors inline-flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{c.navMktu}</span>
              <span className="sm:hidden">МКТУ</span>
            </Link>
            <Link
              href="/"
              className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              {c.backHome}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* ===== COMPANY CARD ===== */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-10 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {c.companyName}
          </h1>
          <p className="text-muted-foreground mb-8">{c.tagline}</p>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.phone}</div>
                <a href="tel:+79957890900" className="text-foreground hover:text-primary transition-colors font-medium">
                  +7 (995) 789-09-00
                </a>
                <div className="text-xs text-muted-foreground mt-0.5">{c.phoneHint}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.email}</div>
                <a href="mailto:info@ptn.su" className="text-foreground hover:text-primary transition-colors font-medium">
                  info@ptn.su
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.address}</div>
                <div className="text-foreground font-medium">{c.addressValue}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.hours}</div>
                <div className="text-foreground font-medium text-sm">{c.hoursValue}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.director}</div>
                <div className="text-foreground font-semibold text-lg">{c.directorName}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {c.patentAttorney}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== REQUISITES ===== */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{c.requisitesTitle}</h2>
              <p className="text-xs text-muted-foreground">{c.requisitesSubtitle}</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {requisites.map((r, i) => (
              <div key={i} className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-4">
                <div className="text-sm text-muted-foreground">{r.label}</div>
                <div className={`text-sm text-foreground font-medium ${r.mono ? 'font-mono' : ''}`}>
                  {r.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
            <a
              href="https://check.tochka.com/company/326774600387723/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Tochka.com
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href="https://companies.rbc.ru/id/1117746321296-ooo-patentnyie-tehnologii/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {c.checkInRegistry}
            </a>
          </div>
        </div>

        {/* ===== SEE ALSO: MKTU GUIDE ===== */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{c.seeAlsoTitle}</h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-5 p-5 rounded-xl bg-muted/40 border border-border">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground mb-1">{c.seeAlsoMktuTitle}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.seeAlsoMktuText}</p>
            </div>
            <Link
              href="/mktu"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-semibold transition-colors"
            >
              {c.seeAlsoMktuBtn}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ===== CTA ===== */}
        <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-2xl border border-border p-6 md:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {c.ctaTitle}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {c.ctaText}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+79957890900"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-semibold transition-colors"
            >
              <Phone className="w-4 h-4" />
              {c.callBtn}
            </a>
            <a
              href="https://t.me/+79957890900"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors"
            >
              <Send className="w-4 h-4" />
              {c.telegramBtn}
            </a>
            <a
              href="https://wa.me/79957890900"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {c.whatsappBtn}
            </a>
            <a
              href="mailto:info@ptn.su"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors"
            >
              <Mail className="w-4 h-4" />
              {c.emailBtn}
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-popover">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline font-medium">NayTea.ru</Link>
          {' · '}
          {c.footerText}
          {' · '}
          <Link href="/mktu" className="text-primary hover:underline">{c.footerMktuLink}</Link>
        </div>
      </footer>
    </div>
  )
}
