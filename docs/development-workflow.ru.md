# Development Workflow (RU)

Этот документ описывает, как безопасно и предсказуемо расширять `create-voshod`.

## 1) Карта архитектуры

- `domain`: базовые типы и контракты.
- `application`: оркестрация, стратегии, шаги генерации, контракты patch-сервисов.
- `infrastructure`: адаптеры процессов, файловой системы и codegen.
- `presentation`: CLI-промпты и сборка приложения.

Ключевые точки расширения:

- Модель опций: `src/domain/generation/ProjectOptions.ts`
- Варианты и вопросы в промптах: `src/presentation/cli/prompts/promptChoices.ts`, `src/presentation/cli/prompts/PromptService.ts`
- React-стратегия и общий поток генерации: `src/application/strategy/ReactFrameworkStrategy.ts`, `src/application/usecases/GenerateProjectUseCase.ts`
- Планирование зависимостей React: `src/application/react/dependency-planning/ReactDependencyPlanner.ts`
- Контракт patch-сервиса: `src/application/patches/IReactPatchService.ts`
- Профиль путей FSD/simple: `src/domain/generation/ReactLayoutProfile.ts`
- Политика зональных правок и ingest: `src/application/react/codegen/FileMutationPolicy.ts`, `scaffoldIngestPaths.ts`
- Редакторы toolchain (Vite ts-morph, merge tsconfig, HTML): `src/infrastructure/codegen/editors/`, вклады Vite: `src/infrastructure/codegen/vite/`
- Форматтер (Prettier vs Biome): `src/application/react/patches/toolchain/FormatterPatchService.ts`, после установки зависимостей — `src/application/steps/FormatGeneratedProjectStep.ts`, dev/prod в `ReactDependencyPlanner`
- Транспорт сгенерированного API: `src/application/react/patches/http/SharedApiPatchService.ts` и шаблоны в `src/application/react/patches/http/codegen/`

## 2) Добавление новой опции

Пример: добавить новую ось конфигурации, например `stateManager`.

1. Обновите типы в `src/domain/generation/ProjectOptions.ts`.
2. Добавьте варианты выбора в `src/presentation/cli/prompts/promptChoices.ts`.
3. Добавьте вопрос в `src/presentation/cli/prompts/PromptService.ts`.
4. Используйте новую опцию в логике генерации:
   - если это только зависимости -> `ReactDependencyPlanner`;
   - если это правки файлов/кода -> реализуйте или обновите patch-сервисы.
5. Зарегистрируйте новый patch-сервис в сборке CLI (`src/presentation/cli/app/CliApplication.ts`).
6. Добавьте или обновите тесты.
7. Прогоните валидационный pipeline (`npm run test`, `npm run build`). Smoke CLI и playground: [testing.ru.md](./testing.ru.md).

### Validation library (`validationLibrary`)

Опция `validationLibrary: "zod" | null` задаёт рантайм-валидацию для ответов API и env (`SharedApiPatchService`, `SharedConfigPatchService`). Пакет `zod` в `package.json` добавляется только при выборе Zod. Zod **не** задаётся через multiselect `libs` — только через эту опцию.

### HTTP-клиент (`httpClient`)

`httpClient: "axios" | "ofetch" | null` выбирает транспорт для сгенерированного слоя в `apiRoot` из `resolveReactLayoutProfile()` (`SharedApiPatchService`):

- **`axios`** — `axios.ts` и `baseService.ts`; `errorAdapter` учитывает форму ошибок Axios.
- **`ofetch`** — `baseService.ts` на ofetch (отдельного модуля клиента нет); prod-зависимость `ofetch`.
- **`null` (Fetch API)** — `httpClient.ts` (обёртка над `fetch`) и `baseService.ts`; без дополнительного HTTP-пакета.

`index.ts` реэкспортирует нужные точки входа в зависимости от режима (включая опционально TanStack Query и файлы валидации). Зависимости: `ReactDependencyPlanner` добавляет prod-зависимость только для `"axios"` или `"ofetch"`.

Подписи в промпте: `promptChoices.ts` (`HTTP_CLIENT_CHOICES`).

### Форматтер (`formatter`)

`formatter: "prettier" | "biome"` настраивает форматирование и скрипты в целевом приложении (`FormatterPatchService`, в `CliApplication` сразу после `ToolchainPatchService`):

- **Prettier** — в `package.json` скрипты `format` и `format:write` (`prettier --write .`), файл `.prettierrc`. `ReactDependencyPlanner` добавляет dev-зависимость `prettier`. Стандартный ESLint-стек шаблона Vite `react-ts` сохраняется.
- **Biome** — `biome.json`, скрипты `lint` (`biome check .`), `format` / `format:write` (`biome format` / `biome format --write .`), из scaffold-`package.json` убираются devDependencies ESLint, добавляется `@biomejs/biome`. `PruneViteReactTsScaffoldStep` удаляет `eslint.config.js` при выборе Biome.

После `InstallDependenciesStep` шаг `FormatGeneratedProjectStep` запускает в новом проекте `packageManager run format:write` с уже выбранным инструментом.

### Архитектура генерируемого дерева (`architecture`)

Опция `architecture: "simple" | "fsd"` задаётся через `resolveReactLayoutProfile()` и влияет на entry, стили, API и роутинг:

- **`fsd`**: вход `src/app/index.tsx`, стили `src/app/styles`, API `src/shared/api`, config `src/shared/config`, TanStack — дерево `src/app/router`, страницы в `src/pages/...`, импорты в целевом приложении с алиасом `@/*`.
- **`simple`**: плоское `src/` — вход `src/index.tsx`, стили `src/styles`, API `src/api`, config `src/config`, провайдеры `src/providers`, TanStack — колокейтед `src/router.tsx`, страницы всё равно в `src/pages/...`; пустые каталоги `assets`, `components`, `hooks`, `utils` сидируются через `.gitkeep` в `BaseReactFilesFactory`.

Порядок шагов React-стратегии: scaffold → compose (ingest + патчи) → план зависимостей → запись файлов → **`PruneViteReactTsScaffoldStep`** (удаление лишних файлов шаблона `react-ts` на диске; при Biome ещё удаляется `eslint.config.js`) → установка зависимостей → **`FormatGeneratedProjectStep`** (`format:write` в сгенерированном проекте).

Порядок patch-сервисов в `CliApplication`: toolchain → **`FormatterPatchService`** → стили → `SharedConfig` → `SharedApi` → `AppProviders` → роутеры.

Роутер-патчи **не** меняют entry и **не** импортируют глобальные стили.

После `ScaffoldBaseProjectStep` `ComposeCodeStep` через `IScaffoldFileReader` подтягивает с диска `vite.config.ts`, `tsconfig.app.json`, `index.html`, чтобы зональные патчи не затирали шаблон Vite.

### Политика файлов (zonal vs full)

- `vite.config.ts` — политика **zonal**; владелец: `ViteConfigEditor` и `applyViteContributions` в `ToolchainPatchService`.
- `tsconfig.app.json` — **zonal (paths)**; `mergeTsConfigAppPaths` в `ToolchainPatchService` (парсинг JSONC как у шаблона Vite).
- `index.html` — **zonal**; ingest и `IndexHtmlScriptWriter` в `ToolchainPatchService`.
- Корневой App: `App.tsx` (simple) или `src/app/App.tsx` (FSD) — **zonal (роутер)**; `AppProvidersPatchService` задаёт оболочку; роутер-патчи — `morphAppForTanstackRouter` и `morphAppForReactRouterDom`.

Константы: `ZONAL_ONLY_RELATIVE_PATHS`, `zonalAppComponentPath()` в `FileMutationPolicy.ts`. **Не** подменяйте эти файлы целиком из feature-патчей без согласования.

### Реестр full-replace (целиком одним патчем)

Пути, где генератор **намеренно** пишет файл целиком через `upsertFile` (один «владелец» на путь в рамках текущей архитектуры):

- **`FULL_REPLACE_OK_PREFIXES`** — префиксы: `src/pages/`, `src/shared/api/`, `src/shared/config/`, `src/api/`, `src/config/`, `src/app/router/`, `src/app/layouts/`, `src/providers/`, `src/app/providers/`, `src/styles/`, `src/app/styles/`, а также плоские каталоги simple (`src/assets/`, `src/components/`, `src/hooks/`, `src/utils/`) под `.gitkeep` и будущие файлы в тех же корнях.
- **`FULL_REPLACE_OK_EXACT_PATHS`** — точные пути: `src/router.tsx`, `src/shared/index.ts`, `src/index.tsx`, `src/app/index.tsx`.

Проверка: `isFullReplaceOkPath(relativePath, profile?)` — возвращает `false` для zonal-путей и для `profile.appComponentPath` (оболочка App + морф роутера). Путь вне реестра даёт `false`: при новом полностью генерируемом файле **добавьте** префикс или exact в `FileMutationPolicy.ts` и кратко укажите владельца в комментарии к константе.

### Добавление нового Vite-вклада

1. Реализуйте класс с интерфейсом `IViteConfigContribution` в `src/infrastructure/codegen/vite/contributions/`.
2. Добавьте экземпляр в массив `ORDERED_CONTRIBUTIONS` в `applyViteContributions.ts` (стабильный порядок: импорт `defineConfig` → React → Tailwind (по флагу) → алиасы).
3. Правки `vite.config.ts` только через `ViteConfigEditor` (идемпотентные `ensure*`); не вставляйте монолитный шаблон из других патчей.
4. Добавьте тест «до/после» (см. `ViteConfigEditor.test.ts`).

При добавлении UI проверяйте обе ветки (`RouterPatches.architecture.test.ts`, `PatchServices.test.ts`). Для роутер-тестов сначала применяйте `AppProvidersPatchService`, затем роутер-патч (как в реальном порядке в `CliApplication`).

## 3) Добавление новой библиотеки

Пример: добавить `react-i18next`.

1. Добавьте новое значение в `AdditionalLibrary` в `src/domain/generation/ProjectOptions.ts`.
2. Добавьте этот пункт в `ADDITIONAL_LIBRARY_CHOICES` в `src/presentation/cli/prompts/promptChoices.ts`.
3. Проверьте планирование зависимостей:
   - если библиотека устанавливается напрямую из выбранных `libs`, текущего planner уже достаточно;
   - если нужны связанные пакеты, добавьте условную логику в `ReactDependencyPlanner`.
4. Если библиотеке нужен runtime-код/файлы, реализуйте отдельный patch-сервис (обычно в `src/application/react/patches/libs`).
5. Экспортируйте сервис через локальные `index.ts` и подключите его в `CliApplication`.
6. Добавьте точечные тесты и прогоните валидацию.

## 4) Добавление генерируемого кода (workflow patch-сервисов)

Используйте контракт `IReactPatchService`:

- `supports(context)`: должен ли patch применяться для выбранных опций.
- `apply(context, composer)`: применяет изменения файлов/кода.

Рекомендуемая последовательность:

1. Создайте сервис в правильной доменной группе (`toolchain`, `config`, `providers`, `router`, `styling`, `http`, `libs`, `core`).
2. Делайте `supports` узким и детерминированным.
3. Старайтесь делать `apply` идемпотентным.
4. Экспортируйте через локальный `index.ts`.
5. Зарегистрируйте сервис в списке patch-сервисов в `CliApplication`.
6. Добавьте unit-тесты в `src/application/react/patches/PatchServices.test.ts`, в `src/application/react/patches/router/RouterPatches.architecture.test.ts` (ветки `architecture`) или рядом в целевых тестах.

## 5) Добавление нового framework

1. Убедитесь, что значение framework добавлено в тип `Framework` в `ProjectOptions.ts`.
2. Реализуйте `XFrameworkStrategy` в `src/application/strategy`.
3. Добавьте framework-специфичные base files, dependency planning и patch-сервисы.
4. Зарегистрируйте стратегию в сборке приложения (`src/presentation/cli/app/CliApplication.ts`).
5. Проверьте изменения тестами и минимум одним запуском smoke/playground.

## 6) Рекомендации Do / Don't

Делайте:

- Держите типы в `domain` как единственный источник правды.
- Предпочитайте маленькие, композиционные patch-сервисы.
- Сохраняйте текущий порядок runtime-шагов в strategy/use case.
- Соблюдайте стиль импортов проекта (`@/.../index.js` и явный `.js` в ESM-импортах).

Не делайте:

- Не переносите feature-логику в `domain`.
- Не обходите strategy/step-оркестрацию ad-hoc мутациями.
- Не делайте крупных рефакторингов, не связанных с требуемым поведением.

## 7) Валидационный pipeline

Минимальные проверки для каждого функционального изменения:

```bash
npm run test
npm run build
```

Ручные проверки CLI:

```bash
npm run test:cli:smoke
npm run test:cli:play
```

## 8) PR-чеклисты

### A) Новая опция

- [ ] Обновлены типы в `ProjectOptions`.
- [ ] Добавлены варианты/вопрос в prompt-слой.
- [ ] Добавлена логика planner и/или patch-сервисов.
- [ ] Подключены изменения в strategy/CLI composition.
- [ ] Добавлены/обновлены тесты.
- [ ] Выполнены test + build (+ smoke/playground при необходимости).

### B) Новая библиотека

- [ ] Добавлено значение в `AdditionalLibrary`.
- [ ] Добавлен вариант в prompt options.
- [ ] Добавлена логика планирования зависимостей (включая связанные пакеты, если нужны).
- [ ] Добавлен patch-сервис, если библиотеке нужен runtime-код/файлы.
- [ ] Обновлены экспорты и DI wiring.
- [ ] Пройден валидационный pipeline.

### C) Новый framework

- [ ] Добавлен/подтвержден тип framework и значение в prompt.
- [ ] Реализована новая framework strategy.
- [ ] Добавлены framework-специфичные factories/planners/patches.
- [ ] Стратегия зарегистрирована в app wiring.
- [ ] Добавлены тесты и проверен CLI flow.

