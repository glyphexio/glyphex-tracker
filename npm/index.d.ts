export interface GlyphexPayload {
  [key: string]: unknown;
}

export interface InitOptions {
  /** Your site ID from Glyphex settings. */
  siteId: string;
  /** Defaults to https://glyphex.io. */
  host?: string;
  /** Set false to send pageviews yourself with pageview(). */
  autoTrack?: boolean;
  /** Strip query strings from recorded referrers and 404 URLs. */
  excludeSearch?: boolean;
  /** Label attached to every hit, max 50 characters. */
  tag?: string;
  /** Rewrite a hit, or return false to drop it. */
  beforeSend?: (type: string, payload: GlyphexPayload) => GlyphexPayload | false | null | undefined;
}

export function init(options: InitOptions): void;
export function track(name: string, properties?: Record<string, string | number | boolean>): void;
export function pageview(path?: string): void;
export function trackNotFound(url?: string): void;
