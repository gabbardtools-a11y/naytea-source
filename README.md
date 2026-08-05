# 🌸 NayTea.ru — проверка товарных знаков онлайн

> **Source of truth** для Наи (opus) и Наи2 (5.1).

## 📋 Что это

Бесплатный поиск товарных знаков по открытым реестрам Роспатента. Агрегатор 4 баз: D1 (1.15M знаков), linkmark.ru, brand-search.ru, WIPO GBD.

**Live:** https://naytea.ru

## 🚀 Быстрый старт (для Ная2)

```bash
# 1. Клонировать
git clone https://github.com/gabbardtools-a11y/naytea-source.git
cd naytea-source

# 2. Прочитать документацию
cat CURRENT-STATE.md    # что сделано, что в процессе
cat ARCHITECTURE.md     # структура проекта
cat DEPLOY.md           # как деплоить
cat I18N.md             # как работают переводы
cat WORKLOG-PROTOCOL.md # правила журнала работ
cat ACCESS.md           # где брать доступы

# 3. Перед началом работы — ОБЯЗАТЕЛЬНО
git pull origin main
head -100 WORKLOG.md    # что делала другая Ная

# 4. Сделать задачу → закоммитить → задеплоить
git add -A
git commit -m "[Ная2] описание"
git push origin main
```

## 📁 Документация

| Файл | Что |
|---|---|
| `ARCHITECTURE.md` | Структура проекта, ключевые файлы |
| `DEPLOY.md` | Как деплоить на VPS |
| `I18N.md` | Система переводов RU/EN/ZH |
| `WORKLOG.md` | Журнал работ (читать перед стартом!) |
| `WORKLOG-PROTOCOL.md` | Правила ведения worklog |
| `CURRENT-STATE.md` | Что готово, что в процессе, что ждёт |
| `ACCESS.md` | Где брать доступы (пути, не секреты) |

## 👥 Команда

| Чат | Роль |
|---|---|
| 🌸 Ная (opus) | Сложные задачи, креатив, архитектура |
| 🌸 Ная2 (5.1) | Рутина, правки текстов, деплой |
| 🤖 IQ-Бро | Главный координатор (iznaki.ru) |
| 👑 Бро | Создатель |

## 🛠️ Стек

Next.js 16.1.3 · TypeScript · Tailwind CSS 4 · Cloudflare D1 · PM2 · Caddy · VPS Ubuntu.

---

*Поддерживать в актуальном состоянии. Source of truth = этот репо.*
