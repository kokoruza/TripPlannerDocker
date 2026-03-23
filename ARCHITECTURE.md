# 🏗️ Trip Planner - Полная архитектура проекта

Документация архитектуры и взаимодействия между фронтендом и бэкендом Trip Planner.

---

## 📎 Структура репозитория

```
trip-planner-front/
├── trip-planner-front/          # React фронтенд приложение
│   ├── src/
│   │   ├── api/                 # API клиент
│   │   ├── auth/                # Аутентификация
│   │   ├── pages/               # Страницы приложения
│   │   ├── components/          # React компоненты
│   │   ├── router/              # Маршрутизация
│   │   ├── App.jsx
│   │   └── index.css            # CSS переменные
│   ├── index.html               # HTML точка входа
│   ├── package.json
│   └── vite.config.js
│
├── TripPlanner/                 # .NET бэкенд
│   ├── TripPlanner/             # API контроллеры
│   ├── TripPlanner.Application/ # CQRS бизнес-логика
│   ├── TripPlanner.Domain/      # Доменные модели
│   ├── TripPlanner.Infrastructure/ # Доступ к данным
│   └── Shared/                  # Общая функциональность
│
├── README.md                    # Этот файл
└── ARCHITECTURE.md              # Этот проект
```

---

## 🔄 Архитектурные слои

### Frontend (React + Vite)

```
┌─────────────────────────────────────┐
│    Pages (UI Layer)                 │
│ - CalendarPage, GalleryPage, etc.   │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Components (Presentational)         │
│ - Calendar, EventModal, Gallery      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  AuthContext (State Management)      │
│ - User info, Token management       │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  API Layer (HTTP Client)            │
│ - axios, calendarApi, galleryApi    │
└────────────┬────────────────────────┘
             │
      HTTPS/JSON over CORS
             │
        [Backend API]
```

### Backend (.NET 8 - Clean Architecture)

```
┌─────────────────────────────────────┐
│  Controllers (API Endpoints)         │
│ - AuthController, CalendarController │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Application Layer (CQRS)            │
│ - Commands, Queries, Handlers        │
│ - DTOs, Mapping                      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Domain Layer (Business Logic)       │
│ - Entities (User, Trip, Event)       │
│ - Exceptions, Value Objects         │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Infrastructure Layer (Data Access)  │
│ - DbContext, Repositories, Services │
│ - EF Core Migrations                │
└────────────┬────────────────────────┘
             │
        [SQL Database]
```

---

## 🌐 Data Flow (Пример: Создание события)

### Frontend запрос:
```
1. User заполняет форму EventModal
   → title, description, date, file (фото)

2. handleSubmit в EventModal вызывает:
   POST /api/trips/:tripId/events

3. API запрос через calendarApi.js:
   const formData = new FormData()
   formData.append('file', file)
   formData.append('title', title)
   // ...
   
4. Ответ приходит:
   { id, title, imageUrl: "/gallery/...", createdBy... }

5. EventDetailsModal отображает:
   - Название события
   - Фото с imageUrl (добавляет API_ORIGIN)
   - Информацию об организаторе (со ссылкой в профиль UserLink)
```

### Backend обработка:
```
1. CalendarController.CreateEvent() получает запрос

2. Генерирует путь для файла:
   imageUrl = $"/gallery/{Guid.NewGuid()}-{file.FileName}"

3. CreateCalendarEventCommand отправляется в MediatR

4. CreateCalendarEventCommandHandler:
   - Проверяет что пользователь участник
   - Создает CalendarEvent в БД
   - Возвращает CalendarEventResponseDto

5. Ответ: 201 Created с объектом события
```

---

## 💾 Структура данных

### Основные сущности

```
User
├── id (Guid)
├── email (string)
├── name (string)
├── avatarPath (string?) → /uploads/avatars/...
└── createdAt (DateTime)

Trip
├── id (Guid)
├── name (string)
├── ownerId (Guid FK)
├── startDate (DateTime)
├── endDate (DateTime)
├── members (TripMember[])
├── events (CalendarEvent[])
├── photos (GalleryPhoto[])
└── boards (Board[])

CalendarEvent
├── id (Guid)
├── tripId (Guid FK)
├── title (string)
├── description (string?)
├── date (DateTime)
├── imageUrl (string?) → /gallery/{guid}-{filename}
├── createdBy (User)
└── createdAt (DateTime)

GalleryPhoto
├── id (Guid)
├── tripId (Guid FK)
├── title (string)
├── description (string?)
├── imagePath (string) → /uploads/gallery/{filename}
├── uploadedBy (User)
├── likeCount (int)
├── comments (GalleryComment[])
└── likes (PhotoLike[])

Board
├── id (Guid)
├── tripId (Guid FK)
├── name (string)
└── cards (Card[])

Card
├── id (Guid)
├── boardId (Guid FK)
├── title (string)
├── content (string?)
├── type (ECardType) → Hourglass, Idea, Task
└── createdAt (DateTime)
```

---

## 🔐 Аутентификация и авторизация

### JWT Flow

```
Frontend                          Backend
   │                                │
   ├─ POST /auth/login ────────────>│
   │  { email, password }           │
   │                                │  ✓ Проверить пароль
   │<─ { accessToken, refreshToken }│
   │                                │
   ├─ GET /api/trips              >│
   │  Header: Authorization: Bearer {accessToken}
   │                                │  ✓ Verify JWT
   │<─ [trips]                      │
   │                                │
   │ ... (15 минут) ...             │
   │                                │
   ├─ POST /auth/refresh ─────────>│
   │  { refreshToken }              │
   │                                │  ✓ Verify refresh token
   │<─ { accessToken, refreshToken }│
```

### Защита маршрутов

**Frontend** (в router.jsx):
```javascript
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext)
  return isAuthenticated ? children : <Navigate to="/" />
}
```

**Backend** (в контроллерах):
```csharp
[Authorize(nameof(EAccessPolicy.User))]
public async Task<IResult> GetEvents(...)
```

---

## 📱 Адаптивный дизайн

### Брейкпоинты
- Desktop: > 768px
- Mobile: ≤ 768px

### Примеры адаптации

#### Календарь
```javascript
const isMobile = window.innerWidth <= 768

// Desktop: Header + horizontally scrollable grid
// Mobile: Sticky header + scrollable grid
```

#### Галерея модал
```javascript
<div style={{
  flexDirection: isMobile ? "column" : "row",
  // Mobile: фото сверху, комментарии снизу (одна колонка)
  // Desktop: фото слева, комментарии справа (две колоны)
}}>
```

---

## 🎨 Система стилизации

### CSS Variables (в index.css)

```css
/* Основной цвет */
--primary: #2563eb  /* Синий */
--primary-dark: #1d4ed8

/* Текст и фоны */
--text: #1f2937       /* Тёмный текст */
--text-secondary: #6b7280
--bg: #f9fafb         /* Светлый фон */
--bg-secondary: #f3f4f6

/* Бордеры и тени */
--border: #e5e7eb
--shadow: 0 1px 3px rgba(0,0,0,0.12)
```

### Темизация

```javascript
// Dark mode хранится в localStorage
const theme = localStorage.getItem('tp-theme') || 'light'
document.documentElement.dataset.theme = theme

// CSS селектор
html[data-theme="dark"] {
  --primary: #60a5fa
  --text: #f3f4f6
  --bg: #1f2937
}
```

---

## 🔄 Основные пользовательские потоки

### 1. Регистрация и вход

```
RegisterPage
  → authApi.register({ email, password, name })
    → Backend: POST /auth/register
      → Создает User в БД
      → Возвращает JWT token + refreshToken
    → Сохраняет token в localStorage/cookies
    → Обновляет AuthContext

TripsPage (перенаправление после входа)
```

### 2. Создание события в календаре

```
CalendarPage
  → handleDaySelect(date)
    → Открывает EventModal

EventModal
  → handleSubmit()
    → createEvent(tripId, { title, date, file })
      → Backend: POST /api/trips/:tripId/events
        → Сохраняет файл в wwwroot/uploads/gallery/
        → Создает CalendarEvent в БД
        → Возвращает imageUrl (например: /gallery/guid-name.jpg)
    → Обновляет список событий в Calendar

Calendar
  → Переотрисовывает сетку с новым событием
```

### 3. Просмотр фотографии в галерее

```
GalleryPage
  → Загружает фото через galleryApi.getGalleryByTrip()
  → Отображает карточки с превью

GalleryPhotoCard (клик)
  → Открывает GalleryPhotoModal

GalleryPhotoModal
  → Отображает полное фото (imagePath с API_ORIGIN)
  → Комментарии (прокручиваются независимо на мобилке)
  → Лайки
  → Удаление комментариев (если пользователь автор)
```

---

## 🚀 Performance оптимизация

### Frontend
- ✅ Code splitting с React.lazy()
- ✅ Мемоизация компонентов (React.memo)
- ✅ Виртуализация списков если нужно
- ✅ Lazy loading изображений

### Backend
- ✅ Async/await операции (не блокирует потоки)
- ✅ EF Core асинхронные запросы
- ✅ Кэширование статических файлов (wwwroot)
- ✅ Пагинация если списки большие

---

## 🧪 Тестирование

### Unit тесты (Backend)
```bash
dotnet test TripPlanner.sln
```

### E2E тесты (Frontend)
```bash
npm run test:e2e
```

### Ручное тестирование
1. Swagger API: https://localhost:7085/swagger
2. Frontend dev: http://localhost:5173

---

## 🔌 Integration Points

### 1. Загрузка иконок/картинок

```
Frontend                Backend                    File System
CalendarPage                                            
  └─ EventModal
      └─ file input ──> FormData ──────> CalendarController.CreateEvent()
                                            ├─ Генерирует: /gallery/{guid}-name.jpg
                                            ├─ Сохраняет в wwwroot/uploads/gallery/
                                            └─ Возвращает imageUrl
         Canvas <─────────────────────────── response.imageUrl
         Display: IMG src={API_ORIGIN + imageUrl}
```

### 2. Аватары пользователей

```
Backend создает путь:        Frontend использует:
/uploads/avatars/{filename}  img src={API_ORIGIN + "/uploads/avatars/..."}

или более новый:
/uploads/profiles/{userId}/{filename}
```

---

## 📊 Последние улучшения (March 2026)

### Calendar
- ✅ Sticky header на мобилке (месяц + стрелки не прокручиваются)
- ✅ Исправлена ошибка -1 день (дата создается в полдень)
- ✅ Адаптивные размеры ячеек (clamp для responsive)

### Events & Gallery
- ✅ Полная поддержка загрузки фото к событиям
- ✅ Правильное преобразование путей (API_ORIGIN + path)
- ✅ На мобилке: модал полностью занимает экран
- ✅ На мобилке: нет прокрутки страницы при открытом модале

### Profile Links
- ✅ UserLink компонент для кликабельных ссылок
- ✅ Fallback на email если имя отсутствует
- ✅ Консистентный стиль во всем приложении

---

## 🚨 Известные ограничения

1. **Файлы хранятся локально** - Нужно перенести на облако (S3, Azure Blob) для масштабирования
2. **Нет кэширования** - Реактивные запросы к API каждый раз  
3. **Нет offline режима** - PWA может быть добавлена позже
4. **Нет real-time обновлений** - WebSocket можно добавить для live events

---

## 📚 Дополнительные ресурсы

- [Frontend README](trip-planner-front/README.md)
- [Backend README](TripPlanner/README.md)
- [Swagger API](https://localhost:7085/swagger)
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- CQRS Pattern: https://martinfowler.com/bliki/CQRS.html

---

**Последнее обновление:** March 12, 2026  
**Версия:** 1.0 MVP
