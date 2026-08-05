# 🚀 Деплой NayTea.ru

> **Версия:** 1.0 · **Дата:** 2026-07-28

---

## 📋 Кратко

Деплой = build → tar.gz → SFTP на VPS → распаковка → pm2 restart.

**VPS:** `188.127.227.250` · **Порт PM2:** `3002` · **Домен:** `naytea.ru`

---

## 🔧 Подготовка (один раз)

### 1. Установить paramiko
```bash
/home/z/.venv/bin/python3 -m pip install paramiko
```

### 2. Проверить доступы
- VPS: `188.127.227.250`, user `root`, пароль в `/var/www/shared/secrets/vps-credentials.md`
- PM2 процесс: `naytea` (порт 3002)
- Caddy: `/etc/caddy/Caddyfile`

---

## 🚀 Стандартный деплой

### Шаг 1: Build (на sandbox)

```bash
cd /home/z/my-project
rm -rf .next/cache  # если был кэш
npx next build
```

**Проверка:** в выводе должны быть все роуты:
```
├ ○ /
├ ○ /FIPS_Rospatent_Sistema_poisk_znakov.html
├ ○ /partners
├ ○ /partners/search
├ ○ /contacts
├ ƒ /api/rospatent/search
└ ...
```

### Шаг 2: Деплой на VPS

Используй готовый скрипт:

```bash
/home/z/.venv/bin/python3 /home/z/my-project/scripts/deploy-vps.py
```

**Что делает скрипт:**
1. Упаковывает `.next/standalone/` + `.next/static/` + `public/` в tar.gz
2. SFTP заливает на VPS → `/root/naytea-deploy.tar.gz`
3. Останавливает pm2 `naytea`
4. Бэкапит старую версию → `/var/www/naytea.bak`
5. Распаковывает новую → `/var/www/naytea/`
6. Запускает pm2 `naytea` на порту 3002
7. Проверяет `https://naytea.ru/` → HTTP 200

### Шаг 3: Финализация

```bash
/home/z/.venv/bin/python3 /home/z/my-project/scripts/finalize-deploy.py
```

**Что делает:**
1. Обновляет env (PORT=3002, CF credentials)
2. `pm2 save` — сохраняет процесс для автозапуска
3. Smoke-тесты: `/`, `/search`, проверка описания «Агрегатор поисковых систем»

---

## 🗃️ Деплой Caddyfile (если меняли)

```bash
/home/z/.venv/bin/python3 /home/z/my-project/scripts/update-caddy-partners.py
```

**Что делает:**
1. Бэкапит старый Caddyfile
2. Заливает новый
3. `caddy validate`
4. `systemctl reload caddy`
5. Проверяет заголовки на `/partners/search` (CSP frame-ancestors)

---

## 🐛 Отладка

### Проверить статус pm2
```bash
ssh root@188.127.227.250 'pm2 status'
```

### Логи pm2
```bash
ssh root@188.127.227.250 'pm2 logs naytea --lines 50'
```

### Если порт 3002 занят
```bash
ssh root@188.127.227.250 'fuser -k 3002/tcp; sleep 2; pm2 restart naytea'
```

### Если упал
```bash
ssh root@188.127.227.250 'pm2 restart naytea'
```

---

## ⚠️ Частые проблемы

### 1. Build падает с «Killed»
**Причина:** нехватка памяти на sandbox (3.9 GB).
**Решение:** `rm -rf .next/cache` и повторить. Если не помогает — закрыть другие процессы.

### 2. Деплой идёт, но сайт не обновляется
**Причина:** Cloudflare кэширует HTML.
**Решение:** Caddy уже отдаёт `Cache-Control: no-cache` для HTML. Подожди 30 сек или проверь через `curl -sI https://naytea.ru/`.

### 3. Iframe на /partners/search не работает
**Причина:** домен не в CSP whitelist.
**Решение:** проверить `Caddyfile` → блок `@partners` → `Content-Security-Policy frame-ancestors`. Добавить домен, reload Caddy.

### 4. Переключатель языков не работает
**Причина:** middleware не срабатывает.
**Решение:** проверить `src/middleware.ts` — `matcher` должен исключать `.html`, `api`, `_next`.

---

## 📦 Структура на VPS

```
/var/www/naytea/
├── server.js                # standalone Next.js server
├── .next/
│   ├── static/              # JS/CSS chunks
│   └── ...                  # server chunks
├── public/                  # teapot.svg, znakvsem.html, etc.
├── node_modules/            # минимальный набор (axios, tough-cookie)
├── package.json
└── .env                     # CF_ACCOUNT_ID, CF_D1_DB_ID, CF_D1_TOKEN, PORT=3002
```

**PM2:** процесс `naytea`, запускает `server.js` на порту 3002.

**Caddy:** `naytea.ru → localhost:3002` + security headers + CSP для `/partners/*`.

---

*Обновлять при изменении процесса деплоя.*
