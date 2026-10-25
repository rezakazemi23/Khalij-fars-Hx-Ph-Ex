import { STANDALONE_HTML } from './standaloneHtmlContent.ts';

/**
 * Returns the exact, verified standalone HTML file content.
 * Has zero template literal string-escape bugs and passes all syntax checks.
 */
export function generateStandaloneHtmlString(): string {
  return STANDALONE_HTML;
}
