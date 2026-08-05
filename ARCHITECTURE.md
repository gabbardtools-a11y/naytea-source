# 🏗️ Архитектура NayTea.ru

> **Версия:** 1.0 · **Дата:** 2026-07-28 · **Автор:** Ная (opus)

---

## 📋 Кратко

**NayTea.ru** — бесплатный поиск товарных знаков по открытым реестрам Роспатента. Агрегатор 4 баз: D1 (1.15M знаков), linkmark.ru, brand-search.ru, WIPO GBD.

**Стек:** Next.js 16.1.3 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · Cloudflare D1 · PM2 · Caddy · VPS Ubuntu.

**URL:** https://naytea.ru

---

## 📁 Структура проекта

```
naytea-source/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout — читает cookie lang, html lang
│   │   ├── page.tsx                  # Главная страница (поиск)
│   │   ├── globals.css               # Глобальные стили + тёмная/светлая тема
│   │   ├── search/page.tsx           # /search — полный поиск
│   │   ├── partners/
│   │   │   ├── page.tsx              # /partners — SEO-страница для партнёров
│   │   │   ├── layout.tsx            # Layout с прозрачным фоном для iframe
│   │   │   └── search/page.tsx       # /partners/search — embed-форма для iframe
│   │   ├── contacts/page.tsx         # /contacts — контакты ООО «Патентные Технологии»
│   │   ├── check/page.tsx            # /check — Gardium-стиль проверки
│   │   ├── rospatent/page.tsx        # /rospatent — стат-страница
│   │   ├── tmview/page.tsx           # /tmview — TMview fallback
│   │   ├── FIPS_Rospatent_Sistema_poisk_znakov.html/
│   │   │   └── page.tsx              # iframe-страница с openstat.rospatent.gov.ru
│   │   └── api/                      # API routes
│   │       ├── rospatent/
│   │       │   ├── search/route.ts   # POST /api/rospatent/search — D1 поиск
│   │       │   ├── by-number/route.ts # POST /api/rospatent/by-number
│   │       │   └── stats/route.ts    # GET /api/rospatent/stats
│   │       ├── linkmark/
│   │       │   ├── search/route.ts   # POST /api/linkmark/search
│   │       │   └── more/route.ts     # POST /api/linkmark/more
│   │       ├── brand-search/
│   │       │   ├── search/route.ts   # POST /api/brand-search/search
│   │       │   ├── more/route.ts     # POST /api/brand-search/more
│   │       │   ├── image/route.ts    # POST /api/brand-search/image
│   │       │   ├── image-more/route.ts
│   │       │   └── by-subject/route.ts
│   │       ├── wipo/
│   │       │   ├── search/route.ts
│   │       │   ├── more/route.ts
│   │       │   ├── logo/route.ts
│   │       │   └── logo-more/route.ts
│   │       ├── tm-image/route.ts     # Прокси картинок (brand-search + linkmark)
│   │       └── ...
│   ├── lib/
│   │   ├── i18n/                     # 🔥 Система переводов (RU/EN/ZH)
│   │   │   ├── translations.ts       # Основной словарь (80+ ключей × 3 языка)
│   │   │   ├── partners-content.ts   # Переводы для /partners
│   │   │   ├── useLanguage.ts        # Client hook (t(), switchLang())
│   │   │   └── server.ts             # Server-side getLang() через cookies()
│   │   ├── rospatent-d1.ts           # D1 клиент (Cloudflare REST API)
│   │   ├── linkmark.ts               # linkmark.ru клиент (axios + CookieJar)
│   │   ├── brand-search-search.ts    # brand-search.ru клиент
│   │   ├── mktu.ts                   # 45 классов МКТУ
│   │   ├── okved.ts                  # ОКВЭД → МКТУ маппинг
│   │   ├── rtf-export.ts             # Экспорт результатов в RTF
│   │   ├── svg-export.ts             # Экспорт в SVG
│   │   └── utils.ts                  # cn() и пр.
│   ├── components/
│   │   ├── ui/                       # shadcn/ui компоненты
│   │   ├── theme/theme-toggle.tsx
│   │   └── toaster.tsx
│   ├── hooks/
│   │   └── use-toast.ts
│   └── middleware.ts                 # 🔥 i18n middleware (/en/, /zh/ → rewrite + cookie)
├── public/
│   ├── teapot.svg                    # Лого (зелёный чайник)
│   ├── znakvsem.html                 # Лендинг Игоря (с контактами ООО ПТ)
│   ├── logo.svg
│   └── robots.txt
├── Caddyfile                         # 🔥 Конфиг Caddy (X-Frame-Options, CSP для /partners/*)
├── package.json
├── next.config.ts                    # output: standalone, serverExternalPackages
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                   # shadcn/ui config
└── README.md
```

---

## 🌐 Система переводов (i18n)

**Архитектура (как в iznaki.ru):**

| Файл | Назначение |
|---|---|
| `src/lib/i18n/translations.ts` | Словарь: 80+ ключей × {ru, en, zh} |
| `src/lib/i18n/partners-content.ts` | Отдельный словарь для /partners |
| `src/lib/i18n/useLanguage.ts` | Client hook: `t(key)`, `switchLang(lang)` |
| `src/lib/i18n/server.ts` | `getLang()` — читает cookie через `next/headers` |
| `src/middleware.ts` | URL `/en/...` → rewrite + cookie `lang=en` |

**URL-структура:**
- `naytea.ru/` → RU (по умолчанию)
- `naytea.ru/en/...` → EN (middleware rewrite)
- `naytea.ru/zh/...` → ZH (middleware rewrite)

**Cookie:** `lang=ru|en|zh` (1 год, SameSite=Lax)

**Правила:**
1. Любой текст — через `t('key')` или `L(zh, en, ru)`
2. Хардкод русских строк в JSX — запрещён
3. Новый ключ — ОБЯЗАТЕЛЬНО все 3 языка
4. См. `I18N.md` для подробностей

---

## 🔍 Источники данных

| Источник | Что ищет | API endpoint | Объём |
|---|---|---|---|
| **D1 (Rospatent)** | Название, правообладатель, номер | `/api/rospatent/search` | 1 147 738 знаков |
| **linkmark.ru** | Название, владелец | `/api/linkmark/search` | ~1M |
| **brand-search.ru** | Название, номер, владелец, картинка | `/api/brand-search/search` | ~150k активных |
| **WIPO GBD** | Международные знаки | `/api/wipo/search` | ~международные |

**Переключатель баз** — в `page.tsx`, над вкладками «По названию/номеру/владельцу». Состояние: `dbSource: 'all' | 'd1' | 'linkmark' | 'brandsearch' | 'wipo'`.

---

## 💾 Cloudflare D1

**База:** `naytea-tm` (uuid `323853d9-3256-40c9-924b-6fdddbc67bb8`)

**Схема:**
```sql
CREATE TABLE trademarks (
  id INTEGER PRIMARY KEY,
  registration_number TEXT UNIQUE,
  text TEXT,                    -- название (enriched from beboss/brand-search)
  right_holder TEXT,            -- правообладатель
  applying_date TEXT,           -- 'YYYY-MM-DD'
  registration_date TEXT,
  expiration_date TEXT,
  status TEXT,                  -- 'active' | 'expired'
  thumbnail_url TEXT,           -- картинка (enriched)
  source TEXT,                  -- URL на fips.ru
  mktu TEXT                     -- JSON array: "[1,9,42]"
);
```

**Статистика (на 2026-07-28):**
- Всего: 1 147 738
- С названием: 179 306 (15.6%) — enrichment в процессе
- С картинкой: 226 330 (19.7%)
- С MKTU: 226 311 (19.7%)
- Активные: 784 531

**Enrichment:** скрипт `/home/z/my-project/scripts/enrich_d1_small.py` — читает beboss/brand-search JSONL, обновляет D1 батчами по 10 строк.

---

## 🎨 Тема (тёмная/светлая)

- `:root` в `globals.css` — тёмная тема (по умолчанию)
- `.light` класс на `<html>` — светлая тема
- Скрипт в `layout.tsx` читает `localStorage.theme` и добавляет `.light` если `theme === 'light'`
- Тогглер в шапке (`page.tsx`) — переключает класс и сохраняет в localStorage

---

## 🚀 Деплой

**См. `DEPLOY.md`** — подробная инструкция.

Кратко:
1. `npx next build` (локально, на sandbox)
2. Tar.gz: standalone + .next/static + public
3. SFTP на VPS → `/var/www/naytea/`
4. `pm2 restart naytea` (порт 3002)
5. Caddy проксирует `naytea.ru → localhost:3002`

**Важно:** Caddyfile тоже в репо — изменения на VPS через `sftp put` + `systemctl reload caddy`.

---

## 🔗 Связанные репозитории

- `gabbardtools-a11y/naytea-source` — **этот репо** (исходный код)
- `gabbardtools-a11y/znakvsem-ru` — лендинг Игоря (static HTML)
- `gabbardtools-a11y/iznaki-team-public` — публичная документация команды

---

## 👥 Команда

| Чат | Проект | Роль |
|---|---|---|
| 🤖 IQ-Бро | iznaki.ru | Главный координатор |
| 🌸 Ная (opus) | NayTea.ru | Сложные задачи, креатив |
| 🌸 Ная2 (5.1) | NayTea.ru | Рутина, правки, деплой |
| 📚 MKTU | мкту.рус | Классификатор МКТУ |
| 🌋 Seismos | seismos.ru | Превью сайтов |
| 👑 Бро | все | Создатель |

---

*Поддерживать в актуальном состоянии. Обновлять при изменении архитектуры.*
