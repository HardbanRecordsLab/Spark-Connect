// ============================================================
// Spark Connect — Multi-Platform Ad Configuration
// ============================================================
// Replace PLACEHOLDER values with your real publisher IDs.
// Each platform can be toggled on/off independently.
// Donors (donorBadge=true) never see any ads.
// ============================================================

export type AdPlatform = 'adsense' | 'adsterra' | 'propellerads' | 'yandex' | 'mock';

export interface AdSlot {
  platform: AdPlatform;
  slotId: string;
  format: 'banner' | 'rectangle' | 'interstitial';
  width?: number;
  height?: number;
}

// ── Active platform ───────────────────────────────────────────
// Change this to switch which ad network is active globally.
export const ACTIVE_AD_PLATFORM: AdPlatform = 'mock'; // → swap to 'adsense', 'adsterra', etc.

// ── Google AdSense ────────────────────────────────────────────
export const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'; // ← paste your ID here
export const ADSENSE_SLOTS: Record<string, AdSlot> = {
  discover_strip:   { platform: 'adsense', slotId: '1234567890', format: 'banner',      width: 320, height: 50  },
  chats_card:       { platform: 'adsense', slotId: '1234567891', format: 'rectangle',   width: 300, height: 100 },
  live_card:        { platform: 'adsense', slotId: '1234567892', format: 'rectangle',   width: 300, height: 100 },
  roulette_strip:   { platform: 'adsense', slotId: '1234567893', format: 'banner',      width: 320, height: 50  },
  interstitial:     { platform: 'adsense', slotId: '1234567894', format: 'interstitial' },
};

// ── AdSterra ─────────────────────────────────────────────────
export const ADSTERRA_KEY = 'YOUR_ADSTERRA_KEY'; // ← paste your key
export const ADSTERRA_SLOTS: Record<string, AdSlot> = {
  discover_strip:   { platform: 'adsterra', slotId: 'YOUR_BANNER_ID',       format: 'banner',    width: 320, height: 50  },
  chats_card:       { platform: 'adsterra', slotId: 'YOUR_RECTANGLE_ID',    format: 'rectangle', width: 300, height: 100 },
  interstitial:     { platform: 'adsterra', slotId: 'YOUR_INTERSTITIAL_ID', format: 'interstitial' },
};

// ── PropellerAds ──────────────────────────────────────────────
export const PROPELLER_ZONE_ID = 'YOUR_PROPELLER_ZONE'; // ← paste your zone
export const PROPELLER_SLOTS: Record<string, AdSlot> = {
  discover_strip:   { platform: 'propellerads', slotId: 'YOUR_ZONE_1', format: 'banner',    width: 320, height: 50  },
  roulette_strip:   { platform: 'propellerads', slotId: 'YOUR_ZONE_2', format: 'banner',    width: 320, height: 50  },
  interstitial:     { platform: 'propellerads', slotId: 'YOUR_ZONE_3', format: 'interstitial' },
};

// ── Yandex Direct (RSY) ───────────────────────────────────────
export const YANDEX_PARTNER_ID = 'YOUR_YANDEX_PARTNER'; // ← paste your ID
export const YANDEX_SLOTS: Record<string, AdSlot> = {
  discover_strip:   { platform: 'yandex', slotId: 'R-A-XXXXXXX-1', format: 'banner',    width: 320, height: 50  },
  chats_card:       { platform: 'yandex', slotId: 'R-A-XXXXXXX-2', format: 'rectangle', width: 300, height: 100 },
};

// ── Helper: get slot config for current platform ──────────────
export function getAdSlot(placement: string): AdSlot {
  switch (ACTIVE_AD_PLATFORM) {
    case 'adsense':      return ADSENSE_SLOTS[placement]      || ADSENSE_SLOTS['discover_strip'];
    case 'adsterra':     return ADSTERRA_SLOTS[placement]     || ADSTERRA_SLOTS['discover_strip'];
    case 'propellerads': return PROPELLER_SLOTS[placement]    || PROPELLER_SLOTS['discover_strip'];
    case 'yandex':       return YANDEX_SLOTS[placement]       || YANDEX_SLOTS['discover_strip'];
    default:             return { platform: 'mock', slotId: placement, format: 'banner' };
  }
}
