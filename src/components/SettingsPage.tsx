import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bell, Shield, Trash2, FileText, Eye,
  Globe, Lock, ChevronRight, Check, AlertTriangle, X, Loader2, Download
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUserSettings } from '@/hooks/useUserSettings';
import { supabase } from '@/integrations/supabase/client';

interface SettingsPageProps {
  onClose: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary'}`}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full shadow"
      />
    </button>
  );
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { setView } = useAppStore();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications(user?.id ?? null);
  const { settings, saving, updateSetting } = useUserSettings(user);
  const [section, setSection] = useState<'main' | 'notifications' | 'privacy' | 'gdpr' | 'delete'>('main');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleGdprExport = async () => {
    if (!user) return;
    setExporting(true);
    setExportUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gdpr-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const json = await res.json();
      if (json.download_url) {
        setExportUrl(json.download_url);
        window.open(json.download_url, '_blank');
      } else if (json.data) {
        // Fallback: create blob download
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'moje-dane-spark.json'; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('GDPR export failed:', err);
    }
    setExporting(false);
  };

  // Map settings keys to notification/privacy objects for rendering
  const notifs = {
    matches:    settings.notif_matches,
    messages:   settings.notif_messages,
    likes:      settings.notif_likes,
    stories:    settings.notif_stories,
    liveStreams: settings.notif_live,
    promotions: settings.notif_promotions,
  };
  const privacy = {
    showLastSeen:   settings.show_last_seen,
    showOnline:     settings.show_online,
    showDistance:   settings.show_distance,
    readReceipts:   settings.read_receipts,
    invisibleMode:  settings.invisible_mode,
    hideFromSearch: settings.hide_from_search,
  };

  const notifKeyMap: Record<string, keyof typeof settings> = {
    matches: 'notif_matches', messages: 'notif_messages', likes: 'notif_likes',
    stories: 'notif_stories', liveStreams: 'notif_live', promotions: 'notif_promotions',
  };
  const privacyKeyMap: Record<string, keyof typeof settings> = {
    showLastSeen: 'show_last_seen', showOnline: 'show_online', showDistance: 'show_distance',
    readReceipts: 'read_receipts', invisibleMode: 'invisible_mode', hideFromSearch: 'hide_from_search',
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    // Sign out first then redirect — actual data deletion would need an edge function
    await supabase.auth.signOut();
    setDeleted(true);
    setTimeout(() => setView('landing'), 2000);
  };

  if (section === 'notifications') {
    return (
      <div className="h-full flex flex-col">
        <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-bold">Notifications</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-3">
          {Object.entries(notifs).map(([key, value]) => {
            const labels: Record<string, { label: string; desc: string; emoji: string }> = {
              matches:    { label: 'Nowe dopasowania',  desc: 'Gdy ktoś Cię polubi wzajemnie',        emoji: '🔥' },
              messages:   { label: 'Wiadomości',        desc: 'Nowe czaty i odpowiedzi',               emoji: '💬' },
              likes:      { label: 'Polubienia',        desc: 'Gdy ktoś polubi Twój profil',           emoji: '💚' },
              stories:    { label: 'Stories',           desc: 'Nowe stories od dopasowań',             emoji: '📸' },
              liveStreams: { label: 'Transmisje live',  desc: 'Gdy dopasowania wchodzą na żywo',       emoji: '🎥' },
              promotions: { label: 'Promocje',          desc: 'Oferty i aktualności aplikacji',        emoji: '🔔' },
            };
            const info = labels[key];
            return (
              <div key={key} className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                </div>
                <Toggle value={value} onChange={v => updateSetting(notifKeyMap[key], v)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'privacy') {
    return (
      <div className="h-full flex flex-col">
        <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-bold">Privacy</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-3">
          {Object.entries(privacy).map(([key, value]) => {
            const labels: Record<string, { label: string; desc: string; emoji: string }> = {
              showLastSeen:   { label: 'Ostatnia aktywność', desc: 'Dopasowania widzą kiedy byłeś/aś aktywny/a', emoji: '🕐' },
              showOnline:     { label: 'Status online',      desc: 'Zielona kropka gdy jesteś online',           emoji: '🟢' },
              showDistance:   { label: 'Odległość',          desc: 'Pokaż km na Twoim profilu',                  emoji: '📍' },
              readReceipts:   { label: 'Potwierdzenia',      desc: 'Pokaż gdy przeczytałeś/aś wiadomości',       emoji: '✓✓' },
              invisibleMode:  { label: 'Tryb niewidzialny',  desc: 'Przeglądaj bez pojawiania się online',       emoji: '👻' },
              hideFromSearch: { label: 'Ukryj w Discover',   desc: 'Tylko dopasowania mogą Ci napisać',          emoji: '🙈' },
            };
            const info = labels[key];
            return (
              <div key={key} className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saving && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />}
                  <Toggle value={value} onChange={v => updateSetting(privacyKeyMap[key], v)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'gdpr') {
    return (
      <div className="h-full flex flex-col">
        <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-bold">Privacy & GDPR</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-3">
          {[
            { title: 'Polityka Prywatności', desc: 'Jak zbieramy i używamy Twoich danych', emoji: '📋', href: '/privacy' },
            { title: 'Regulamin', desc: 'Zasady korzystania z Spark Connect', emoji: '📜', href: '/terms' },
            { title: 'Twoje prawa (RODO)', desc: 'Dostęp, korekta, usunięcie danych', emoji: '🔒', href: '/privacy#5' },
          ].map(item => (
            <button key={item.title} onClick={() => navigate(item.href)} className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}

          <div className="glass rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Your Rights</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                'Right to access your data',
                'Right to correct inaccurate data',
                'Right to erasure (be forgotten)',
                'Right to data portability',
                'Right to restrict processing',
              ].map(right => (
                <li key={right} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {right}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleGdprExport}
            disabled={exporting}
            className="w-full glass border border-primary/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
          >
            {exporting
              ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
              : <Download className="w-5 h-5 text-primary" />}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Eksportuj moje dane</p>
              <p className="text-xs text-muted-foreground">
                {exporting ? 'Przygotowuję plik...' : 'Pobierz kopię wszystkich danych (RODO Art. 20)'}
              </p>
            </div>
            {exportUrl && <Check className="w-4 h-4 text-primary" />}
          </button>

          <button
            onClick={() => setSection('delete')}
            className="w-full glass border border-destructive/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-destructive">Delete my account</p>
              <p className="text-xs text-muted-foreground">Permanently remove all your data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  if (section === 'delete') {
    return (
      <div className="h-full flex flex-col">
        <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSection('gdpr')} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-bold text-destructive">Delete Account</h2>
        </div>
        <div className="flex-1 flex flex-col px-5 py-6 gap-5">
          {deleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="text-6xl">👋</div>
              <h3 className="text-xl font-bold">Account deleted</h3>
              <p className="text-sm text-muted-foreground">Your data will be fully erased within 30 days as required by GDPR.</p>
            </motion.div>
          ) : (
            <>
              <div className="glass border border-destructive/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-destructive mb-1">This action is irreversible</p>
                    <p className="text-xs text-muted-foreground">
                      Deleting your account will permanently remove all your matches, messages, photos and profile. Your data will be fully erased within 30 days per GDPR Article 17.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {[
                  'All your matches will be removed',
                  'All your messages will be deleted',
                  'Your photos will be removed from storage',
                  'Your coin balance will be lost',
                  'This cannot be undone',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none border border-destructive/30 focus:border-destructive transition-colors"
                />
              </div>

              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  deleteConfirm === 'DELETE'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                }`}
              >
                {deleting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  'Permanently Delete Account'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const settingsSections = [
    { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Push, messages, matches', emoji: '🔔' },
    { id: 'privacy', icon: Eye, label: 'Privacy', desc: 'Online status, visibility', emoji: '👁️' },
    { id: 'gdpr', icon: FileText, label: 'Privacy & GDPR', desc: 'Your data & legal rights', emoji: '🔒' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="font-bold">Settings</h2>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-3">
        {/* Push notification toggle */}
        <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-fire flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                {permission === 'denied' ? 'Zablokowane w przeglądarce' : subscribed ? 'Włączone' : 'Wyłączone'}
              </p>
            </div>
          </div>
          <Toggle
            value={subscribed}
            onChange={v => v ? subscribe() : unsubscribe()}
          />
        </div>

        {settingsSections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id as 'notifications' | 'privacy' | 'gdpr')}
            className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl gradient-fire flex items-center justify-center">
              <s.icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}

        {/* App info */}
        <div className="glass rounded-2xl p-4 text-center mt-4">
          <div className="w-12 h-12 gradient-fire rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🔥</div>
          <p className="font-bold gradient-text">Spark Connect</p>
          <p className="text-xs text-muted-foreground">Version 1.0.0 · Free forever</p>
        </div>
      </div>
    </div>
  );
}
