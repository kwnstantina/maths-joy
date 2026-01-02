/**
 * Server-side i18n utilities for handling multilingual content
 */

export const SUPPORTED_LANGUAGES = ['el', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'el';

/**
 * Structure for localized content in database
 */
export interface LocalizedContent {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface Translations {
  el?: LocalizedContent;
  en?: LocalizedContent;
}

/**
 * Base type for translatable database entities
 */
export interface Translatable {
  title: string;
  description?: string | null;
  category?: string;
  tags?: string | string[];
  translation?: string | Translations | null;
  translations?: Translations | null;
}

/**
 * Parses translation field from database (handles both JSON string and object)
 */
function parseTranslation(translation: string | Translations | null | undefined): Translations | null {
  if (!translation) return null;

  if (typeof translation === 'string') {
    try {
      return JSON.parse(translation);
    } catch (error) {
      console.error('Failed to parse translation JSON:', error);
      return null;
    }
  }

  return translation;
}

/**
 * Gets localized content for a single item
 * Returns the item with translated fields if available for the requested language
 */
export function getLocalizedContent<T extends Translatable>(
  item: T,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): T {
  // If Greek (default) or no translation exists, return original
  if (language === 'el') {
    return item;
  }

  // Try to get translation from either 'translations' or 'translation' field
  const translations = item.translations || parseTranslation(item.translation);

  if (!translations) {
    return item;
  }

  const translation = translations[language];
  if (!translation) {
    return item;
  }

  // Merge translated fields with original item
  return {
    ...item,
    title: translation.title || item.title,
    description: translation.description || item.description,
    category: translation.category || item.category,
    tags: translation.tags?.join(',') || item.tags,
  };
}

/**
 * Gets localized content for a list of items
 */
export function getLocalizedList<T extends Translatable>(
  items: T[],
  language: SupportedLanguage = DEFAULT_LANGUAGE
): T[] {
  if (language === 'el') {
    return items;
  }
  return items.map(item => getLocalizedContent(item, language));
}

/**
 * Validates if a language code is supported
 */
export function isValidLanguage(lang: string | null | undefined): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Gets the language from a request, with fallback to default
 */
export function getLanguageFromRequest(searchParams: URLSearchParams): SupportedLanguage {
  const lang = searchParams.get('lang');
  return isValidLanguage(lang) ? lang : DEFAULT_LANGUAGE;
}

/**
 * Creates a translation object for saving to database
 */
export function createTranslation(
  greekContent: LocalizedContent,
  englishContent?: LocalizedContent
): Translations {
  const translations: Translations = {
    el: greekContent,
  };

  if (englishContent) {
    translations.en = englishContent;
  }

  return translations;
}

/**
 * Converts translation object to JSON string for database storage
 * Use this when storing in the legacy 'translation' Json field
 */
export function serializeTranslation(translations: Translations): string {
  return JSON.stringify(translations);
}
