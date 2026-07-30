import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  ACTIVE_AD_PLATFORM,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SLOTS,
  ADSTERRA_SLOTS,
  PROPELLER_SLOTS,
  YANDEX_SLOTS,
  getAdSlot,
  type AdPlatform,
} from '@/lib/adConfig';

export type AdPlacement = 'discover' | 'roulette' | 'live' | 'chats' | 'interstitial';

interface AdBannerProps {
  placement?: AdPlacement;
  onClose?: () => void;
}

// ── Real AdSense unit ─────────────────────────────────────────
function AdSenseUnit({ slotId, format, width, height }: { slotId: string; format: string; width?: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div ref={ref} className="overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: width ? `${width}px` : '100%', height: height ? `${height}px` : 'auto' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={format === 'banner' ? 'horizontal' : 'rectangle'}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ── AdSterra unit ─────────────────────────────────────────────
function AdSterraUnit({ slotId }: { slotId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = `//pl${slotId}.profitableratecpm.com/${slotId}/invoke.js`;
    ref.current.appendChild(script);
  }, [slotId]);
  return <div ref={ref} id={`adsterra-${slotId}`} />;
}

// ── PropellerAds unit ────────────────────────────────────────
function PropellerUnit({ slotId }: { slotId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://oupoafautor.com/${slotId}/invoke.js`;
    ref.current.appendChild(script);
  }, [slotId]);
  return <div ref={ref} id={`propeller-${slotId}`} />;
}

// ── Yandex Direct unit ───────────────────────────────────────
function YandexUnit({ slotId }: { slotId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement('script');
    script.src = 'https://yandex.ru/ads/system/context.js';
    script.async = true;
    ref.current.appendChild(script);
    
    // Initialize Yandex context after script loads
    script.onload = () => {
      const contextScript = document.createElement('script');
      contextScript.text = `
        window.yaContextCb = window.yaContextCb || [];
        window.yaContextCb.push(() => {
          Ya.Context.AdvManager.render({
            blockId: '${slotId}',
            renderTo: 'yandex-${slotId}'
          });
        });
      `;
      ref.current.appendChild(contextScript);
    };
  }, [slotId]);
  return <div ref={ref} id={`yandex-${slotId}`} />;
}

// ── Mock/fallback ads (used until publisher IDs are set) ──────
const mockStripAds = [
  { text: '☕ Best Coffee in Warsaw — Order Now', bg: 'from-amber-900/80 to-amber-800/60', cta: 'Order' },
  { text: '🎵 Spotify Premium — 3 Months Free', bg: 'from-emerald-900/80 to-emerald-800/60', cta: 'Claim' },
  { text: '📱 Latest Smartphones — Up to 30% Off', bg: 'from-blue-900/80 to-blue-800/60', cta: 'Shop' },
  { text: '🏋️ Gym Membership — First Month Free', bg: 'from-purple-900/80 to-purple-800/60', cta: 'Join' },
  { text: '🍕 Bolt Food — 20% off your first order', bg: 'from-orange-900/80 to-orange-800/60', cta: 'Order' },
  { text: '✈️ Ryanair — Fly from 9 EUR this week', bg: 'from-sky-900/80 to-sky-800/60', cta: 'Book' },
];
const mockCardAds = [
  { emoji: '🚀', title: 'Boost your profile', desc: 'Get 10× more views today', cta: 'Boost now', bg: 'from-primary/20 to-accent/10', border: 'border-primary/30' },
  { emoji: '🎮', title: 'Xbox Game Pass', desc: '3 months for just 4 PLN', cta: 'Get it', bg: 'from-emerald-900/40 to-emerald-800/20', border: 'border-emerald-500/30' },
  { emoji: '💳', title: 'Revolut Metal — Free month', desc: 'Cashback on every purchase', cta: 'Open account', bg: 'from-blue-900/40 to-blue-800/20', border: 'border-blue-500/30' },
];
const mockInterstitialAds = [
  { emoji: '🔥', title: 'Remove all ads forever', desc: 'Support Spark Connect → Brak reklam na zawsze.', cta: 'Support us ❤️', isDonate: true },
  { emoji: '🛒', title: 'Zalando — Summer Sale', desc: 'Up to 50% off fashion. Free delivery over 200 PLN.', cta: 'Shop now', isDonate: false },
  { emoji: '🍔', title: 'Pyszne.pl — 30% OFF', desc: 'Order your favourite food. Free delivery on first 3 orders.', cta: 'Order now', isDonate: false },
];

function MockStripAd({ onDismiss }: { onDismiss: () => void }) {
  const [idx] = useState(() => Math.floor(Math.random() * mockStripAds.length));
  const ad = mockStripAds[idx];
  return (
    <div className={`w-full bg-gradient-to-r ${ad.bg} border border-border/50 rounded-xl px-3 py-2.5 flex items-center justify-between`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 border border-border/40 rounded px-1 py-0.5">AD</span>
        <p className="text-xs text-foreground/70 truncate">{ad.text}</p>
      </div>
      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        <button className="text-xs text-primary font-medium px-2 py-0.5 glass rounded-lg flex items-center gap-1">
          {ad.cta} <ExternalLink className="w-2.5 h-2.5" />
        </button>
        <button onClick={onDismiss} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function MockCardAd({ onDismiss }: { onDismiss: () => void }) {
  const [idx] = useState(() => Math.floor(Math.random() * mockCardAds.length));
  const ad = mockCardAds[idx];
  return (
    <div className={`w-full bg-gradient-to-r ${ad.bg} border ${ad.border} rounded-2xl px-4 py-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{ad.emoji}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] text-muted-foreground/50 border border-border/30 rounded px-1">AD</span>
            <p className="text-sm font-semibold text-foreground truncate">{ad.title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{ad.desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <button className="text-xs gradient-fire text-primary-foreground px-3 py-1.5 rounded-xl font-semibold">{ad.cta}</button>
        <button onClick={onDismiss} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function MockInterstitialAd({ onDismiss }: { onDismiss: () => void }) {
  const [idx] = useState(() => Math.floor(Math.random() * mockInterstitialAds.length));
  const [countdown, setCountdown] = useState(5);
  const ad = mockInterstitialAds[idx];

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
      <div className="absolute top-6 right-6">
        {countdown > 0
          ? <div className="glass px-3 py-1.5 rounded-full text-sm text-muted-foreground">Skip in {countdown}s</div>
          : <button onClick={onDismiss} className="glass px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Skip</button>
        }
      </div>
      <div className="text-6xl mb-6">{ad.emoji}</div>
      <div className="text-[10px] text-muted-foreground/40 border border-border/30 rounded px-2 py-0.5 mb-4 uppercase tracking-wider">Advertisement</div>
      <h2 className="text-2xl font-bold mb-3">{ad.title}</h2>
      <p className="text-muted-foreground mb-8 max-w-xs">{ad.desc}</p>
      <button className={`w-full max-w-xs py-4 rounded-2xl font-bold text-lg mb-4 gradient-fire text-primary-foreground ${ad.isDonate ? 'glow-red' : ''}`}>
        {ad.cta}
      </button>
      <button onClick={onDismiss} disabled={countdown > 0} className="text-sm text-muted-foreground/60 disabled:opacity-30">
        {ad.isDonate ? 'or continue to app' : 'Advertisement'}
      </button>
    </motion.div>
  );
}

// ── Real ad renderer ──────────────────────────────────────────
function RealAdUnit({ placement, format }: { placement: string; format: 'strip' | 'card' | 'interstitial' }) {
  const slot = getAdSlot(format === 'interstitial' ? 'interstitial' : `${placement}_${format === 'strip' ? 'strip' : 'card'}`);

  switch (ACTIVE_AD_PLATFORM) {
    case 'adsense':
      return <AdSenseUnit slotId={slot.slotId} format={slot.format} width={slot.width} height={slot.height} />;
    case 'adsterra':
      return <AdSterraUnit slotId={slot.slotId} />;
    case 'propellerads':
      return <PropellerUnit slotId={slot.slotId} />;
    case 'yandex':
      return <YandexUnit slotId={slot.slotId} />;
    default:
      return null;
  }
}

// A slot with a still-unfilled "YOUR_..." placeholder ID would inject a
// script pointing at a nonexistent host (e.g. //plYOUR_BANNER_ID...) --
// broken and blank, not just unmonetized. Fall back to the mock ad
// instead so the UI never shows dead space, until real zone IDs are set.
function isPlaceholderSlot(slotId: string): boolean {
  return !slotId || slotId.startsWith('YOUR_');
}

// ── Main export ───────────────────────────────────────────────
export default function AdBanner({ placement = 'discover', onClose }: AdBannerProps) {
  const { currentUser } = useAppStore();
  const [dismissed, setDismissed] = useState(false);

  // Donors never see ads
  if (currentUser?.donorBadge || dismissed) return null;

  const handleDismiss = () => { setDismissed(true); onClose?.(); };
  const slotKey = placement === 'interstitial' ? 'interstitial' : `${placement}_${placement === 'live' || placement === 'chats' ? 'card' : 'strip'}`;
  const isMock = ACTIVE_AD_PLATFORM === 'mock' || isPlaceholderSlot(getAdSlot(slotKey).slotId);

  if (placement === 'interstitial') {
    return (
      <AnimatePresence>
        {!dismissed && (
          isMock
            ? <MockInterstitialAd onDismiss={handleDismiss} />
            : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-6">
                <div className="absolute top-6 right-6">
                  <button onClick={handleDismiss} className="glass px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Close
                  </button>
                </div>
                <RealAdUnit placement={placement} format="interstitial" />
              </motion.div>
            )
        )}
      </AnimatePresence>
    );
  }

  const isCard = placement === 'live' || placement === 'chats';

  return isMock
    ? (isCard ? <MockCardAd onDismiss={handleDismiss} /> : <MockStripAd onDismiss={handleDismiss} />)
    : <RealAdUnit placement={placement} format={isCard ? 'card' : 'strip'} />;
}
