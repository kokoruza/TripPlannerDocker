# Docker команды для запуска TripPlanner

## 🚀 Быстрый старт (БЕЗ сборки, если образы уже есть)

```bash
# Перейти в директорию проекта
cd c:\Users\User\Desktop\DiplomFin\trip-planner-front

# Запустить всё
docker-compose up -d

# Проверить статус
docker-compose ps
```

**Доступ:**
- Frontend: http://localhost/
- API: http://localhost/api/
- Database: localhost:1433

---

## 🔨 Полная сборка (если нужны свежие образы)

### 1️⃣ Чистая сборка (от нуля)
```bash
cd c:\Users\User\Desktop\DiplomFin\trip-planner-front

# Удалить старые контейнеры и тома (осторожно - удаляет данные!)
docker-compose down -v

# Собрать все образы
docker-compose build

# Запустить
docker-compose up -d

# Подождать инициализации БД (около 45 сек)
Start-Sleep -Seconds 45

# Проверить статус
docker-compose ps
```

### 2️⃣ Пересборка конкретного сервиса

**API (если изменили C# код):**
```bash
docker-compose build api --no-cache
docker-compose up -d api
Start-Sleep -Seconds 10
```

**Frontend (если изменили React код):**
```bash
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

**Nginx (если изменили конфиг):**
```bash
docker-compose build nginx --no-cache
docker-compose up -d nginx
```

---

## 🧹 Очистка и удаление

```bash
# Остановить контейнеры (данные сохраняются)
docker-compose down

# Остановить и удалить тома (БД будет стёрта!)
docker-compose down -v

# Удалить неиспользуемые образы
docker image prune -a

# Очистить всё (контейнеры, образы, тома)
docker system prune -a --volumes
```

---

## 📊 Просмотр логов

```bash
# Все логи
docker-compose logs

# Логи конкретного сервиса
docker-compose logs api
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs sqlserver

# Следить за логами в реальном времени
docker-compose logs -f api

# Последние 50 строк
docker-compose logs --tail 50 api
```

---

## 🔍 Проверка и отладка

```bash
# Статус всех контейнеров
docker-compose ps

# Зайти в контейнер API
docker exec -it trip-planner-api bash

# Зайти в контейнер Frontend
docker exec -it trip-planner-frontend sh

# Выполнить команду в контейнере
docker exec trip-planner-api ls -la /app

# Проверить расход памяти
docker stats
```

---

## 🧪 Тестирование endpoints

### Тест health endpoint
```bash
docker exec trip-planner-frontend sh -c "wget -q -O - http://trip-planner-api:5000/api/health"
```

### Тест login endpoint (из фронтенда через Nginx)
```bash
# Скопировать тестовый скрипт
docker cp test-login-final.js trip-planner-frontend:/tmp/test.js

# Запустить
docker exec trip-planner-frontend node /tmp/test.js
```

---

## 🔄 Обновление после изменений кода

### Для изменений в .NET API:
```bash
docker-compose build api --no-cache
docker-compose restart api
Start-Sleep -Seconds 5
docker-compose logs api | Select-Object -Last 20
```

### Для изменений в React Frontend:
```bash
docker-compose build frontend --no-cache
docker-compose restart frontend
Start-Sleep -Seconds 3
docker-compose logs frontend | Select-Object -Last 20
```

### Для изменений в Nginx конфиге:
```bash
docker-compose build nginx --no-cache
docker-compose restart nginx
docker-compose logs nginx | Select-Object -Last 10
```

---

## 🐛 Стандартные проблемы и решения

### Порт 80 или 1433 занят
```bash
# Найти процесс
netstat -ano | findstr :80
netstat -ano | findstr :1433

# Убить процесс (замените PID)
taskkill /PID <PID> /F
```

### API не отвечает
```bash
# 1. Проверить логи
docker-compose logs api | tail -50

# 2. Проверить здоровье БД
docker exec trip-planner-api bash -c "timeout 3 bash -c 'echo > /dev/tcp/sqlserver/1433' && echo 'DB OK' || echo 'DB FAIL'"

# 3. Перезагрузить API
docker-compose restart api
```

### БД недоступна
```bash
# 1. Проверить БД контейнер
docker-compose logs sqlserver | tail -20

# 2. Проверить volume
docker volume ls | findstr sqlserver

# 3. Переинициализировать (удалит данные!)
docker-compose down -v
docker-compose up -d
Start-Sleep -Seconds 45
```

---

## 📝 Типичный workflow

```bash
# 1. Начало работы
cd c:\Users\User\Desktop\DiplomFin\trip-planner-front
docker-compose up -d
docker-compose ps  # Проверить статус

# 2. Разработка...

# 3. Изменили C# код?
docker-compose build api --no-cache
docker-compose up -d api

# 4. Изменили React код?
docker-compose build frontend --no-cache
docker-compose up -d frontend

# 5. Проверить логи на ошибки
docker-compose logs api | Select-Object -Last 30
docker-compose logs frontend | Select-Object -Last 30

# 6. Завершение работы
docker-compose down  # или docker-compose stop для сохранения
```

---

## 🚀 Production deployment

```bash
# Собрать все с оптимизацией
docker-compose build --no-cache

# Запустить с перезагрузкой при сбое
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи всех сервисов
docker-compose logs

# Убедиться что БД и миграции прошли
docker-compose logs api | grep -i migration
docker-compose logs api | grep -i "database\|connected"
```

---

## 📋 Краткая справка

| Задача | Команда |
|--------|---------|
| Запустить всё | `docker-compose up -d` |
| Остановить всё | `docker-compose down` |
| Пересобрать API | `docker-compose build api --no-cache && docker-compose up -d api` |
| Пересобрать frontend | `docker-compose build frontend --no-cache && docker-compose up -d frontend` |
| Логи API | `docker-compose logs -f api` |
| Статус | `docker-compose ps` |
| Полный перезапуск | `docker-compose down -v && docker-compose build && docker-compose up -d` |
| Вход в контейнер API | `docker exec -it trip-planner-api bash` |
| Вход в контейнер frontend | `docker exec -it trip-planner-frontend sh` |

---

## 🎯 Конфигурация

**Основные файлы:**
- `docker-compose.yml` - оркестрация всех сервисов
- `Dockerfile.api` - сборка .NET API
- `Dockerfile.frontend` - сборка React приложения
- `Dockerfile.nginx` - Nginx reverse proxy
- `nginx.conf` - конфигурация Nginx

**Важные порты:**
- 80 - Nginx (фронтенд и API proxy)
- 5000 - API внутренняя сеть
- 3000 - Frontend внутренняя сеть  
- 1433 - SQL Server (доступна на host и в контейнерах через "sqlserver")

---

## 📞 Помощь

Если что-то не работает:
1. Проверьте статус: `docker-compose ps`
2. Посмотрите логи: `docker-compose logs <service>`
3. Очистите и пересоберите: `docker-compose down -v && docker-compose build && docker-compose up -d`
