/**
 * Default Gemini API key used by the in-app tester.
 *
 * The string is intentionally empty so builds do not ship with credentials by default.
 * If you want to bundle a key for local testing, replace the empty string with your key.
 * Avoid using production secrets here because the key will end up in the built client bundle.
 */
export const DEFAULT_GEMINI_API_KEY = "";
