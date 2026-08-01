import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const COOKIE_CONSENT_KEY = 'spark-connect-cookie-consent';
export type CookieConsent = 'all' | 'necessary';

export function getCookieConsent(): CookieConsent | null {
  const v = localStorage.getItem(COOKIE_CONSENT_KEY);
  return v === 'all' || v === 'necessary' ? v : null;
}

export default function CookieConsentBanner() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState<CookieConsent | null>('necessary');

  useEffect(() => {
    setConsent(getCookieConsent());
  }, []);

  const choose = (value: CookieConsent) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setConsent(value);
    window.dispatchEvent(new Event('cookie-consent-changed'));
  };

  return (
    <AnimatePresence>
      {consent === null && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[998] bg-black/95 backdrop-blur-xl border-t border-white/10 px-6 py-5"
        >
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
            <p className="text-xs text-white/60 flex-1 leading-relaxed">
              Używamy plików cookies niezbędnych do działania Portalu oraz — za Twoją zgodą — cookies reklamowych i analitycznych. Szczegóły w{' '}
              <button onClick={() => navigate('/privacy')} className="text-primary underline">Polityce Prywatności</button>.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => choose('necessary')}
                className="glass px-5 py-2.5 rounded-full font-bold uppercase text-[10px] tracking-widest border border-white/10 text-white/60"
              >
                Tylko niezbędne
              </button>
              <button
                onClick={() => choose('all')}
                className="gradient-fire px-5 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest text-white"
              >
                Akceptuję wszystkie
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
