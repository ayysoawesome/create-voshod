import prompts from 'prompts';
import {
  CLIOptions,
  type Framework,
} from '@/domain/generation/index.js';
import {
  ARCHITECTURE_CHOICES,
  FORMATTER_CHOICES,
  FRAMEWORK_CHOICES,
  getAdditionalLibraryChoices,
  getAsyncStateChoices,
  getClientStateChoices,
  getRouterChoices,
  HTTP_CLIENT_CHOICES,
  STYLING_CHOICES,
  VALIDATION_LIBRARY_CHOICES,
} from './promptChoices.js';

/**
 * @param value Unknown runtime value.
 * @returns True when value is an array.
 */
function isArrayOfUnknown(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Parses fixture payload used by prompt injection in tests/smoke scripts.
 *
 * @param rawValue JSON-encoded array of prompt answers.
 * @returns Parsed answer sequence.
 * @throws {Error} When payload is not a JSON array.
 */
function parseInjectedAnswers(rawValue: string): unknown[] {
  const parsed: unknown = JSON.parse(rawValue);
  if (!isArrayOfUnknown(parsed)) {
    throw new Error('Prompt fixture must be a JSON array.');
  }
  return parsed;
}

/**
 * Interactive prompt service for collecting CLI options.
 */
export class PromptService {
  /**
   * Collects options from interactive prompts.
   * Also supports injected answers via `VOSHOD_PROMPT_FIXTURE_JSON`.
   *
   * @returns User-selected CLI options.
   */
  async askOptions(): Promise<CLIOptions> {
    const injectedFixture = process.env.VOSHOD_PROMPT_FIXTURE_JSON;
    if (typeof injectedFixture === 'string' && injectedFixture.length > 0) {
      prompts.inject(parseInjectedAnswers(injectedFixture));
    }

    const first = await prompts([
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        validate: (value: string) =>
          value.trim().length > 0 ? true : 'Project name is required.',
      },
      {
        type: 'select',
        name: 'framework',
        message: 'Framework',
        choices: FRAMEWORK_CHOICES,
      },
    ]);

    const framework = first.framework as Framework;

    const second = await prompts([
      {
        type: 'select',
        name: 'architecture',
        message: 'Architecture',
        choices: ARCHITECTURE_CHOICES,
      },
      {
        type: 'select',
        name: 'httpClient',
        message: 'HTTP client',
        choices: HTTP_CLIENT_CHOICES,
      },
      {
        type: 'select',
        name: 'validationLibrary',
        message: 'Validation library',
        choices: VALIDATION_LIBRARY_CHOICES,
      },
      {
        type: 'select',
        name: 'styling',
        message: 'Styling solution',
        choices: STYLING_CHOICES,
      },
      {
        type: 'select',
        name: 'formatter',
        message: 'Formatter',
        choices: FORMATTER_CHOICES,
        initial: 0,
      },
      {
        type: 'select',
        name: 'router',
        message: 'Router library',
        choices: getRouterChoices(framework),
      },
      {
        type: 'select',
        name: 'clientState',
        message: 'Client state manager',
        choices: getClientStateChoices(framework),
      },
      {
        type: 'select',
        name: 'asyncState',
        message: 'Async / server state (data fetching)',
        choices: getAsyncStateChoices(framework),
      },
      {
        type: 'multiselect',
        name: 'libs',
        message: 'Additional libraries',
        choices: getAdditionalLibraryChoices(framework),
      },
    ]);

    const libsRaw = second.libs;
    const libs = Array.isArray(libsRaw) ? libsRaw : [];

    return {
      projectName: String(first.projectName ?? '').trim(),
      framework,
      architecture: second.architecture as CLIOptions['architecture'],
      httpClient: second.httpClient as CLIOptions['httpClient'],
      validationLibrary: second.validationLibrary as CLIOptions['validationLibrary'],
      styling: second.styling as CLIOptions['styling'],
      formatter: second.formatter as CLIOptions['formatter'],
      router: second.router as CLIOptions['router'],
      clientState: second.clientState as CLIOptions['clientState'],
      asyncState: second.asyncState as CLIOptions['asyncState'],
      libs: libs as CLIOptions['libs'],
    };
  }
}
