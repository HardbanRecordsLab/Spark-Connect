import { getCookieConsent } from '@/components/CookieConsent';

// Inactive until VITE_GA_MEASUREMENT_ID is set (no account exists yet).
// Once it is, GA4 still only loads for visitors who accepted the "all"
// cookie tier in CookieConsentBanner -- never for "necessary"-only or
// undecided visitors, per the consent copy shown in that banner.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let gaLoaded = false;

function loadGa() {
  if (gaLoaded || !GA_ID) return;
  gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true, send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

export function initAnalytics() {
  if (!GA_ID) return;
  if (getCookieConsent() === 'all') loadGa();
  window.addEventListener('cookie-consent-changed', () => {
    if (getCookieConsent() === 'all') loadGa();
  });
}

// Manual pageview tracking (send_page_view is off above) so SPA route
// changes count as pageviews, not just the initial document load.
export function trackPageview(path: string) {
  if (!gaLoaded || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
}
