/**
 * Server-side i18n utilities for handling multilingual content
 */

import {
  Category,
  Category_En,
  TAGS,
  TAGS_En,
  Type,
  Type_En,
} from "../../services/models/models";

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
  searchableTitle?: string;
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
  level?: string | null;
  type?: string | null;
  searchableTitle?: string;
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

type TermPair = { el: string; en: string };

type Vocabulary = { byId: Record<number, { name: string }> };

/**
 * Fixed vocabulary (categories, levels, types, legacy book slugs) stored in the
 * DB as plain strings. Admins pick these from dropdowns, so they never get a
 * per-row translation — we translate them here instead.
 */
const TERMS: TermPair[] = [
  ...pairVocabulary(Category, Category_En),
  ...pairVocabulary(TAGS, TAGS_En),
  ...pairVocabulary(Type, Type_En),
  { el: "Πολλαπλής επιλογής", en: "Multiple Choice" },
  { el: "Λύκειο", en: "High School" },
  { el: "Ανάλυση", en: "Calculus" },
  { el: "Πολυώνυμα", en: "Polynomials" },
  { el: "Εξισώσεις", en: "Equations" },
];

/** Aliases that resolve to a TERMS entry (legacy slugs, spelling variants). */
const TERM_ALIASES: Record<string, string> = {
  "a-λυκείου": "Α-Λυκείου", // Latin "A"
  highschool: "Λύκειο",
  lyceum: "Λύκειο",
  calculus: "Ανάλυση",
  derivatives: "Παράγωγοι",
  integrals: "Ολοκληρώματα",
  algebra: "Άλγεβρα",
  geometry: "Γεωμετρία",
  functions: "Συναρτήσεις",
  limits: "Όρια",
  polynomials: "Πολυώνυμα",
  equations: "Εξισώσεις",
};

function pairVocabulary(el: Vocabulary, en: Vocabulary): TermPair[] {
  return Object.entries(el.byId)
    .map(([id, term]) => ({ el: term.name, en: en.byId[Number(id)]?.name ?? "" }))
    .filter((pair) => pair.el && pair.en);
}

const normalizeTerm = (value: string) => value.trim().toLocaleLowerCase("el");

const TERM_INDEX = new Map<string, TermPair>();
for (const pair of TERMS) {
  TERM_INDEX.set(normalizeTerm(pair.el), pair);
  TERM_INDEX.set(normalizeTerm(pair.en), pair);
}
for (const [alias, target] of Object.entries(TERM_ALIASES)) {
  const pair = TERM_INDEX.get(normalizeTerm(target));
  if (pair) TERM_INDEX.set(normalizeTerm(alias), pair);
}

/**
 * Translates a known vocabulary term (category, level, type, tag) into the
 * requested language. Unknown values are returned unchanged.
 */
export function translateTerm(value: string, language: SupportedLanguage): string {
  if (!value) return value;
  return TERM_INDEX.get(normalizeTerm(value))?.[language] ?? value;
}

function translateTags<T extends string | string[] | undefined>(
  tags: T,
  language: SupportedLanguage
): T {
  if (Array.isArray(tags)) {
    return tags.map((tag) => translateTerm(tag, language)) as T;
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => translateTerm(tag.trim(), language))
      .join(", ") as T;
  }
  return tags;
}

/**
 * Gets localized content for a single item
 * Returns the item with translated fields if available for the requested language.
 * Per-row `translation` values win; vocabulary fields (category, tags, level,
 * type) fall back to the shared term dictionary.
 */
export function getLocalizedContent<T extends Translatable>(
  item: T,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): T {
  // Try to get translation from either 'translations' or 'translation' field
  const translations = item.translations || parseTranslation(item.translation);
  const translation = translations?.[language];

  const translatedTags = Array.isArray(translation?.tags)
    ? translation.tags
    : typeof (translation?.tags as unknown) === "string"
      ? (translation?.tags as unknown as string).split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;

  const localized: T = {
    ...item,
    title: translation?.title || item.title,
    description: translation?.description || item.description,
    category: translation?.category || (item.category && translateTerm(item.category, language)),
    tags: translatedTags ?? translateTags(item.tags, language),
  };

  if (item.level) localized.level = translateTerm(item.level, language);
  if (item.type) localized.type = translateTerm(item.type, language);
  if (item.searchableTitle !== undefined) {
    localized.searchableTitle = translation?.searchableTitle || item.searchableTitle;
  }

  return localized;
}

/**
 * Gets localized content for a list of items
 */
export function getLocalizedList<T extends Translatable>(
  items: T[],
  language: SupportedLanguage = DEFAULT_LANGUAGE
): T[] {
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
