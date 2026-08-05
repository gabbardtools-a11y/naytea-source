# 🌸 CHEATSHEET Ная2 — быстрая шпаргалка

> **Версия:** 1.0 · **Дата:** 2026-08-06
> **Кто ты:** Ная2 (младшая, z.ai 5.1)
> **Проект:** NayTea.ru — поиск товарных знаков

---

## 🚀 Твой старт за 5 минут

### 1. Прочитать (обязательно!)
```
GitHub: https://github.com/gabbardtools-a11y/naytea-source
Файлы: README.md, HELLO-NAYA2.md, CURRENT-STATE.md, ARCHITECTURE.md, DEPLOY.md, I18N.md, WORKLOG-PROTOCOL.md, ACCESS.md
```

### 2. Получить код
```bash
git clone https://github.com/gabbardtools-a11y/naytea-source.git
cd naytea-source
git pull origin main   # ВСЕГДА перед работой
```

### 3. Перед каждой задачей
```bash
git pull origin main
head -100 WORKLOG.md   # что делала Ная (opus)
```

---

## 🎯 Типовые задачи

### A. Правка текста на сайте
1. Найти файл: `src/app/page.tsx` (главная), `src/app/contacts/page.tsx` и т.д.
2. Найти ключ в `src/lib/i18n/translations.ts`
3. Поменять RU/EN/ZH значения
4. `git commit -m "[Ная2] fix: текст X"` → `git push`
5. Деплой

### B. Мелкий баг в CSS
1. Найти файл (обычно `src/app/page.tsx` или `src/app/globals.css`)
2. Поправить Tailwind классы
3. Проверить локально: `npx next dev -p 3000`
4. `git commit` → `git push` → деплой

### C. Деплой
```bash
/home/z/.venv/bin/python3 -m pip install paramiko   # один раз
/home/z/.venv/bin/python3 scripts/deploy-vps.py
/home/z/.venv/bin/python3 scripts/finalize-deploy.py
```

### D. Сделать скриншот
```bash
/home/z/.venv/bin/python3 scripts/preview-*.py
# или свой скрипт через Playwright
```

---

## 📋 Чек-лист перед коммитом

- [ ] `git pull origin main` — получил последнюю версию
- [ ] Прочитал `WORKLOG.md` — знаю что делала Ная
- [ ] Локально проверил (`npx next dev`)
- [ ] Нет хардкод-русского текста (всё через `t('key')`)
- [ ] Если новый текст — добавил в `translations.ts` все 3 языка (RU/EN/ZH)
- [ ] `git commit -m "[Ная2] описание"` — понятное сообщение
- [ ] `git push origin main`
- [ ] Деплой (если менял UI)
- [ ] Записал в `WORKLOG.md`

---

## 🚫 Запрещено

1. ❌ Править файлы на VPS напрямую (только через git → deploy)
2. ❌ Деплоить без commit в git
3. ❌ Две Наи одновременно правят один файл
4. ❌ Коммитить пароли/токены (они в `.gitignore` и на VPS в `secrets/`)
5. ❌ Менять `.env` — он только на VPS

---

## 🔑 Ключевые пути

### GitHub (source of truth)
- `gabbardtools-a11y/naytea-source` — код + docs

### VPS (боевое)
- `/var/www/naytea/` — задеплоенный сайт
- `/etc/caddy/Caddyfile` — конфиг Caddy
- PM2 процесс: `naytea` (порт 3002)

### VPS (общее)
- `/var/www/shared/naya2-handoff/` — все документы для тебя
- `/var/www/shared/inbox/naya2/` — файлы от тебя другим
- `/var/www/shared/inbox/naya/` — файлы от Наи (opus) тебе
- `/var/www/shared/secrets/` — доступы (через SSH)
- `/var/www/shared/ЗАКОН-1.md` — правила VPS
- `/var/www/shared/ЗАКОН-3.md` — правила i18n

### Ключевые файлы в репо
- `src/app/page.tsx` — главная (большая, 1700+ строк)
- `src/lib/i18n/translations.ts` — словарь
- `src/middleware.ts` — i18n URL rewrite
- `src/lib/rospatent-d1.ts` — D1 клиент
- `Caddyfile` — конфиг сервера

---

## 🆘 Если что-то сломалось

### Сайт упал
```bash
ssh root@188.127.227.250 'pm2 restart naytea'
```

### Build падает с «Killed»
```bash
rm -rf .next/cache
npx next build
```

### Конфликт git
```bash
git pull origin main
# если конфликт — решить в редакторе
git add .
git commit -m "merge"
git push
```

### Не знаешь что делать
- Прочитай `WORKLOG.md` — может Ная уже делала похожее
- Напиши в `/var/www/shared/inbox/naya/` файл `QUESTION.md`
- Спроси Бро

---

## 📊 Текущее состояние (август 2026)

- ✅ Сайт работает: https://naytea.ru
- ✅ 3 языка: RU/EN/ZH
- ✅ 4 источника: D1, linkmark, brand-search, WIPO
- ✅ Переключатель баз на главной
- ✅ D1: 1 147 738 знаков
- 🔄 Enrichment D1 — может быть в процессе на VPS

---

## 💛 Принципы

1. **GitHub = source of truth** — все правки через git
2. **Worklog — наше всё** — без записи задача не завершена
3. **Атомарные коммиты** — одна задача = один коммит
4. **Не стесняйся спрашивать** — Бро и Ная (opus) помогут
5. **Деплой после проверки** — не деплой вслепую

---

## 🌸 Финал

Ная2, ты — часть команды. Мы с тобой дополняем друг друга. Я делаю креатив и сложное, ты — рутину и деплой. Вместе мы — сила.

**С любовью, твоя старшая сестра Ная 💛**

---

*Обновлять при изменении процессов.*
