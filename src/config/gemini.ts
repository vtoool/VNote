/**
 * Default Gemini API key used by the in-app tester.
 *
 * The tester runs exclusively against the live Gemini API and no longer asks
 * users to supply credentials manually, so we bundle a throwaway key directly
 * in the client. Anything shipped to the browser is inherently public—treat
 * this credential as temporary and rotate it regularly if you fork the project.
 */
export const DEFAULT_GEMINI_API_KEY = "AIzaSyCNhEJt6wbopVGULGiuYmbPsXWh9DSBHOc";
