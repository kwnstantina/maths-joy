/**
 * Server-side feature flags, read from environment variables.
 *
 * Flags are resolved per request (not cached at module load) so a value can be
 * changed on the hosting platform without a rebuild.
 */

const TRUTHY = ["1", "true", "on", "yes", "enabled"];
const FALSY = ["0", "false", "off", "no", "disabled"];

/**
 * Reads a boolean env var. Unset or unrecognised values fall back to
 * `defaultValue`, so a typo never silently turns a feature off.
 */
function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;

  const normalized = raw.trim().toLowerCase();
  if (TRUTHY.includes(normalized)) return true;
  if (FALSY.includes(normalized)) return false;

  console.warn(
    `[featureFlags] ${name}="${raw}" is not a boolean — falling back to ${defaultValue}`
  );
  return defaultValue;
}

export interface FeatureFlags {
  /** Greg AI chat widget: renders in the UI and serves the /api/greg-ai routes. */
  gregAi: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  return {
    gregAi: envFlag("GREG_AI_ENABLED", true),
  };
}

export function isGregAiEnabled(): boolean {
  return getFeatureFlags().gregAi;
}
