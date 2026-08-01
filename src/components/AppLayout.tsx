import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Bell, Map, Eye, LayoutDashboard, Search, Menu, Star, Loader2, Users, Flame } from 'lucide-react';
import { useAppStore, type AppTab } from '@/store/appStore';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import DiscoverPage from './DiscoverPage';
import FeedPage from './FeedPage';
import ChatsPage from './ChatsPage';
import LivePage from './LivePage';
import ProfilePage from './ProfilePageV2';
import GroupsPage from './GroupsPage';
import MapPage from './MapPage';
import SafetyCenter from './SafetyCenter';
import MatchModal from './MatchModal';
import IncomingCallModal from './IncomingCallModal';

// livekit-client alone accounts for ~500kB — only pull it into the
// bundle when a call is actually starting, not on first page load.
// SpeedDating now uses LiveKit too (real video pairing), so it needs
// the same lazy treatment or it drags livekit-client into the eager
// main bundle.
const VideoCallOverlay = lazy(() => import('./VideoCallOverlay'));
const RoulettePage = lazy(() => import('./RoulettePage'));
const SpeedDating = lazy(() => import('./SpeedDating'));
import WhoLikedMe from './WhoLikedMe';
import DailyStreak from './DailyStreak';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useConversations } from '@/hooks/useConversations';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useIncomingCallListener } from '@/hooks/useCallSignaling';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useCoinBalance } from '@/hooks/useCoinBalance';

const EXTRA_TAB_LABELS: Partial<Record<AppTab, string>> = {
  groups: 'Grupy',
};

const tabs: { id: AppTab; label: string; emoji: string; icon: any; badge?: number }[] = [
  { id: 'discover', label: 'Odkryj', emoji: '🔍', icon: Search },
  { id: 'feed', label: 'Feed', emoji: '🎞️', icon: Eye },
  { id: 'chats', label: 'Czaty', emoji: '💬', icon: MessageCircle },
  { id: 'map', label: 'Mapa', emoji: '📍', icon: Map },
  { id: 'profile', label: 'Profil', emoji: '👤', icon: User },
];

export default function AppLayout() {
  const { activeTab, setActiveTab, showMatch, showVideoCall } = useAppStore();
  const { user, isAdmin } = useAuth();
  // Bug fix: useProfile expects the Supabase User object, not just its
  // id string — passing `user?.id` silently broke profile fetching
  // (the hook does `.eq('id', user.id)`, so a string here resolves to
  // `.eq('id', undefined)`).
  useProfile(user);
  const { conversations } = useConversations(user?.id ?? null);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const { balance: coinBalance } = useCoinBalance(user?.id);
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showSpeedDating, setShowSpeedDating] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [notifsSeen, setNotifsSeen] = useState(false);
  useUserSettings(user);
  useIncomingCallListener(user?.id);
  usePresenceHeartbeat(user?.id);

  // Records today's login once per mount and reads back the real
  // streak count for the header badge -- record_daily_login() is
  // idempotent per calendar day, so re-mounting doesn't inflate it.
  useEffect(() => {
    if (!user?.id) return;
    db.rpc('record_daily_login').then(({ data }: { data: number | null }) => {
      if (typeof data === 'number') setStreak(data);
    });
  }, [user?.id]);

  const unreadConvos = conversations.filter(c => c.unreadCount > 0);
  const unreadNotifs = notifsSeen ? 0 : unreadConvos.length;

  return (
    <div className="min-h-screen w-full flex flex-col bg-background selection:bg-primary selection:text-white">
      {/* PROFESSIONAL PORTAL HEADER */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('discover')}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-black p-1.5 border border-white/10 shadow-2xl">
              <img src="/spark-connect-logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-xl gradient-text tracking-tighter uppercase leading-none">Spark</h1>
            </div>
          </div>

          {/* Desktop Navigation (Center) */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'text-primary shadow-[0_0_20px_rgba(255,26,78,0.1)]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute inset-0 bg-primary/5 rounded-xl blur-sm"
                  />
                )}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="nav-underline" 
                    className="absolute bottom-0 left-5 right-5 h-0.5 gradient-fire rounded-full shadow-[0_0_10px_rgba(255,26,78,0.5)]" 
                  />
                )}
                {tab.id === 'chats' && totalUnread > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 gradient-fire rounded-full text-[8px] flex items-center justify-center text-white font-black shadow-lg">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Actions Section (Right) */}
          <div className="flex items-center gap-2 md:gap-4 ml-auto lg:ml-0">
            {/* Streak */}
            <button
              onClick={() => setShowStreak(true)}
              className="hidden md:flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-white/10 hover:border-primary/30 transition-colors"
            >
              <Flame className="w-4 h-4 text-primary" />
              <span className="font-black text-sm text-primary">{streak ?? '—'}</span>
            </button>

            {/* Coins */}
            <div className="hidden md:flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-sm">💎</span>
              <span className="font-black text-sm text-amber-500">{coinBalance ?? '—'}</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifs(!showNotifs); setNotifsSeen(true); }}
                className="w-10 h-10 md:w-12 md:h-12 glass rounded-2xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all"
              >
                <Bell className={`w-5 h-5 ${unreadNotifs > 0 ? 'text-primary animate-pulse' : 'text-white/60'}`} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 gradient-fire rounded-full text-[10px] flex items-center justify-center text-white font-black border-2 border-black">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifs && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-4 right-0 w-80 glass-strong rounded-3xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                      <span className="font-black text-xs uppercase tracking-widest">Powiadomienia</span>
                      <button onClick={() => setShowNotifs(false)} className="text-white/40 hover:text-white">✕</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {unreadConvos.length === 0 ? (
                        <p className="p-6 text-center text-xs text-white/40">Brak nowych powiadomień</p>
                      ) : unreadConvos.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setActiveTab('chats'); setShowNotifs(false); }}
                          className="w-full p-4 border-b border-white/5 hover:bg-white/5 flex gap-4 items-center text-left"
                        >
                          <span className="text-2xl">💬</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{c.user.displayName} wysłał(a) wiadomość</p>
                            <p className="text-[10px] text-white/40 mt-0.5">{c.unreadCount} {c.unreadCount === 1 ? 'nowa wiadomość' : 'nowych wiadomości'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="lg:hidden w-10 h-10 glass rounded-2xl flex items-center justify-center border border-white/5">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Sub-navigation Strip (Optional but premium) */}
        <div className="bg-white/[0.02] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4 overflow-x-auto scrollbar-hide">
             <button onClick={() => setShowSpeedDating(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500/80 hover:text-amber-500 transition-all whitespace-nowrap">
               <Star className="w-3 h-3" /> Speed Dating
             </button>
             <button onClick={() => setActiveTab('groups')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400/80 hover:text-violet-400 transition-all whitespace-nowrap">
               <Users className="w-3 h-3" /> Grupy
             </button>
             {isAdmin && (
               <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400/80 hover:text-blue-400 transition-all whitespace-nowrap ml-auto">
                 <LayoutDashboard className="w-3 h-3" /> Panel Admina
               </button>
             )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-24 lg:pb-12">
        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveTab('discover')}>Spark</span>
          <span className="text-white/10">/</span>
          <span className="text-primary/80">{tabs.find(t => t.id === activeTab)?.label ?? EXTRA_TAB_LABELS[activeTab] ?? activeTab}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'discover' && <DiscoverPage />}
            {activeTab === 'feed' && <FeedPage />}
            {activeTab === 'roulette' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
                <RoulettePage />
              </Suspense>
            )}
            {activeTab === 'chats' && <ChatsPage />}
            {activeTab === 'live' && <LivePage />}
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'groups' && <GroupsPage />}
            {activeTab === 'map' && <MapPage onOpenChat={() => setActiveTab('chats')} onSafety={() => {}} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAV (Hidden on Desktop) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/5 px-2 pb-safe pt-2">
        <div className="flex items-center justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 p-3 transition-all ${
                activeTab === tab.id ? 'text-primary scale-110' : 'text-white/40'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
              {tab.id === 'chats' && totalUnread > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 gradient-fire rounded-full text-[8px] flex items-center justify-center text-white font-black">
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* OVERLAYS */}
      <IncomingCallModal />
      <AnimatePresence>
        {showMatch && <MatchModal />}
        {showVideoCall && (
          <Suspense fallback={null}>
            <VideoCallOverlay />
          </Suspense>
        )}
        {showWhoLikedMe && <WhoLikedMe onClose={() => setShowWhoLikedMe(false)} />}
        {showStreak && <DailyStreak onClose={() => setShowStreak(false)} />}
        {showSpeedDating && (
          <Suspense fallback={<div className="fixed inset-0 z-40 bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            <SpeedDating onClose={() => setShowSpeedDating(false)} />
          </Suspense>
        )}
        {showSafety && <SafetyCenter onClose={() => setShowSafety(false)} />}
      </AnimatePresence>
    </div>
  );
}
