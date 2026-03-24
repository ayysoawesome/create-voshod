import prompts from 'prompts';
import { CLIOptions } from '@/domain/generation/index.js';
import {
  ADDITIONAL_LIBRARY_CHOICES,
  ARCHITECTURE_CHOICES,
  FRAMEWORK_CHOICES,
  HTTP_CLIENT_CHOICES,
  ROUTER_CHOICES,
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

    return prompts<keyof CLIOptions>([
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
      },
      {
        type: 'select',
        name: 'framework',
        message: 'Select framework (more frameworks will be supported later)',
        choices: FRAMEWORK_CHOICES,
      },
      {
        type: 'select',
        name: 'architecture',
        message: 'Select architecture',
        choices: ARCHITECTURE_CHOICES,
      },
      {
        type: 'select',
        name: 'httpClient',
        message: 'Select HTTP client',
        choices: HTTP_CLIENT_CHOICES,
      },
      {
        type: 'select',
        name: 'validationLibrary',
        message: 'Validation library (API / env)',
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
        name: 'router',
        message: 'Choose router library',
        choices: ROUTER_CHOICES,
      },
      {
        type: 'confirm',
        name: 'tanstackQuery',
        message: 'Use TanStack Query (@tanstack/react-query)?',
        initial: true,
      },
      {
        type: 'multiselect',
        name: 'libs',
        message: 'Additional libraries',
        choices: ADDITIONAL_LIBRARY_CHOICES,
      },
    ]);
  }
}
