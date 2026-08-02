import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import AuthFlow from '@/components/AuthFlow';
import AppLayout from '@/components/AppLayout';
import AgeGate from '@/components/AgeGate';
import CookieConsentBanner from '@/components/CookieConsent';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useSeo } from '@/hooks/useSeo';

// Captures ?ref=<referrer user id> on first landing and holds it until
// ProfileWizard finishes real signup (which is when referred_by actually
// gets set) -- doesn't overwrite an already-pending ref from an earlier visit.
function captureReferral() {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref && !localStorage.getItem('spark-connect-pending-ref')) {
    localStorage.setItem('spark-connect-pending-ref', ref);
  }
}

function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center text-white">
      <div className="text-5xl mb-4">🛠️</div>
      <h1 className="text-2xl font-bold mb-2">Przerwa techniczna</h1>
      <p className="text-white/60 max-w-sm">
        Spark Connect jest chwilowo niedostępny — wracamy za chwilę. Spróbuj ponownie za kilka minut.
      </p>
    </div>
  );
}

const Index = () => {
  const { view } = useAppStore();
  const { isAdmin, loading: authLoading } = useAuth();
  const { flags, loading: flagsLoading } = useFeatureFlags();

  useSeo({
    title: 'Spark Connect – Randki 18+ 🔥',
    description: 'Darmowa aplikacja randkowa 18+. Prawdziwi ludzie, speed dating, grupy tematyczne, mapa aktywnych, czaty wideo. Zero botów, zero paywall.',
    path: '/',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Spark Connect',
        url: 'https://spark-connect.hardbanrecordslab.online',
        logo: 'https://spark-connect.hardbanrecordslab.online/spark-connect-logo.png',
        parentOrganization: { '@type': 'Organization', name: 'Studio HRL Adult' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Spark Connect',
        url: 'https://spark-connect.hardbanrecordslab.online',
        inLanguage: 'pl-PL',
      },
    ],
  });

  useEffect(() => { captureReferral(); }, []);

  if (!authLoading && !flagsLoading && flags.maintenance_mode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="app-container min-h-screen">
      {view !== 'app' && <AgeGate />}
      {view === 'app' ? <AppLayout /> : <AuthFlow />}
      <CookieConsentBanner />
    </div>
  );
};

export default Index;
