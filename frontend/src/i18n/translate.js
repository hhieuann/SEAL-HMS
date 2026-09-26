import { messages } from './messages';
import { DEFAULT_LANGUAGE } from './languageContext';

const lookup = (lang, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages[lang]);

// Resolves a dotted key ("hero.recap") for the given language, falling back to
// Vietnamese and then to the key itself so a missing string is visible, not blank.
// `{name}` placeholders in string values are filled from `vars`.
export function translate(lang, key, vars) {
  let value = lookup(lang, key);
  if (value === undefined) value = lookup(DEFAULT_LANGUAGE, key);
  if (value === undefined) return key;
  if (typeof value !== 'string' || !vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

// Picks the right language out of a `{ vi, en }` field; plain strings pass through.
export function pickLocalized(value, lang) {
  if (value == null || typeof value !== 'object') return value;
  return value[lang] ?? value[DEFAULT_LANGUAGE];
}
