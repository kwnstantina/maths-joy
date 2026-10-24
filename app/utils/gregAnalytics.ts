/**
 * Time ranges for the Greg AI teacher dashboard. Shared by the page (range
 * buttons) and gregAnalytics.server.ts, so it can't live in a .server file.
 */
export const ANALYTICS_WINDOWS = [7, 30, 90] as const;
export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number];
