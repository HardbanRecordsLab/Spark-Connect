import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applySeo, type SeoOptions } from '@/lib/seo';

// Per-route override of the static SEO tags shipped in index.html.
// path defaults to the current router location so callers only need it
// when the canonical URL should differ from the visible route (e.g. /blog/:slug).
export function useSeo(options: Omit<SeoOptions, 'path'> & { path?: string }) {
  const location = useLocation();
  const path = options.path ?? location.pathname;

  useEffect(() => {
    applySeo({ ...options, path });
    // Re-applies whenever the meaningful bits change; jsonLd/image are passed
    // fresh each render but only affect output when their content differs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.title, options.description, options.noindex, path]);
}
