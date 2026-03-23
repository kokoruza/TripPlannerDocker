# 🎨 Components Guide

Полная документация всех React компонентов в Trip Planner.

---

## 📖 Оглавление

- [Page Components](#page-components) - Основные страницы приложения
- [Modal Components](#modal-components) - Модальные окна
- [Data Display Components](#data-display-components) - Отображение данных
- [Form Components](#form-components) - Формы ввода
- [Utility Components](#utility-components) - Вспомогательные компоненты

---

## Page Components

### CalendarPage

**Назначение:** Отображение календаря с событиями и расписанием отпуска.

**Путь:** `src/pages/CalendarPage.jsx`

**Props:** 
```javascript
// Никаких props, использует URL params
// Доступ через: useParams() → { tripId }
```

**Состояние:**
```javascript
const [events, setEvents] = useState([])     // CalendarEvent[]
const [vacations, setVacations] = useState([]) // VacationSchedule[]
const [selectedDate, setSelectedDate] = useState(null)
const [showEventModal, setShowEventModal] = useState(false)
const [showDayModal, setShowDayModal] = useState(false)
```

**Функциональность:**
- Загрузка событий через `calendarApi.getEventsByTrip(tripId)`
- Загрузка отпусков через `calendarApi.getVacationSchedules(tripId)`
- Клик на день открывает DayDetailsModal
- Клик на "Новое событие" открывает EventModal

**Особенности:**
- ✅ Sticky header на мобилке (месяц и стрелки навигации)
- ✅ Horizontal scroll сетки ячеек

**Используется в:** Router как route `/trip/:tripId/calendar`

---

### GalleryPage

**Назначение:** Отображение галереи фото с сортировкой и поиском.

**Путь:** `src/pages/GalleryPage.jsx`

**Props:**
```javascript
// Использует URL params: { tripId }
```

**Состояние:**
```javascript
const [photos, setPhotos] = useState([])
const [selectedPhoto, setSelectedPhoto] = useState(null)
const [showUploadModal, setShowUploadModal] = useState(false)
const [sortBy, setSortBy] = useState('recent') // recent, likes, oldest
```

**Функциональность:**
- Загрузка фото через `galleryApi.getGalleryByTrip(tripId)`
- Сортировка по дате, лайкам
- Фильтрация по title
- Клик на фото открывает GalleryPhotoModal
- "Загрузить" кнопка открывает UploadPhotoModal

**Используется в:** Router как route `/trip/:tripId/gallery`

---

### BoardPage

**Назначение:** Отображение досок с карточками (Kanban-подобный интерфейс).

**Путь:** `src/pages/BoardPage.jsx`

**Состояние:**
```javascript
const [boards, setBoards] = useState([])
const [selectedBoard, setSelectedBoard] = useState(null)
```

**Функциональность:**
- Загрузка досок trip-а
- Переход на BoardDetailPage при выборе доски
- Создание новой доски

---

### PollsPage

**Назначение:** Создание и голосование в опросах.

**Путь:** `src/pages/PollsPage.jsx`

**Состояние:**
```javascript
const [polls, setPolls] = useState([])
const [showCreateModal, setShowCreateModal] = useState(false)
```

**Функциональность:**
- Список опросов активного trip-а
- Клик открывает детали и форму голосования
- Создание новой опроса (CreatePollModal)

---

### ProfilePage

**Назначение:** Просмотр профиля пользователя.

**Путь:** `src/pages/ProfilePage.jsx`

**Props:**
```javascript
// URL params: { userId } или используется текущий пользователь
```

**Состояние:**
```javascript
const [user, setUser] = useState(null)
const [isEditing, setIsEditing] = useState(false)
```

**Функциональность:**
- Загрузка профиля через `accountsApi.getUser(userId)`
- Редактирование если профиль свой
- Загрузка аватара

---

## Modal Components

### EventModal

**Назначение:** Создание нового события с загрузкой фото.

**Путь:** `src/components/EventModal.jsx`

**Props:**
```javascript
{
  isOpen: boolean,              // Видимость модала
  onClose: () => void,          // Callback при закрытии
  tripId: string,               // ID поездки
  onEventCreated: (event) => void // Callback при создании
}
```

**Состояние:**
```javascript
const [formData, setFormData] = useState({
  title: '',      // Название события
  description: '', // Описание
  date: '',       // Дата в формате YYYY-MM-DD
  file: null      // Файл фото
})
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
```

**Функциональность:**
- Форма с полями: title, description, date picker, file input
- Валидация полей
- Отправка FormData на сервер
- На успех: вызывает onEventCreated и закрывает модал

**Особенности:**
- ✅ Исправлена ошибка -1 день (дата создается в полдень UTC)
- ✅ File input для загрузки фото
- ✅ Предпросмотр выбранного файла

---

### EventDetailsModal

**Назначение:** Отображение полной информации о событии.

**Путь:** `src/components/EventDetailsModal.jsx`

**Props:**
```javascript
{
  event: {
    id: string,
    title: string,
    description?: string,
    date: Date,
    imageUrl?: string,      // Путь: /gallery/guid-name.jpg
    createdById: string,
    createdByName: string,
    createdByEmail: string,
    createdByAvatarPath?: string // Путь: /uploads/avatars/...
  },
  isOpen: boolean,
  onClose: () => void,
  onDelete: () => void    // Callback при удалении события
}
```

**Функциональность:**
- Отображение всей информации события
- Показ фото события (если есть):
  - Преобразование пути с API_ORIGIN: `${API_ORIGIN}/gallery/...`
- Информация об организаторе:
  - Аватар (преобразование пути с API_ORIGIN)
  - Имя как ссылка (UserLink компонент)
  - Email
- Кнопка удаления (если пользователь автор)

**Особенности:**
- ✅ Использует UserLink для профиля создателя
- ✅ Обработка imageUrl (с fallback)
- ✅ Обработка null aватара (тогда показывает avatar-иконка)

---

### DayDetailsModal

**Назначение:** Показ всех событий и отпусков для выбранного дня.

**Путь:** `src/components/DayDetailsModal.jsx`

**Props:**
```javascript
{
  date: Date,
  events: CalendarEvent[],          // События этого дня
  vacations: VacationSchedule[],     // Отпуска этого дня
  isOpen: boolean,
  onClose: () => void,
  onEventSelect: (event) => void    // Открыть EventDetailsModal
}
```

**Функциональность:**
- Список событий дня с маленькими превью
- Клик на событие открывает EventDetailsModal
- Показ отпусков (день вне работы)

**Вывод:**
```
[Дата: Пн, 12 апреля 2025]

Событие 1: Обед в японском ресторане
  └─ [фото превью] Создал Иван

Событие 2: Поход в горы
  └─ [фото превью] Создал Петр

[ Отпуск: День отдыха ]
```

---

### GalleryPhotoModal

**Назначение:** Полный просмотр фото с комментариями и лайками.

**Путь:** `src/components/GalleryPhotoModal.jsx`

**Props:**
```javascript
{
  photo: {
    id: string,
    title: string,
    description?: string,
    imagePath: string,     // /uploads/gallery/filename
    uploadedByName: string,
    uploadedByEmail: string,
    uploadedByAvatarPath?: string,
    likeCount: number,
    comments: Comment[]
  },
  isOpen: boolean,
  onClose: () => void,
  onDelete: () => void
}
```

**Состояние:**
```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
const [newComment, setNewComment] = useState('')
const [isLiked, setIsLiked] = useState(false)
const [likeCount, setLikeCount] = useState(photo.likeCount)
```

**Функциональность:**
- Левая/верхняя часть: полное фото
  - На desktop: слева (50% ширины)
  - На mobile: сверху (100% высоты контейнера)
- Правая/нижняя часть: комментарии и лайки
  - При мобилке: независимая прокрутка

**Особенности:**
- ✅ Адаптивная верстка (flexDirection: row/column)
- ✅ document.body.overflow = 'hidden' при открытии (нет скролла страницы)
- ✅ window.innerWidth используется via useEffect для избежания hydration error
- ✅ Возможность добавить комментарий
- ✅ Лайк/unlike через иконку
- ✅ Удаление комментариев если автор

---

### UploadPhotoModal

**Назначение:** Загрузка новой фото в галерею.

**Путь:** `src/components/UploadPhotoModal.jsx`

**Props:**
```javascript
{
  tripId: string,
  isOpen: boolean,
  onClose: () => void,
  onPhotoUploaded: (photo) => void
}
```

**Состояние:**
```javascript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  file: null
})
const [preview, setPreview] = useState(null)
const [loading, setLoading] = useState(false)
```

**Функциональность:**
- Форма с title, description, file input
- Превью выбранного файла
- Отправка FormData на galleryApi.uploadPhoto()
- На успех: вызывает onPhotoUploaded и закрывает

---

### CreatePollModal

**Назначение:** Создание опроса с вариантами ответов.

**Путь:** `src/components/CreatePollModal.jsx`

**Props:**
```javascript
{
  tripId: string,
  isOpen: boolean,
  onClose: () => void,
  onPollCreated: (poll) => void
}
```

**Состояние:**
```javascript
const [poll, setPoll] = useState({
  question: '',
  options: ['', '', '']  // Мінімум 2 варіанти
})
```

**Функциональность:**
- Input для вопроса
- Динамические inputs для вариантов ответов
- Кнопка "Добавить вариант"
- Валидация (вопрос не пусто, ≥2 варіантов)
- Отправка на сервер

---

### VacationScheduleModal

**Назначение:** Добавление периода отпуска в календарь.

**Путь:** `src/components/VacationScheduleModal.jsx`

**Props:**
```javascript
{
  tripId: string,
  isOpen: boolean,
  onClose: () => void,
  onScheduleCreated: () => void
}
```

**Функциональность:**
- Date picker для start и end dates
- Опционально: описание (примечание)
- Отправка на calendarApi.createVacationSchedule()

---

## Data Display Components

### Calendar

**Назначение:** Отображение календаря месяца с событиями.

**Путь:** `src/components/Calendar.jsx`

**Props:**
```javascript
{
  events: CalendarEvent[],
  vacations: VacationSchedule[],
  onDaySelect: (date) => void,
  currentMonth: Date           // Текущий месяц
}
```

**Состояние:**
```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
```

**Функциональность:**
- Отображение сетки дней месяца (7 колон, по 6 рядов)
- Стрелки навигации (предыдущий/следующий месяц)
- Не-работающие дни (серый цвет)
- Точки на днях с событиями
- Заливка отпусков
- Клик на день → onDaySelect(date)

**Особенности:**
- ✅ Sticky header (месяц и стрелки фиксированы вверху на мобилке)
- ✅ Сетка имеет overflowX: auto для scroll на мобилке
- ✅ На desktop: сетка полной ширины, на мобилке: может быть шире экрана

**CSS особенности:**
```css
.calendar-header {
  position: sticky;
  top: 0;
  flex-shrink: 0;      /* Не сжимается */
  z-index: 10;
}

.calendar-grid {
  overflow-x: auto;    /* Горизонтальный скролл */
  flex: 1;
}
```

---

### GalleryPhotoCard

**Назначение:** Card с превью фото в галерее.

**Путь:** `src/components/GalleryPhotoCard.jsx`

**Props:**
```javascript
{
  photo: {
    id: string,
    title: string,
    imagePath: string,  // /uploads/gallery/filename
    likeCount: number
  },
  onClick: () => void,   // Открыть полный просмотр
  onDelete: () => void   // Удалить фото
}
```

**Функциональность:**
- Превью изображения с placeholder
- Название фото
- Счетчик лайков
- Кнопка удаления (только для автора)
- Клик открывает GalleryPhotoModal

**Вывод:**
```
┌──────┐
│ IMG  │  Высота: 200px, width: 100%
├──────┤
│Title │  "Закат на пляже"
│♥ 42  │  Счетчик лайков
└──────┘
```

---

### Board

**Назначение:** Отображение доски с колонками (Kanban).

**Путь:** `src/components/Board.jsx`

**Props:**
```javascript
{
  board: {
    id: string,
    name: string,
    cards: Card[]
  },
  onCardSelect: (card) => void,
  onCardCreate: () => void
}
```

**Функциональность:**
- Отображение дефолтных колонок (TODO, IN_PROGRESS, DONE)
- Карточки в соответствующих колонках по статусу
- Drag-and-drop между колонками (опционально)
- Клик на карточку открывает детали

---

### Sticker

**Назначение:** Visual компонент для маленьких note.

**Путь:** `src/components/Sticker.jsx`

**Props:**
```javascript
{
  text: string,
  type?: 'idea' | 'task' | 'hourglass',  // Тип стикера
  color?: string,                         // CSS цвет
  onDelete?: () => void
}
```

**Функциональность:**
- Рендер стикера (похоже на Post-it)
- Иконка в зависимости от type
- Кнопка удаления
- Вращение для visual эффекта

---

### PollCard

**Назначение:** Card с опросом и результатами.

**Путь:** `src/components/PollCard.jsx`

**Props:**
```javascript
{
  poll: {
    id: string,
    question: string,
    options: {
      id: string,
      text: string,
      voteCount: number
    }[],
    isVoted: boolean,
    userVote?: string      // ID опции которую голосовал
  },
  onVote: (optionId) => void
}
```

**Функциональность:**
- Вопрос опроса
- Варіанти ответов как radio buttons
- Прогресс бар для кожного варіанту показующий % голосов
- Кнопка "Голосовать"
- Если уже проголосовал - показать результаты

**Вывод:**
```
Какой город посетить?

○ Барселона (45%) ███████░░░
○ Рим (30%) ████░░░░░░░
● Париж (25%) ███░░░░░░░░░  [Ваш голос]

[Голосовать]
```

---

## Form Components

### TripList

**Назначение:** Список поездок на главной странице.

**Путь:** `src/components/TripList.jsx`

**Props:**
```javascript
{
  trips: Trip[],
  onTripSelect: (tripId) => void,
  onTripCreate: () => void    // Открыть AddTrip модал
}
```

**Функциональность:**
- Список карточек поездок
- Показ: название, даты, членей, кол-во событий
- Клик на карточку переходит на страницу поездки
- Кнопка "Создать поездку"

---

### TripMembersManager

**Назначение:** Управление членами поездки (добавить/удалить).

**Путь:** `src/components/TripMembersManager.jsx`

**Props:**
```javascript
{
  tripId: string,
  members: TripMember[],
  onMembersChange: (members) => void,
  isOwner: boolean
}
```

**Функциональность:**
- Список текущих членов с аватарами
- Поле поиска/email для добавления
- Кнопка удалить (только для owner)
- Загвоздка для удаления
- На успех: onMembersChange с новым списком

---

### AddTrip

**Назначение:** Форма создания поездки.

**Путь:** `src/components/AddTrip.jsx`

**Props:**
```javascript
{
  onTripCreated: (trip) => void,
  onCancel: () => void
}
```

**Состояние:**
```javascript
const [formData, setFormData] = useState({
  name: '',
  startDate: '',
  endDate: ''
})
```

**Функциональность:**
- Text input: название поездки
- Date inputs: start и end dates
- Валидация (все поля не пусто, start < end)
- Отправка на tripApi.createTrip()
- На успех: onTripCreated и очистка формы

---

## Utility Components

### UserLink

**Назначение:** Кликабельная ссылка на профиль пользователя.

**Путь:** `src/components/UserLink.jsx`

**Props:**
```javascript
{
  accountId: string,           // ID пользователя
  name?: string,              // Имя для отображения
  email?: string,             // Fallback если нет имени
  className?: string          // CSS класс
}
```

**Функциональность:**
- Ссылка <Link to={`/profile/${accountId}`}>
- Отображает name или email
- Стиль: цвет primary (синий), underline на hover
- Логит warning если accountId не предоставлен

**Пример окончательного html:**
```html
<Link to="/profile/abc123" className="user-link">
  Иван Петров
</Link>
```

---

### UserMenu

**Назначение:** Dropdown меню пользователя в header-е.

**Путь:** `src/components/UserMenu.jsx`

**Функциональность:**
- Аватар пользователя (кликабельный)
- На клик - dropdown с опциями:
  - Мой профиль
  - Настройки
  - Выход (logout)

---

### ThemeToggle

**Назначение:** Переключение между light/dark темой.

**Путь:** `src/components/ThemeToggle.jsx`

**Функциональность:**
- кнопка с иконкой солнца/луны
- На клик - переключает тему
- Сохраняет в localStorage('tp-theme')
- Обновляет html[data-theme]

---

## Component Tree

```
App
├── Router
│   ├── LoginPage
│   ├── PrivateRoute
│   │   ├── TripsPage
│   │   │   ├── TripList
│   │   │   │   └── (каждый trip item)
│   │   │   ├── AddTrip (модал)
│   │   │   └── TripMembersManager (модал)
│   │   │
│   │   ├── CalendarPage
│   │   │   ├── Calendar
│   │   │   ├── EventModal (модал)
│   │   │   ├── EventDetailsModal (модал)
│   │   │   │   └── UserLink
│   │   │   └── DayDetailsModal (модал)
│   │   │       └── EventDetailsModal (вложена)
│   │   │
│   │   ├── GalleryPage
│   │   │   ├── GalleryPhotoCard (много)
│   │   │   ├── GalleryPhotoModal (модал)
│   │   │   │   └── (comments вложены)
│   │   │   └── UploadPhotoModal (модал)
│   │   │
│   │   ├── BoardPage
│   │   │   └── Board
│   │   │       └── Sticker (много)
│   │   │
│   │   ├── PollsPage
│   │   │   ├── PollCard (много)
│   │   │   └── CreatePollModal (модал)
│   │   │
│   │   ├── ProfilePage
│   │   │   └── (аватар, имя, email)
│   │   │
│   │   └── Header
│   │       ├── UserMenu
│   │       └── ThemeToggle
│   │
│   └── 404 Page
│
└── AuthContext (глобальное состояние)
```

---

## Reusable Patterns

### API запрос в компоненте

```javascript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await api.getData(id)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  fetchData()
}, [id])

return (
  loading ? <Spinner /> :
  error ? <Error message={error} /> :
  <DataDisplay data={data} />
)
```

### Conditional rendering

```javascript
{condition && <Component />}
{condition ? <IfTrue /> : <IfFalse />}
{Array.isArray(data) && data.length > 0 && <List items={data} />}
```

### Event handler з валідацією

```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  
  if (!formData.name) {
    setError('Поле обязательно')
    return
  }
  
  // API запрос
  api.submitForm(formData)
    .then(result => onSuccess(result))
    .catch(err => setError(err.message))
}
```

---

## Best Practices

1. **Props Validation** - Используй PropTypes или TypeScript
2. **Memoization** - Use React.memo для компонентів без частих змін
3. **useCallback** - Обертай callbacks для передачи в мемоизовані компоненты
4. **Custom Hooks** - Витягай повторюючись логіку (fetch, localStorage, etc)
5. **Key prop** - Завсегда використовуй unique key в lists
6. **Composition** - Комбінуй маленькі компоненты замість одного великого

---

**Последнее обновление:** March 12, 2026  
**версия:** 1.0 MVP
