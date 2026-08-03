// ============================================================
// Spark Connect — Multi-Platform Ad Configuration
// ============================================================
// Replace PLACEHOLDER values with your real publisher IDs.
// Each platform can be toggled on/off independently.
// Donors (donorBadge=true) never see any ads.
// ============================================================

export type AdPlatform = 'adsense' | 'adsterra' | 'propellerads' | 'yandex' | 'exoclick' | 'mock';

export interface AdSlot {
  platform: AdPlatform;
  slotId: string;
  format: 'banner' | 'rectangle' | 'interstitial';
  width?: number;
  height?: number;
  className?: string; // ExoClick: each zone ships its own unique <ins> class
}

// ── Active platform ───────────────────────────────────────────
// Change this to switch which ad network is active globally.
// ExoClick is the leader for adult/dating traffic specifically (see
// audit) and is the only platform with a real, non-placeholder zone
// ID configured below.
export const ACTIVE_AD_PLATFORM: AdPlatform = 'exoclick';

// ── Google AdSense ────────────────────────────────────────────
// NIE UŻYWAJ na tej apce: AdSense zakazuje treści dla dorosłych 18+ w
// swoich zasadach programu — aktywacja tej platformy na Spark Connect
// grozi trwałym banem konta AdSense (i powiązanych usług Google).
// Zostaw ACTIVE_AD_PLATFORM na 'adsterra' (lub innej sieci akceptującej
// adult content) i nie wypełniaj poniższego prawdziwym Publisher ID.
export const ADSENSE_PUBLISHER_ID = 'ca-pub-PLACEHOLDER-DO-NOT-USE-ADULT-CONTENT';
export const ADSENSE_SLOTS: Record<string, AdSlot> = {
  discover_strip:   { platform: 'adsense', slotId: '9458765432109876', format: 'banner',      width: 320, height: 50  },
  chats_card:       { platform: 'adsense', slotId: '9458765432109877', format: 'rectangle',   width: 300, height: 100 },
  live_card:        { platform: 'adsense', slotId: '9458765432109878', format: 'rectangle',   width: 300, height: 100 },
  roulette_strip:   { platform: 'adsense', slotId: '9458765432109879', format: 'banner',      width: 320, height: 50  },
  interstitial:     { platform: 'adsense', slotId: '9458765432109880', format: 'interstitial' },
};

// ── ExoClick ─────────────────────────────────────────────────
// Real zones only -- each one is created individually in the ExoClick
// dashboard (Ad format + size), so unlike the other platforms this map
// only has entries for placements that actually have a zone yet.
// getAdSlot() below falls back to an empty slotId (not another
// placement's zone) for anything not listed here, so a still-unconfigured
// placement correctly stays on the mock ad instead of showing a
// wrong-sized real ad borrowed from a different placement.
export const EXOCLICK_SLOTS: Record<string, AdSlot> = {
  discover_strip: { platform: 'exoclick', slotId: '5993372', className: 'eas6a97888e10', format: 'banner', width: 320, height: 50 },
};

// ── AdSterra ─────────────────────────────────────────────────
export const ADSTERRA_KEY = '5182b7f4b4521755690210440a0f4a83'; // ← Updated from Smartlink
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
    case 'exoclick':     return EXOCLICK_SLOTS[placement]     || { platform: 'exoclick', slotId: '', format: 'banner' };
    default:             return { platform: 'mock', slotId: placement, format: 'banner' };
  }
}
