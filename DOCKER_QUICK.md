# ⚡ Быстрый старт Docker

## Локально (Windows PowerShell)

```powershell
# В папке c:\Users\User\Desktop\DiplomFin\trip-planner-front

# Сборка (один раз, долго ~5-10 минут)
docker-compose build

# Запуск
docker-compose up -d

# Открой: http://localhost
```

## Проверка

```powershell
# Статус контейнеров
docker-compose ps

# Логи
docker-compose logs -f
```

## Остановка

```powershell
docker-compose down
```

---

## ⚙️ Если не работает API

```powershell
# Посмотри IP компьютера
ipconfig

# Обнови appsettings.Production.json - добавь IP в CorsOrigins
```

---

## 🔄 Если что-то сломалось

```powershell
# Полная переборка
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d
```

Готово! 🚀
