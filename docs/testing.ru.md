# Тестирование CLI (для контрибьюторов)

Команды ниже для **разработки репозитория**, не для пользователей опубликованного пакета.

## Юнит-тесты

```bash
npm run test
```

Проверка типов:

```bash
npx tsc --noEmit
```

## Локальная проверка перед публикацией

```bash
npm run test
npm run build
npm pack
```

## Smoke-проверка CLI

Проверяет, что CLI (из `src/cli.ts`) создаёт проект и что сгенерированное приложение собирается:

```bash
npm run test:cli:smoke
```

Поведение:

- Запуск CLI из `src/cli.ts` (отдельный шаг `tsup` для CLI в этом скрипте не обязателен).
- Временный проект в `.tmp/cli-smoke`.
- Ответы на промпты через фикстуру (`VOSHOD_PROMPT_FIXTURE_JSON`).
- `npm install` и `npm run build` в сгенерированном проекте.
- Удаление временной папки при успехе.

Флаги:

- Оставить проект: `npm run test:cli:smoke -- --keep`
- Имя каталога: `npm run test:cli:smoke -- --name my-smoke-project`

## Интерактивный playground

Полностью интерактивный запуск:

```bash
npm run test:cli:play
```

То же, затем **install + build**:

```bash
npm run test:cli:play:full
```

Рабочая область: `.tmp/cli-playground/<timestamp>`. После запуска скрипт спрашивает, удалить ли каталог.

## Фикстуры промптов

Для неинтерактивного режима можно задать `VOSHOD_PROMPT_FIXTURE_JSON` (JSON-массив ответов в порядке промптов). Пример — в `scripts/cli-smoke.ts`.

Подробнее по-английски: [testing.md](./testing.md).
