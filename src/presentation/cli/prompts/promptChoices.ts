import {
  ALL_ADDITIONAL_LIBRARY_IDS,
  isAdditionalLibSupportedForFramework,
} from '@/domain/generation/frameworkCapabilityCatalog.js';
import {
  AdditionalLibrary,
  Architecture,
  AsyncState,
  ClientState,
  Formatter,
  Framework,
  HttpClient,
  RouterLibrary,
  Styling,
  ValidationLibrary,
} from '@/domain/generation/index.js';

/**
 * Generic prompt choice option shape.
 */
type Choice<TValue> = {
  readonly title: string;
  readonly value: TValue;
};

/**
 * Framework choices for CLI prompt.
 */
export const FRAMEWORK_CHOICES: Choice<Framework>[] = [
  { title: 'React', value: 'react' },
  { title: 'Vue (Vite)', value: 'vue' },
];

/**
 * Architecture mode choices for CLI prompt.
 */
export const ARCHITECTURE_CHOICES: Choice<Architecture>[] = [
  { title: 'Simple', value: 'simple' },
  { title: 'FSD', value: 'fsd' },
];

/**
 * HTTP transport for generated API stack (`null` = Fetch wrapper, no `axios` dependency).
 */
export const HTTP_CLIENT_CHOICES: Choice<HttpClient>[] = [
  { title: 'Axios', value: 'axios' },
  { title: 'ofetch', value: 'ofetch' },
  { title: 'Fetch API', value: null },
];

/**
 * Styling choices for CLI prompt.
 */
export const STYLING_CHOICES: Choice<Styling>[] = [
  { title: 'TailwindCSS', value: 'tailwind' },
  { title: 'Regular css', value: 'css' },
];

/**
 * Formatter choices for CLI prompt.
 */
export const FORMATTER_CHOICES: Choice<Formatter>[] = [
  { title: 'Prettier', value: 'prettier' },
  { title: 'Biome', value: 'biome' },
];

/**
 * Validation library for API responses and env config.
 */
export const VALIDATION_LIBRARY_CHOICES: Choice<ValidationLibrary>[] = [
  { title: 'Zod', value: 'zod' },
  { title: 'None', value: null },
];

const ADDITIONAL_LIB_TITLES: Record<AdditionalLibrary, string> = {
  'tanstack-table': 'TanStack Table',
  'tanstack-react-form': 'TanStack Form',
  'react-hook-form': 'React Hook Form',
};

/**
 * Router choices for the selected UI framework.
 */
export function getRouterChoices(framework: Framework): Choice<RouterLibrary>[] {
  if (framework === 'vue') {
    return [
      { title: 'Vue Router', value: 'vue-router' },
      { title: 'No library', value: null },
    ];
  }
  return [
    { title: 'React Router', value: 'react-router-dom' },
    { title: 'Tanstack Router', value: '@tanstack/react-router' },
    { title: 'No library', value: null },
  ];
}

/**
 * Client-side global state library choices for the selected framework.
 */
export function getClientStateChoices(framework: Framework): Choice<ClientState>[] {
  if (framework === 'vue') {
    return [
      { title: 'Pinia', value: 'pinia' },
      { title: 'None', value: null },
    ];
  }
  return [
    { title: 'Zustand', value: 'zustand' },
    { title: 'None', value: null },
  ];
}

/**
 * Async / server-side data layer choices for the selected framework.
 */
export function getAsyncStateChoices(framework: Framework): Choice<AsyncState>[] {
  if (framework === 'vue') {
    return [
      { title: 'TanStack Query (@tanstack/vue-query)', value: 'tanstack-query' },
      { title: 'Pinia Colada (@pinia/colada)', value: 'pinia-colada' },
      { title: 'None', value: null },
    ];
  }
  return [
    { title: 'TanStack Query (@tanstack/react-query)', value: 'tanstack-query' },
    { title: 'None', value: null },
  ];
}

/**
 * Additional-library multiselect choices for the selected UI framework.
 */
export function getAdditionalLibraryChoices(
  framework: Framework,
): Choice<AdditionalLibrary>[] {
  return ALL_ADDITIONAL_LIBRARY_IDS.filter((id) =>
    isAdditionalLibSupportedForFramework(id, framework),
  ).map((value) => ({
    title: ADDITIONAL_LIB_TITLES[value],
    value,
  }));
}
