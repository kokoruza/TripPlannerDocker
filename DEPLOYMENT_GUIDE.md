# Deploy TripPlanner на Production хост

## 📋 Предусловия на хосте

### 1️⃣ Установить необходимое ПО

```bash
# На Linux (Ubuntu/Debian):
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER  # Добавить пользователя в группу docker
newgrp docker  # Применить изменение

# Проверить установку:
docker --version
docker-compose --version
```

### 2️⃣ Настроить файрвол (если Linux)

```bash
# Открыть порты для Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1433/tcp  # Если прямой доступ к БД нужен (не рекомендуется!)

# Проверить
sudo ufw status
```

---

## 📦 Копирование проекта на хост

### Вариант 1: SCP (если есть SSH доступ)

```powershell
# На локальной машине (Windows):
# Скопировать папку проекта на сервер
scp -r "c:\Users\User\Desktop\DiplomFin\trip-planner-front" user@your-host:/home/user/

# Или только нужные файлы:
scp docker-compose.yml user@your-host:/home/user/trip-planner-front/
scp Dockerfile.* user@your-host:/home/user/trip-planner-front/
scp nginx.conf user@your-host:/home/user/trip-planner-front/
scp -r TripPlanner/ user@your-host:/home/user/trip-planner-front/
```

### Вариант 2: Git (рекомендуется)

```bash
# На хосте:
cd /home/user
git clone <your-repo-url> trip-planner-front
cd trip-planner-front
git pull  # Получить последние изменения
```

### Вариант 3: Архив

```powershell
# На локальной машине - создать архив:
Compress-Archive -Path "c:\Users\User\Desktop\DiplomFin\trip-planner-front" -DestinationPath trip-planner.zip

# На хосте - распаковать:
unzip trip-planner.zip
cd trip-planner-front
```

---

## 🔧 Подготовка на хосте

### 1️⃣ Отредактировать конфиги для Production

```bash
cd /home/user/trip-planner-front

# Создать .env файл с переменными окружения
cat > .env << 'EOF'
# Database
DB_SA_PASSWORD=YourStrongPassword@123!
DB_NAME=TripPlanner

# API
API_ENVIRONMENT=Production
ASPNETCORE_ENVIRONMENT=Production

# URLs
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api

# CORS
CORS_ORIGINS=https://yourdomain.com

# JWT
JWT_SECRET_KEY=YourSuperSecretKeyAtLeast32CharsLongForProduction!
EOF
```

### 2️⃣ Обновить appsettings.Production.json

```bash
# Отредактировать password для БД
nano TripPlanner/TripPlanner/appsettings.Production.json
```

Убедиться что там:
```json
{
  "ConnectionStrings": {
    "Database": "Data Source=sqlserver;Initial Catalog=TripPlanner;User ID=sa;Password=YourStrongPassword@123!;TrustServerCertificate=True;..."
  },
  "App": {
    "CorsOrigins": ["https://yourdomain.com"]
  },
  "JWT": {
    "SecretKey": "YourSuperSecretKeyAtLeast32CharsLongForProduction!"
  }
}
```

### 3️⃣ Подготовить Nginx для SSL

Отредактировать `nginx.conf` для HTTPS:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Редирект с HTTP на HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }

    client_max_body_size 100M;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 4️⃣ Получить SSL сертификат (Let's Encrypt)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Сертификаты будут в: /etc/letsencrypt/live/yourdomain.com/
```

---

## 🚀 Собрать и запустить

### 1️⃣ Собрать Docker образы на хосте

```bash
cd /home/user/trip-planner-front

# Чистая сборка (может занять 5-10 минут)
docker-compose build

# Или с --no-cache для полной пересборки
docker-compose build --no-cache
```

### 2️⃣ Запустить контейнеры

```bash
# Запустить все в фоне
docker-compose up -d

# Подождать инициализации БД (45-60 сек)
sleep 60

# Проверить статус
docker-compose ps

# Должно быть 4 контейнера с статусом "Up"
```

### 3️⃣ Проверить логи

```bash
# API логи
docker-compose logs api | tail -50

# Nginx логи
docker-compose logs nginx | tail -20

# Все логи
docker-compose logs | tail -100
```

---

## 🔗 Настроить домен

### Вариант 1: Через DNS (рекомендуется)

1. Перейти в панель управления доменом
2. Добавить A record: `yourdomain.com` → IP хоста
3. Добавить CNAME record: `www.yourdomain.com` → `yourdomain.com`
4. Подождать 5-15 минут на распространение DNS

### Вариант 2: Через /etc/hosts (для тестирования)

```bash
# На хосте
sudo nano /etc/hosts

# Добавить строку:
# 127.0.0.1 yourdomain.com www.yourdomain.com
```

---

## ✅ Проверить что работает

```bash
# Проверить фронтенд
curl -I http://localhost/

# Проверить API
curl -I http://localhost/api/health

# Полная проверка через доменное имя (после DNS обновления)
curl -I https://yourdomain.com/
curl -I https://yourdomain.com/api/health

# Тест login endpoint
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

---

## 🔄 Обновления и поддержка

### Обновить код с репозитория

```bash
cd /home/user/trip-planner-front

# Получить последние изменения
git pull

# Пересобрать измененные сервисы
docker-compose build api --no-cache
docker-compose up -d api

# Или все сразу
docker-compose build --no-cache
docker-compose up -d
```

### Автоматический перезапуск при сбое

Docker Compose уже настроен `restart: unless-stopped` - контейнеры будут перезапущены автоматически.

### Мониторинг ресурсов

```bash
# Смотреть использование CPU и памяти
docker stats

# Сохранить статистику в файл
docker stats --no-stream > stats.txt
```

---

## 💾 Backup БД

### Ручной backup

```bash
# Полный backup БД
docker exec trip-planner-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourPassword" \
  -Q "BACKUP DATABASE TripPlanner TO DISK = '/var/opt/mssql/backup/TripPlanner.bak'"

# Скопировать backup на локальную машину
scp user@your-host:/var/opt/mssql/backup/TripPlanner.bak ./
```

### Автоматический backup (cron)

```bash
# Создать скрипт backup
cat > /home/user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/user/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
docker exec trip-planner-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourPassword" \
  -Q "BACKUP DATABASE TripPlanner TO DISK = '/var/opt/mssql/backup/TripPlanner_$TIMESTAMP.bak'"
cp /var/opt/mssql/backup/TripPlanner_$TIMESTAMP.bak $BACKUP_DIR/
# Удалить старые backups (старше 7 дней)
find $BACKUP_DIR -name "*.bak" -mtime +7 -delete
EOF

chmod +x /home/user/backup-db.sh

# Добавить в cron (ежедневно в 02:00)
crontab -e
# Добавить строку:
# 0 2 * * * /home/user/backup-db.sh
```

---

## 📊 Мониторинг и логи

### Сохранять логи

```bash
# Создать папку для логов
mkdir -p /var/log/trip-planner

# Сохранять логи ежедневно
cat > /home/user/save-logs.sh << 'EOF'
#!/bin/bash
LOG_DIR="/var/log/trip-planner"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
docker-compose -f /home/user/trip-planner-front/docker-compose.yml logs > $LOG_DIR/all-$TIMESTAMP.log
docker-compose -f /home/user/trip-planner-front/docker-compose.yml logs api > $LOG_DIR/api-$TIMESTAMP.log
# Удалить логи старше 30 дней
find $LOG_DIR -name "*.log" -mtime +30 -delete
EOF

chmod +x /home/user/save-logs.sh

# В cron (ежедневно в 03:00)
# 0 3 * * * /home/user/save-logs.sh
```

---

## 🛑 Остановка и удаления

### Остановить всё (сохраняет данные)
```bash
docker-compose down
```

### Полная очистка (осторожно!)
```bash
docker-compose down -v  # Удаляет БД и все тома!
```

---

## 🐛 Типичные проблемы

### Ошибка "Address already in use"
```bash
# Найти процесс
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :5000

# Убить процесс
sudo kill -9 <PID>

# Или просто перезагрузить хост
sudo reboot
```

### БД не инициализируется
```bash
# Проверить логи БД
docker-compose logs sqlserver | tail -100

# Дать БД больше времени
docker-compose up -d
sleep 120  # Подождать 2 минуты
docker-compose ps
```

### API не коннектится к БД
```bash
# Проверить connection string
docker-compose logs api | grep -i "connection\|database\|error"

# Проверить сеть
docker exec trip-planner-api ping sqlserver
```

---

## 📝 Чек-лист перед production

- [ ] Изменить пароли БД в appsettings.Production.json
- [ ] Обновить CORS origins в конфиге
- [ ] Получить SSL сертификат от Let's Encrypt
- [ ] Настроить домен и DNS
- [ ] Создать backup script
- [ ] Настроить логирование
- [ ] Проверить security rules (firewall)
- [ ] Установить monitoring (docker stats, etc.)
- [ ] Протестировать все endpoints
- [ ] Создать документацию для support
- [ ] Подготовить plan восстановления при сбое

---

## 🚀 Быстрый старт для deployment

```bash
# 1. Копировать проект
scp -r trip-planner-front user@your-host:/home/user/

# 2. На хосте
ssh user@your-host
cd ~/trip-planner-front

# 3. Скопировать нужные конфиги и отредактировать их
# (пароли, доменные имена, SSL пути, etc.)

# 4. Собрать образы
docker-compose build

# 5. Запустить
docker-compose up -d
sleep 60

# 6. Проверить
docker-compose ps
docker-compose logs api | tail -20
curl -I http://localhost/api/health

# 7. Готово!
echo "✓ Deployment successful!"
```
