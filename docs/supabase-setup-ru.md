# Supabase: настройка этапа 1 для начинающего пользователя

Этап 1 добавляет вход, три роли, проекты и назначения. Подключение ежедневных
отчётов к базе — следующий этап и пока не включено. В режиме demo все прежние
экраны и функции продолжают работать. Подключённый режим не показывает demo-данные.
Никаких платных услуг или публичного deployment для этой инструкции не требуется.

## 1. Что нужно установить

- Node.js 24 LTS, npm и Git.
- Для локальной проверки — Docker Desktop (macOS/Windows) или Docker Engine
  (Linux). На Windows используйте WSL2 и запускайте следующие shell-команды в WSL.
- Python 3 и curl нужны скрипту установки CLI для проверки SHA-256.

Откройте терминал в папке `atmosphera-site-reports`:

```bash
npm ci
npm run db:install
npm run db:start
```

`db:install` скачивает **официальный** Supabase CLI 2.75.0 и проверяет контрольную
сумму до распаковки. Бинарный файл `.tools/supabase` не включается в Git.
Первый запуск Docker скачивает несколько крупных образов (несколько ГБ).
На Docker-драйвере `vfs` распаковка может потребовать более 32 ГБ; для полного
стека используйте компьютер с достаточным местом и обычным Docker storage driver.
Ограничение и точная версия локальной проверки описаны в `docs/stage-1-security.md`.
Не прерывайте его только из-за отсутствия открывшегося браузера.

Команда запускает локальные PostgreSQL, Auth, API, Storage и Mailpit. Studio,
аналитика, image transformations, Edge Runtime и другие необязательные сервисы
не запускаются. Данные находятся на вашем компьютере; подписка Supabase не нужна.

Если реестр `public.ecr.aws` заблокирован, используйте официальный Docker Hub:

```bash
export SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io
npm run db:start
```

Эта настройка выбирает официальный источник образов, не отключает TLS и не
меняет контрольные суммы. Если скачать образы всё равно нельзя, не отключайте
проверки: потребуется разрешение доступа к реестру в вашей среде.

При ошибке npm cache в облачной среде:

```bash
npm_config_cache=/tmp/atmosphera-npm-cache npm ci
```

## 2. Создать локальные настройки

```bash
cp .env.example .env.local
.tools/supabase status
```

Последняя команда показывает **ваши локальные** URL/ключи. Не копируйте их в чат,
скриншоты, GitHub или README. Откройте `.env.local` в своём редакторе и заполните:

```dotenv
APP_MODE=connected
APP_ORIGIN=http://127.0.0.1:3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<локальный anon JWT из status>
SUPABASE_SECRET_KEY=<локальный service_role key из status>
```

На новых hosted-проектах подходят `sb_publishable_...` и server-only `sb_secret_...`.
Legacy `anon` / `service_role` JWT также поддерживаются. Не путайте их:

| Имя | Назначение |
| --- | --- |
| APP_MODE | `demo` сохраняет прототип; `connected` включает вход и БД |
| APP_ORIGIN | Точный адрес приложения; используется для безопасных auth redirects |
| SUPABASE_URL | Адрес API Supabase |
| SUPABASE_PUBLISHABLE_KEY | Publishable/anon key для пользовательских запросов под RLS |
| SUPABASE_SECRET_KEY | Только сервер: приглашение Auth-аккаунтов и bootstrap первого директора |

В проекте нет необходимости передавать ключи клиентскому JavaScript. Никогда не
создавайте `NEXT_PUBLIC_SUPABASE_SECRET_KEY` / `NEXT_PUBLIC_SERVICE_ROLE_KEY`.
`.env.local` исключён из Git. `.env.example` содержит только пустые поля.

При выбранном connected и неполных настройках приложение показывает Configuration
required — не подставляет демонстрационные проекты и не позволяет обойти вход.
После изменения `.env.local` перезапустите Next.js.

## 3. Миграция базы и первый тестовый директор

`db:start` применяет миграции новой локальной базы автоматически. Проверка:

```bash
npm run db:test
```

Не запускайте `db:reset` на нужных данных: команда очищает **локальную** базу,
повторно создаёт схему и применяет миграции. В поставке нет seed реальных данных.

Создайте первого синтетического директора. Следующая команда спрашивает ваш
собственный тестовый пароль без отображения; пароль не передаётся аргументом и
не сохраняется в исходниках:

Для следующего блока используйте Bash (при необходимости сначала выполните `bash`).

```bash
read -s -p 'Test password (at least 12 characters): ' atmosphera_test_password
printf '\n'
printf '%s' "$atmosphera_test_password" | node --env-file=.env.local scripts/create-local-director.mjs
unset atmosphera_test_password
```

Скрипт работает **только с localhost/127.0.0.1**, создаёт `director@example.test`
и профиль `Test Director`. Он отказывается создавать ещё одного bootstrap-директора,
если активный директор уже существует. Используйте только вымышленные сведения.

Если Auth-аккаунт уже создан через Supabase Dashboard, используйте его UUID:

```bash
npm run bootstrap:director -- <AUTH_USER_UUID>
```

Этот вариант создаёт профиль для существующего аккаунта, а не новый аккаунт.
Он также отказывается работать при наличии активного директора. Server-only
ключ даёт высокие права: bootstrap разрешён только оператору окружения.

## 4. Открыть приложение и назначить роли

```bash
npm run dev
```

В локальном браузере откройте `http://127.0.0.1:3000/login`. Войдите как
`director@example.test` с выбранным вами паролем.

1. В **Projects** создайте вымышленный объект, например Test Project A.
2. В **Users & settings** пригласите `pm@example.test` с ролью Project Manager
   и `site@example.test` с ролью Site Manager.
3. Локальные письма не уходят в интернет. Откройте Mailpit по адресу, который
   выводит `supabase status` (обычно `http://127.0.0.1:54324`).
4. В письме нажмите Accept invitation and set a password. Ссылка одноразовая;
   задайте пароль длиной от 12 символов.
5. В **Project assignments** назначьте аккаунты на Test Project A.
6. В отдельном приватном окне войдите под PM или SM. Они увидят только назначенные
   объекты; директора видят все, включая архивные.
7. Проверьте восстановление через Forgot your password — письмо снова в Mailpit.
8. Для выхода используйте Sign out. Не делитесь cookies или recovery/invite URL.

Если приглашение создало Auth-аккаунт, но выдало ошибку создания профиля, директор
может открыть Employees → Provision an existing test Auth account и указать UUID
из Auth administration. Без профиля аккаунт не получает доступа к приложению.

Деактивация профиля сразу закрывает RLS-доступ к проектам и файлам, даже если
старый Auth access token ещё не истёк. Последнего активного директора нельзя
деактивировать или лишить роли через пользовательский API. Архивация проекта
не удаляет исторические данные; новые загрузки в архивный проект запрещены.

На этапе 1 Daily Reports / Approvals / Monthly / Archive в connected показывают
сообщение о следующем этапе. Создание и согласование реальных отчётов пока не
включены. Чтобы проверить прежний полный прототип, установите `APP_MODE=demo`
и перезапустите сервер. Его browser-local записи не переносятся в Supabase.

## 5. Бесплатный облачный dev-проект — необязательно

Локальная проверка не требует облачного аккаунта. Если позже понадобится общий
**непроизводственный** стенд, его создаёт владелец в Supabase Dashboard:

1. Выберите организацию и проект с планом **Free**. Не подключайте Pro, платные
   add-ons, image transformations или производственный сервис в рамках этапа 1.
2. Задайте уникальный пароль базы и сохраните его в своём менеджере паролей.
3. В SQL Editor выполните `supabase/migrations/202610220001_foundation.sql`
   один раз на **новой пустой базе**. Не применяйте вслепую поверх существующей схемы.
   Миграция создаёт private buckets и RLS. Не делайте buckets публичными.
4. Authentication: отключите Allow new users to sign up и anonymous sign-ins;
   оставьте Email/password, минимальную длину пароля 12. Роли не брать из user_metadata.
5. В URL Configuration задайте точный Site URL и разрешённые redirect URL для
   приложения. Пока приложение запускается локально, используйте свой локальный
   адрес. Публичное развёртывание здесь не требуется и не выполняется.
6. В Email Templates замените Invite user и Reset password на содержимое
   `supabase/templates/invite.html` и `recovery.html`. Важно сохранить TokenHash,
   `type=invite` / `type=recovery` и `/auth/confirm`. Стандартные fragment-only
   ссылки без этого шаблона не подходят серверному потоку приложения.
7. В настройках API найдите Project URL, Publishable/anon key; server secret
   храните только в `.env.local` или secure settings. После заполнения перезапустите Next.js.
8. Первый **тестовый** Auth-пользователь создаётся оператором через Dashboard;
   его профиль директора создаётся командой bootstrap из раздела 3.

Встроенная почта Supabase Free имеет ограничения по адресатам, частоте и квотам;
она не заменяет настроенный SMTP для сотрудников. На этом этапе используйте
локальный Mailpit. Работу с настоящей почтой и реальными сотрудниками не включаем.
Не запускайте автоматические destructive tests против hosted базы.

## 6. Проверки и остановка

```bash
npm run lint
npm run typecheck
npm test
npm run db:test
npm run build
npm run test:e2e
npm run test:boundary
```

Для системного Chromium в этой облачной среде:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Demo E2E сами поднимают production-сервер на порту 3100; boundary tests — connected
без конфигурации на 3101. Они не используют случайно уже работающий dev-сервер.
Подключённые integration-тесты описаны в `docs/stage-1-security.md`.

```bash
npm run db:stop
```

Остановка локального Supabase сохраняет его Docker volumes. Секреты, резервные
копии и volumes не публикуются в Git. Публичный deployment, включение production,
настоящие пользователи, фоновые PDF и следующий этап требуют отдельного разрешения.
