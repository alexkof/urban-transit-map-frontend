# Архитектура проекта: Next.js + Leaflet + FSD (App Router)

Проект для отображения геоданных из JSON с фильтрацией маршрутов.

## Структура проекта

```
app/
  (main)/
    layout.tsx              # Основной layout
    page.tsx                # Главная страница с картой
    loading.tsx             # Состояние загрузки
    error.tsx               # Обработка ошибок

features/
 map-filtering/          # Фильтрация маршрутов
   filter-logic.ts       # Логика фильтрации
   FilterControls.tsx    # UI фильтров (Client Component)
 
 geo-display/            # Отображение геоданных
   map-utils.ts          # Утилиты для работы с картой
   MapView.tsx           # Компонент карты (Client)

entities/
 geo-data/
   parser.ts             # Парсинг JSON в геоданные
   types.ts              # Типы данных
   
 route/
   model.ts              # Модель маршрута
   utils.ts              # Утилиты работы с маршрутами

widgets/
 map-with-filters/
   context.ts            # Контекст для управления состоянием
   MapWidget.tsx         # Композитный виджет (Client)

shared/
 api/
   geo-data.ts           # API для загрузки данных
 ui/
   components/           # UI-кит (Button, Select etc.)
 utils/
   leaflet-wrapper.ts    # Обертки для Leaflet (SSR-safe)
```

## Принципы FSD в данной структуре

1. **Entities**:
    - Бизнес-сущности (геоданные, маршруты)
    - Чистая бизнес-логика

2. **Features**:
    - Фильтрация и отображение данных
    - Сочетание логики и UI

3. **Widgets**:
    - Композиция фич
    - Управление состоянием

4. **Shared**:
    - Переиспользуемые ресурсы
    - Утилиты и API