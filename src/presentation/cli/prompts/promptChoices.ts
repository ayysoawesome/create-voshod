import {
  AdditionalLibrary,
  Architecture,
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
 *
 * Temporarily only React: other `Framework` values exist in domain types for future strategies.
 */
export const FRAMEWORK_CHOICES: Choice<Framework>[] = [
  { title: 'React', value: 'react' },
  // { title: "Vue (Vite)", value: "vue" },
  // { title: "Next.js", value: "nextjs" },
  // { title: "TanStack Start", value: "tanstack-start" },
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
 * Router-library choices for CLI prompt.
 */
export const ROUTER_CHOICES: Choice<RouterLibrary>[] = [
  { title: 'React Router', value: 'react-router-dom' },
  { title: 'Tanstack Router', value: '@tanstack/react-router' },
  { title: 'No library', value: null },
];

/**
 * Validation library for API responses and env config.
 */
export const VALIDATION_LIBRARY_CHOICES: Choice<ValidationLibrary>[] = [
  { title: 'Zod', value: 'zod' },
  { title: 'None', value: null },
];

/**
 * Additional-library choices for CLI prompt.
 */
export const ADDITIONAL_LIBRARY_CHOICES: Choice<AdditionalLibrary>[] = [
  { title: 'Zustand', value: 'zustand' },
  { title: 'Tanstack Table', value: '@tanstack/react-table' },
  { title: 'React Hook Form', value: 'react-hook-form' },
];
