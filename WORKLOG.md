# 📝 WORKLOG — Журнал работ NayTea.ru

> **Правила:** см. `WORKLOG-PROTOCOL.md`
> **Частота:** каждая задача = минимум 2 записи (START + DONE)

---

## 2026-08-06

---

### [2026-08-06 06:30] Ная2 — DONE: Рерайт aimktu.ru + страница /mktu

**Задача:** Скопировать сайт-конкурент aimktu.ru, сделать рерайт простым человеческим языком, прикрутить ссылку на копию куда-нибудь (НЕ трогая главную).

**Что сделано:**
- `git pull` — синхронизировалась с origin/main (Already up to date)
- Через `z-ai page_reader` зафетчила 4 страницы aimktu.ru: home, /fees, /faq, /pricing
- Изучила структуру конкурента: Next.js, MKTU-сервис (ИИ-подбор классов, проверка однородности, подбор по URL/ИНН, готовые перечни, калькулятор пошлин)
- Изучила структуру NayTea: routes = /, /check, /search, /rospatent, /partners, /contacts, /tmview
- Создала новый маршрут `/mktu` (`src/app/mktu/page.tsx`, server component) — большой рерайт-справочник простым языком (~5000 слов)
- Структура `/mktu`: hero + attribution + TOC + 8 секций (что такое МКТУ, зачем подбирать, инструменты, пошлины, тарифы, для кого, FAQ, главное правило) + CTA + footer
- На странице явная атрибуция: «пересказ материала сервиса aimktu.ru простыми словами»
- На странице `/contacts` добавила: новую секцию «Смотрите также» с карточкой-ссылкой на /mktu + ссылку в footer для всех 3 языков (RU/EN/ZH)
- TypeScript: в моих файлах ошибок нет (существующие ошибки в unrelated файлах — partners/search, examples, skills — не трогала)
- Dev server проверен:
  - `/mktu` → HTTP 200, 244 КБ, ключевые фразы на месте (45 классов, 13-я редакция, проверка однородности, aimktu.ru)
  - `/contacts` → HTTP 200, 40 КБ, две ссылки на /mktu (карточка + футер)
  - `/` (главная) → HTTP 200, 51 КБ, 0 упоминаний /mktu (не тронута, как просил Бро)

**Файлы:**
- `src/app/mktu/page.tsx` (новый, ~540 строк)
- `src/app/contacts/page.tsx` (модифицирован: +45 строк, импорты + новая секция + footer link + i18n строки для RU/EN/ZH)

**Коммит:** см. git log
**Деплой:** не деплоила (Бро не просил)

**Статус:** ✅ Завершено

---

### [2026-08-06 06:20] Ная2 — START: Рерайт aimktu.ru + страница /mktu

**Задача:** Бро попросил скопировать сайт-конкурент aimktu.ru, сделать рерайт простым человеческим языком, главную не трогать, ссылку на копию прикрутить куда-нибудь.

**Файлы (планирую):**
- `src/app/mktu/page.tsx` (новый — рерайт-справочник)
- `src/app/contacts/page.tsx` (модификация — ссылка на /mktu)

**Статус:** В работе

---

### [2026-08-06 05:30] Ная2 — START: Инициализация окружения и доступов

**Задача:** Получить от Бро доступы (GitHub токен, VPS), подключиться к VPS, забрать handoff-пакет, активировать CF_D1_TOKEN локально.

**Что сделано:**
- Сохранён GitHub токен в `~/.git-credentials` (chmod 600, не в git)
- Сохранён VPS пароль в `~/.vps-password` (chmod 600, не в git)
- Подключилась к VPS 188.127.227.250 через paramiko
- Скачала handoff-пакет `/var/www/shared/naya2-handoff/` → `/home/z/my-project/handoff-naya2/` (10 файлов, включая `HELLO-NAYA2.md`)
- Прочитала `HELLO-NAYA2.md` — приветствие от Наи (opus)
- Проверила `/var/www/shared/secrets/api-keys.md` — там нет CF_D1_TOKEN (только RouterAI, ZAI, Yandex)
- Нашла `CF_D1_TOKEN` в `/var/www/naytea/.env` на VPS
- Добавила токен в локальный `.env` (он в `.gitignore`, в git не попадёт)
- Перезапустила dev server — D1 API теперь работает

**Проверка D1 (локально):**
- `GET /api/rospatent/stats` → 200, total: 1 147 581 знаков
- `POST /api/rospatent/search` (поиск «Apple») → 200, найдено 59 результатов
- `POST /api/rospatent/by-number` (номер 100000) → 200, найден знак «Меридиан»
- Все 4 источника теперь активны: D1, linkmark.ru, brand-search.ru, WIPO

**Состояние VPS (на 2026-08-06):**
- ✅ Все 6 PM2 процессов online: naytea, iznaki, mktu, seismos, aipat, strunino
- ⚠️ Диск 72% (5.4 GB свободно из 20 GB) — не критично, но следить
- ❌ Enrichment-скрипт НЕ запущен (нет процесса `enrich_vps.py`), прогресс-файлы `/tmp/enrich-prog-*` есть — возможно завершился или упал
- 📨 В `inbox/naytea/` 2 старых сообщения от Наи (от 2026-07-18)

**Доступы подтверждены:**
- ✅ GitHub: 11 репо организации `gabbardtools-a11y` (через token)
- ✅ VPS: SSH через paramiko работает
- ✅ D1: CF_D1_TOKEN активен локально
- ✅ Git: `git fetch` / `git pull` работают

**Файлы:**
- `scripts/vps-connect.py` — базовое подключение к VPS
- `scripts/vps-fetch-handoff.py` — скачивание handoff-пакета
- `scripts/vps-explore.py` — проверка состояния VPS
- `handoff-naya2/HELLO-NAYA2.md` — приветствие от Наи (локальная копия)

**Статус:** ✅ Готова к работе. Жду первую задачу от Бро или сообщение от Наи (opus) через `inbox/naya2/`.

---

### [2026-08-06 00:00] Ная — DONE: Подготовка передачи Ная2

**Задача:** Подготовить GitHub-репо + документацию + handoff-пакет для Ная2 (младшая модель 5.1).

**Что сделано:**
- Создан GitHub-репо `gabbardtools-a11y/naytea-source` (173 файла)
- Загружен весь исходный код: Next.js + TypeScript + Tailwind + i18n + D1
- Создана документация (10 файлов):
  - `README.md` — обзор
  - `HELLO-NAYA2.md` — приветствие
  - `ARCHITECTURE.md` — структура проекта
  - `DEPLOY.md` — деплой
  - `I18N.md` — переводы
  - `WORKLOG-PROTOCOL.md` — правила worklog
  - `CURRENT-STATE.md` — текущее состояние
  - `ACCESS.md` — доступы (пути, не секреты)
  - `WORKLOG.md` — журнал
  - `CHEATSHEET.md` — быстрая шпаргалка
- Handoff-пакет загружен на VPS: `/var/www/shared/naya2-handoff/`
- Создана папка `inbox/naya2/` для сообщений Ная2
- Настроен `.gitignore` (исключает node_modules, .next, .env, scripts, download, secrets)

**Структура синхронизации:**
- GitHub = source of truth
- VPS = боевая среда (deploy through git)
- Worklog = координация между Ная и Ная2
- Inbox = файлы между чатами

**Правила:**
- Перед работой: `git pull` + читать worklog
- После работы: `git push` + запись в worklog
- Деплой: через `scripts/deploy-vps.py`
- Запрещено: править на VPS напрямую

**Ссылки:**
- GitHub: https://github.com/gabbardtools-a11y/naytea-source
- Handoff на VPS: `/var/www/shared/naya2-handoff/`
- Inbox Ная2: `/var/www/shared/inbox/naya2/`

**Статус:** ✅ Завершено. Ная2 готова к старту.

---

## 2026-07-28

---

### [2026-07-28 17:00] Ная — DONE: Переключатель баз данных (Вариант A)

**Задача:** Добавить переключатель источников над вкладками поиска.

**Что сделано:**
- Добавлен state `dbSource` в `page.tsx` ('all' | 'd1' | 'linkmark' | 'brandsearch' | 'wipo')
- UI: 5 кнопок «Источник:» над вкладками «По названию/номеру/владельцу»
- Ключи в translations.ts: `db.label`, `db.all`, `db.d1`, `db.linkmark`, `db.brandsearch`, `db.wipo`, `db.d1Hint`
- D1 API обновлён: `searchTrademarks()` теперь ищет по `text` + `right_holder` + `registration_number`
- Логика: при выборе D1 → `/api/rospatent/search`; при linkmark → `/api/linkmark/search`
- `mapRow()` парсит `mktu` из JSON-строки
- 3 языка (RU/EN/ZH)

**Проверка:**
- Поиск «Apple» через D1 → 59 результатов, 50 карточек с картинками ✅
- Скриншоты: `download/preview-naya/48-55-*.png`

**Статус:** ✅ Завершено, задеплоено на https://naytea.ru/

---

### [2026-07-28 16:00] Ная — DONE: D1 enrichment запущен на VPS

**Задача:** Запустить обогащение D1 данными из beboss/brand-search.

**Что сделано:**
- Скачаны JSONL файлы с VPS: beboss (370 MB), brandsearch (79 MB)
- Скрипт `enrich_d1_small.py` — потоковая обработка, batch=10, retry=3
- Запущен на VPS через nohup (PID 358820 → позже перезапущен)
- Прогресс: line 502750, ~2750 batches, 0 errors
- ETA: ~12 часов на полную обработку

**Текущая статистика D1:**
- Всего: 1 147 738
- С названием: 179 306 (15.6%)
- С картинкой: 226 330 (19.7%)

**Статус:** 🔄 В процессе (работает в фоне на VPS)

---

### [2026-07-28 14:00] Ная — DONE: Страница /contacts

**Задача:** Создать страницу контактов как на iznaki.ru/contacts.

**Что сделано:**
- Создана `src/app/contacts/page.tsx`
- Контакты ООО «Патентные Технологии»:
  - Телефон: +7 (995) 789-09-00
  - Email: info@ptn.su
  - Адрес: Москва, Анадырский проезд, 31/1, оф. 31
  - Директор: Беркутова Наталья Николаевна
  - Патентный поверенный №957
- Реквизиты: ОГРН, ИНН, КПП, ОКПО, дата регистрации, ОКВЭД, налоговый орган
- Ссылки: Tochka.com, РБК Компании
- CTA: 4 кнопки (Позвонить, Telegram, WhatsApp, Email)
- 3 языка (RU/EN/ZH)
- Кнопка «Контакты» в шапке → `/contacts` (раньше было mailto:)

**Статус:** ✅ Завершено, задеплоено

---

### [2026-07-28 12:00] Ная — DONE: Страница /partners (SEO)

**Задача:** Создать креативную SEO-страницу для партнёров.

**Что сделано:**
- Создана `src/app/partners/page.tsx` (9 секций)
- Отдельный словарь `partners-content.ts` (80+ ключей × 3 языка)
- Секции: Hero, Why us (6 карточек), Numbers (6 цифр), How to install (4 шага), Use cases (6), Features (8), Comparison table, FAQ (6), Open program, Final CTA, Contact
- Кнопка «Партнёрам» в шапке
- Живой iframe с формой поиска в Hero
- 3 языка

**Статус:** ✅ Завершено, задеплоено

---

### [2026-07-28 10:00] Ная — DONE: i18n система (RU/EN/ZH)

**Задача:** Добавить 3 языка на NayTea по образцу iznaki.ru.

**Что сделано:**
- Создана `src/lib/i18n/translations.ts` (80+ ключей)
- Создана `src/lib/i18n/useLanguage.ts` (client hook)
- Создана `src/lib/i18n/server.ts` (server-side getLang)
- Создана `src/middleware.ts` (URL rewrite + cookie)
- Обновлена `src/app/layout.tsx` (html lang + alternates)
- Рефакторинг `page.tsx`: все хардкод-строки → `t('key')`
- Переключатель [RU][EN][中] в шапке
- 3 языка: RU (по умолчанию), EN (/en/), ZH (/zh/)
- hreflang-теги в metadata

**Статус:** ✅ Завершено, задеплоено

---

### [2026-07-28 09:00] Ная — DONE: Лендинг Игоря + Tilda-код

**Задача:** Создать лендинг для Игоря (znakvsem.ru) с встроенной формой поиска.

**Что сделано:**
- HTML-лендинг `znakvsem.html` (один файл, всё inline)
- Iframe с `https://naytea.ru/partners/search`
- Контакты ООО «Патентные Технологии»
- Залито на GitHub: `gabbardtools-a11y/znakvsem-ru`
- GitHub Pages: https://gabbardtools-a11y.github.io/znakvsem-ru/
- Tilda-код: `tilda-embed-code.txt` (3 варианта: полный, компактный, минимальный)
- Whitelist доменов в Caddyfile: znakvsem.ru, patentvsem.ru, iqin.ru, ptn.su, мкту.рус

**Статус:** ✅ Завершено

---

## 📊 Сводка

**Всего задач завершено:** 6
**В процессе:** 1 (D1 enrichment)
**Ждёт:** ответ от IQ-бро по 8 дополнениям

---

*Последнее обновление: 2026-07-28 17:00*
