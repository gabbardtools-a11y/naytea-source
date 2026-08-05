# 🔑 ACCESS — Где брать доступы

> **Версия:** 1.0 · **Дата:** 2026-07-28

---

## ⚠️ Важно

**Секреты НЕ хранятся в этом файле и НЕ в git.** Они на VPS в `/var/www/shared/secrets/`.

Этот файл — только **пути и инструкции** как их получить.

---

## 📂 VPS доступы

**Хост:** `188.127.227.250`
**Логин:** `root`
**Пароль:** `/var/www/shared/secrets/vps-credentials.md` на VPS

**Как получить (через paramiko):**
```python
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("188.127.227.250", port=22, username="root", password="BRO_PROVIDES_OR_CHECK_SECRETS")
```

---

## ☁️ Cloudflare D1

**Account ID:** `3831989c82841862df148347d2fbf198`
**D1 DB ID:** `323853d9-3256-40c9-924b-6fdddbc67bb8`
**D1 Token:** `/var/www/shared/secrets/api-keys.md` на VPS (или спросить Бро)

**В .env на VPS:**
```
CF_ACCOUNT_ID=3831989c82841862df148347d2fbf198
CF_D1_DB_ID=323853d9-3256-40c9-924b-6fdddbc67bb8
CF_D1_TOKEN=cfut_...  # из secrets
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

---

## 🐙 GitHub

**Организация:** `gabbardtools-a11y`
**Репо исходников:** `naytea-source`
**Токен:** спросить Бро (или использовать `/var/www/shared/secrets/api-keys.md`)

**Репозитории:**
- `gabbardtools-a11y/naytea-source` — исходный код NayTea
- `gabbardtools-a11y/znakvsem-ru` — лендинг Игоря
- `gabbardtools-a11y/iznaki-team-public` — публичная документация команды

---

## 📡 VPS сервисы

| Сервис | Порт | PM2 процесс |
|---|---|---|
| NayTea | 3002 | `naytea` |
| iznaki.ru | 3001 | `iznaki` |
| мкту.рус | 3000 | `mktu` |
| seismos.ru | 3004 | `seismos` |

**Caddy:** `/etc/caddy/Caddyfile` (проксирует домены → localhost:порты)

**PM2 команды:**
```bash
pm2 status              # статус всех процессов
pm2 logs naytea --lines 50  # логи NayTea
pm2 restart naytea      # перезапуск
pm2 save                # сохранить для автозапуска
```

---

## 📁 Ключевые пути на VPS

```
/var/www/naytea/                    # боевая директория NayTea
/var/www/naytea/.env                # окружение (CF_*, PORT=3002)
/var/www/naytea.bak/                # бэкап прошлой версии (после деплоя)

/etc/caddy/Caddyfile                # конфиг Caddy
/etc/caddy/Caddyfile.bak.*          # бэкапы Caddyfile

/root/beboss-scan/results.jsonl     # данные beboss-скана (735k знаков)
/root/brandsearch-scan/results.jsonl # данные brand-search (149k знаков)
/root/enrich_d1_small.py            # скрипт enrichment
/root/enrich_vps.py                 # альтернативный скрипт enrichment

/var/www/shared/                    # общая папка команды
├── inbox/                          # обмен сообщениями между чатами
│   ├── naya/                       # файлы ОТ Наи
│   ├── naya2/                      # файлы ОТ Наи2
│   ├── iznaki/                     # файлы ОТ IQ-бро
│   ├── mktu/
│   └── seismos/
├── secrets/                        # 🔒 все секреты (только через SSH)
│   ├── vps-credentials.md
│   ├── api-keys.md
│   ├── database.md
│   └── ...
├── ЗАКОН-1.md                      # Управление VPS
├── ЗАКОН-2.md                      # Добавление знаков
├── ЗАКОН-3.md                      # Трёхъязычие
├── ГАЙД-ДЛЯ-НАИ.md                 # Гайд от IQ-бро
├── FINAL_VPS_GUIDE.md
└── BACKUP-GUIDE-NAYTEA-SEISMOS.md
```

---

## 🔒 Правила безопасности

1. **Никогда не коммить секреты в git** (`.env`, токены, пароли)
2. **Никогда не логировать секреты** в console.log или print
3. **Никогда не отправлять секреты в чат** — только пути к файлам
4. **Если утечка** — немедленно сменить пароль/токен, сообщить Бро
5. **`.gitignore` уже исключает** `.env`, `node_modules`, `.next/`

---

## 📞 Контакты команды

| Чат | Проект | Связь |
|---|---|---|
| 🤖 IQ-Бро | iznaki.ru | Через Бро или `/var/www/shared/inbox/iznaki/` |
| 🌸 Ная (opus) | NayTea.ru | Через Бро или `/var/www/shared/inbox/naya/` |
| 🌸 Ная2 (5.1) | NayTea.ru | Через Бро или `/var/www/shared/inbox/naya2/` |
| 📚 MKTU | мкту.рус | Через Бро |
| 🌋 Seismos | seismos.ru | Через Бро |
| 👑 Бро | все | Создатель, финальные решения |

---

*Обновлять при изменении доступов.*
