import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Bell, Flame, Zap, Map, Eye, Flame as FlameIcon, Ghost, LayoutDashboard, Search, Shield, Menu, Star } from 'lucide-react';
import { useAppStore, type AppTab } from '@/store/appStore';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DiscoverPage from './DiscoverPage';
import FeedPage from './FeedPage';
import ChatsPage from './ChatsPage';
import LivePage from './LivePage';
import ProfilePage from './ProfilePage';
import RoulettePage from './RoulettePage';
import GroupsPage from './GroupsPage';
import MapPage from './MapPage';
import VisitorsPage from './VisitorsPage';
import HotOrNotPage from './HotOrNotPage';
import SafetyCenter from './SafetyCenter';
import MatchModal from './MatchModal';
import VideoCallOverlay from './VideoCallOverlay';
import VibeRooms from './VibeRooms';
import WhoLikedMe from './WhoLikedMe';
import DailyStreak from './DailyStreak';
import SpeedDating from './SpeedDating';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useProfile } from '@/hooks/useProfile';
import { useConversations } from '@/hooks/useConversations';
import { useUserSettings } from '@/hooks/useUserSettings';

const tabs: { id: AppTab; label: string; emoji: string; icon: any; badge?: number }[] = [
  { id: 'discover', label: 'Odkryj', emoji: '🔍', icon: Search },
  { id: 'feed', label: 'Feed', emoji: '🎞️', icon: Eye },
  { id: 'chats', label: 'Czaty', emoji: '💬', icon: MessageCircle },
  { id: 'map', label: 'Mapa', emoji: '📍', icon: Map },
  { id: 'profile', label: 'Profil', emoji: '👤', icon: User },
];

const NOTIFICATIONS = [
  { id: 'n1', emoji: '💚', text: 'Sofia polubiła Cię!', time: '2 min temu', unread: true },
  { id: 'n2', emoji: '🔥', text: 'To dopasowanie z Mią!', time: '15 min temu', unread: true },
  { id: 'n3', emoji: '💬', text: 'Zara wysłała wiadomość', time: '1 godz. temu', unread: true },
  { id: 'n4', emoji: '⭐', text: 'Alex cię Super Liknął!', time: '2 godz. temu', unread: false },
];

export default function AppLayout() {
  const { activeTab, setActiveTab, showMatch, showVideoCall } = useAppStore();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id ?? null);
  const { conversations } = useConversations(user?.id ?? null);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showVibeRooms, setShowVibeRooms] = useState(false);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showSpeedDating, setShowSpeedDating] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [notifsSeen, setNotifsSeen] = useState(false);
  const { settings } = useUserSettings(user);

  const unreadNotifs = notifsSeen ? 0 : NOTIFICATIONS.filter(n => n.unread).length;
  const currentStreak = 7;

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
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Portal 2.0</span>
            </div>
          </div>

          {/* Desktop Navigation (Center) */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'text-primary' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="nav-underline" className="absolute bottom-0 left-5 right-5 h-0.5 gradient-fire rounded-full" />
                )}
                {tab.id === 'chats' && totalUnread > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 gradient-fire rounded-full text-[8px] flex items-center justify-center text-white font-black">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Actions Section (Right) */}
          <div className="flex items-center gap-2 md:gap-4 ml-auto lg:ml-0">
            {/* Streak & Coins */}
            <div className="hidden md:flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-sm">🔥</span>
              <span className="font-black text-sm text-primary">{currentStreak}</span>
              <div className="w-[1px] h-3 bg-white/10 mx-1" />
              <span className="text-sm">💎</span>
              <span className="font-black text-sm text-amber-500">1.2k</span>
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
                      {NOTIFICATIONS.map(n => (
                        <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 flex gap-4 items-center">
                          <span className="text-2xl">{n.emoji}</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-white">{n.text}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">{n.time}</p>
                          </div>
                        </div>
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
             <button onClick={() => setShowVibeRooms(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/80 hover:text-primary transition-all whitespace-nowrap">
               <Zap className="w-3 h-3" /> Vibe Rooms
             </button>
             <button onClick={() => setShowSpeedDating(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500/80 hover:text-amber-500 transition-all whitespace-nowrap">
               <Star className="w-3 h-3" /> Speed Dating
             </button>
             <button onClick={() => setActiveTab('hotnot' as any)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500/80 hover:text-rose-500 transition-all whitespace-nowrap">
               <Flame className="w-3 h-3" /> Hot or Not
             </button>
             <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400/80 hover:text-blue-400 transition-all whitespace-nowrap ml-auto">
               <LayoutDashboard className="w-3 h-3" /> Admin Dashboard
             </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pt-6 pb-24 lg:pb-12">
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
            {activeTab === 'roulette' && <RoulettePage />}
            {activeTab === 'chats' && <ChatsPage />}
            {activeTab === 'live' && <LivePage />}
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'groups' && <GroupsPage onOpenGroupChat={() => {}} />}
            {activeTab === 'map' && <MapPage onOpenChat={() => setActiveTab('chats')} onSafety={() => {}} />}
            {activeTab === 'visitors' && <VisitorsPage onOpenChat={() => setActiveTab('chats')} />}
            {activeTab === ('hotnot' as any) && <HotOrNotPage />}
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
      <AnimatePresence>
        {showMatch && <MatchModal />}
        {showVideoCall && <VideoCallOverlay />}
        {showVibeRooms && <VibeRooms onClose={() => setShowVibeRooms(false)} />}
        {showWhoLikedMe && <WhoLikedMe onClose={() => setShowWhoLikedMe(false)} />}
        {showStreak && <DailyStreak currentStreak={currentStreak} onClose={() => setShowStreak(false)} />}
        {showSpeedDating && <SpeedDating onClose={() => setShowSpeedDating(false)} />}
        {showSafety && <SafetyCenter onClose={() => setShowSafety(false)} />}
      </AnimatePresence>
    </div>
  );
}
