# Инструкция по локальному тестированию Docker

## Предварительные требования

- Docker Desktop установлен (с включенным WSL 2 для Windows)
- docker-compose установлен
- Все контейнеры предварительно собраны

## Структура Docker Stack

Локальный Docker стек состоит из 4 сервисов:

1. **SQL Server 2022** (`sqlserver`)
   - Порт: 1433
   - SA пароль: установлен в docker-compose.yml
   - Тип сети: Внутренняя, не доступна снаружи контейнеров

2. **.NET 10 API** (`api`)
   - Порт: 5000 (внутри Docker сети)
   - Доступен извне через Nginx на http://localhost/api/
   - Автоматически подключается к SQL Server

3. **React Frontend** (`frontend`)
   - Порт: 3000 (внутри Docker сети)
   - Доступен извне через Nginx на http://localhost/
   - Автоматически работает с Vite proxy конфигурацией

4. **Nginx Reverse Proxy** (`nginx`)
   - Порт: 80 (доступен на localhost:80)
   - Распределяет трафик между frontend:3000 и api:5000
   - Проксирует маршруты: /, /api/, /avatars/, /uploads/, /gallery/

## Команды для управления Docker стеком

### Запуск всех контейнеров

```bash
# Из директории trip-planner-front
docker-compose up -d
```

Ожидаемый результат: все 4 контейнера должны запуститься
```
✔ Network trip-planner-front_trip-planner-network Created
✔ Container trip-planner-db                       Started
✔ Container trip-planner-api                      Started
✔ Container trip-planner-frontend                 Started
✔ Container trip-planner-nginx                    Started
```

### Проверка статуса контейнеров

```bash
docker-compose ps
```

Все контейнеры должны быть в статусе `Up`:
```
NAME                    SERVICE     STATUS           PORTS
trip-planner-api        api         Up 10 seconds    5000/tcp
trip-planner-db         sqlserver   Up 10 seconds    0.0.0.0:1433->1433/tcp
trip-planner-frontend   frontend    Up 10 seconds    3000/tcp
trip-planner-nginx      nginx       Up 10 seconds    0.0.0.0:80->80/tcp
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs api
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs sqlserver
```

### Остановка контейнеров

```bash
# Остановить без удаления
docker-compose stop

# Удалить контейнеры (но не образы)
docker-compose down

# Удалить контейнеры и volumes
docker-compose down -v
```

## Тестирование сервисов

### 1. Проверка Nginx

```bash
# В браузере откройте:
http://localhost
```

Должна открыться React приложение.

### 2. Проверка API

```bash
# Без авторизации (требуется JWT токен):
curl http://localhost/api/trips

# Ответ должен быть 401 Unauthorized (401 означает что API работает!)
```

### 3. Тестирование регистрации

```powershell
# PowerShell команда для регистрации
$body = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost/api/accounts/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -ErrorAction SilentlyContinue
```

### 4. Тестирование с других машин в локальной сети

```bash
# Замени 192.168.1.145 на твой локальный IP адрес
http://192.168.1.145:80

# С мобильного телефона на той же сети
# Перейди на http://<твой-ip-адрес>
```

> **Важно:** Для доступа с других машин в Docker Compose должна быть открыта сеть.

## Сетевая архитектура

```
┌─────────────────────────────────────────────┐
│         Docker Compose Network              │
│      (trip-planner-network)                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌────────┐  ┌──────────┐   │
│  │  Nginx   │→ │Frontend│ │   API    │   │
│  │  :80     │  │ :3000  │ │  :5000   │   │
│  └──────────┘  └────────┘ └──────────┘   │
│       ↓                          ↓         │
│    localhost:80              ↓ Connection │
│                           ┌──────────┐    │
│                           │SQLServer │    │
│                           │ :1433    │    │
│                           └──────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

## Проксирование маршрутов в Nginx

| Путь | Проксирует к | Назначение |
|---|---|---|
| `/` | `frontend:3000` | React приложение |
| `/api/` | `api:5000` | .NET API endpoints |
| `/avatars/` | `api:5000` | Аватары пользователей |
| `/uploads/` | `api:5000` | Загруженные файлы |
| `/gallery/` | `api:5000` | Галерея фото |

## Решение проблем

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs <имя-контейнера>

# Перестроить образ
docker-compose build --no-cache <сервис>

# Полный перезапуск
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### API возвращает 500 ошибку

```
"An exception has been raised that is likely due to a transient failure. 
Consider enabling transient error resiliency by adding 'EnableRetryOnFailure' 
to the 'UseSqlServer' call."
```

**Решение:** Это значит что API не может подключиться к БД при запуске.
- Убедись что SQL Server контейнер запущен
- Проверь логи: `docker-compose logs sqlserver`
- Дождись полной инициализации БД (может занять 30+ секунд)
- Перезапусти API: `docker-compose restart api`

### Nginx не проксирует запросы

```bash
# Проверить конфиг Nginx
docker-compose exec nginx nginx -t

# Просмотреть логи
docker-compose logs nginx
```

### Разное

- **Очистить все Docker данные**: `docker-compose down -v && docker system prune -a`
- **Пересобрать все образы**: `docker-compose build --no-cache`
- **Развернуть свежий стек**: `docker-compose up -d --force-recreate`

## Переменные окружения в Docker

Frontend контейнер использует `.env.production`:
```
VITE_API_URL=/api
```

API контейнер автоматически подключается к SQL Server через имя хоста `sqlserver` в compose network.

## Примечания

1. **Первый запуск**: SQL Server может инициализироваться 30+ секунд, API может быть недоступен в это время
2. **EnableRetryOnFailure**: Конфигурирован в DependencyInjection.cs для обработки временных сбоев подключение
3. **Портов**: Только Nginx (порт 80) и SQL Server (1учимпорт 1433) доступны снаружи, остальные только в Docker сети
4. **Вольюмы**: Данные БД хранятся в `sqlserver-data` томе Docker

## Обновление образов при изменении кода

### Если изменил Frontend (React):

```bash
docker-compose build frontend
docker-compose up -d frontend
```

### Если изменил Backend (.NET):

```bash
docker-compose build api
docker-compose up -d api
```

### Если изменил Nginx конфиг:

```bash
docker-compose build nginx
docker-compose up -d nginx
```

## Полезные команды

```bash
# Запуск контейнера в интерактивном режиме
docker-compose exec api bash

# Проверка дискового пространства образов
docker images

# Проверка всех контейнеров (включая остановленные)
docker-compose ps -a

# Просмотр истории сборки образа
docker history trip-planner-front-api

# Удаление неиспользуемых образов
docker image prune -a
```

---

**Последнее обновление**: March 21, 2026
**Статус**: ✅ Готово к локальному тестированию
