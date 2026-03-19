import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, MessageCircle, Video, User, Bell, Users, Heart } from 'lucide-react';
import { useAppStore, type AppTab } from '@/store/appStore';
import { useState, useEffect } from 'react';
import DiscoverPage from './DiscoverPage';
import ChatsPage from './ChatsPage';
import LivePage from './LivePage';
import ProfilePage from './ProfilePage';
import RoulettePage from './RoulettePage';
import MatchModal from './MatchModal';
import VideoCallOverlay from './VideoCallOverlay';
import VibeRooms from './VibeRooms';
import WhoLikedMe from './WhoLikedMe';
import DailyStreak from './DailyStreak';
import SpeedDating from './SpeedDating';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useConversations } from '@/hooks/useConversations';

const tabs: { id: AppTab; icon: React.ComponentType<any>; label: string; emoji: string }[] = [
  { id: 'discover', icon: Flame, label: 'Discover', emoji: '🔍' },
  { id: 'roulette', icon: Zap, label: 'Roulette', emoji: '⚡' },
  { id: 'chats', icon: MessageCircle, label: 'Chats', emoji: '💬' },
  { id: 'live', icon: Video, label: 'Live', emoji: '🎥' },
  { id: 'profile', icon: User, label: 'Profile', emoji: '👤' },
];

const NOTIFICATIONS = [
  { id: 'n1', emoji: '💚', text: 'Sofia liked you!', time: '2m ago', unread: true },
  { id: 'n2', emoji: '🔥', text: "It's a Match with Mia!", time: '15m ago', unread: true },
  { id: 'n3', emoji: '💬', text: 'Zara sent you a message', time: '1h ago', unread: true },
  { id: 'n4', emoji: '⭐', text: 'Alex super-liked you!', time: '2h ago', unread: false },
  { id: 'n5', emoji: '🎁', text: 'Marco sent you a gift', time: '3h ago', unread: false },
];

export default function AppLayout() {
  const { activeTab, setActiveTab, currentUser, showMatch, showVideoCall } = useAppStore();
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const { conversations } = useConversations(user?.id ?? null);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showVibeRooms, setShowVibeRooms] = useState(false);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showSpeedDating, setShowSpeedDating] = useState(false);
  const [notifsSeen, setNotifsSeen] = useState(false);
  const unreadNotifs = notifsSeen ? 0 : NOTIFICATIONS.filter(n => n.unread).length;
  const currentStreak = 3; // In production: load from user_settings or profiles table

  // Show streak popup on first load of the day
  useEffect(() => {
    const key = `streak_shown_${new Date().toDateString()}`;
    if (!localStorage.getItem(key)) {
      setTimeout(() => setShowStreak(true), 1500);
      localStorage.setItem(key, '1');
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 glass-strong sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/spark-connect-logo.png" alt="Spark Connect" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg gradient-text">Spark Connect</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Vibe Rooms button */}
          <button
            onClick={() => setShowVibeRooms(true)}
            className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Rooms</span>
          </button>

          {/* Speed Dating */}
          <button
            onClick={() => setShowSpeedDating(true)}
            className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full border border-accent/30"
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent">Speed</span>
          </button>

          {/* Who liked me */}
          <button
            onClick={() => setShowWhoLikedMe(true)}
            className="relative flex items-center gap-1.5 glass px-3 py-1.5 rounded-full"
          >
            <Heart className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">6</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          </button>

          {/* Daily streak */}
          <button
            onClick={() => setShowStreak(true)}
            className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full"
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold text-accent">{currentStreak}</span>
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifs(v => !v); setNotifsSeen(true); }}
              className="relative w-9 h-9 glass rounded-full flex items-center justify-center"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground font-bold">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notif dropdown */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-11 right-0 w-72 glass-strong rounded-2xl border border-border overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-bold text-sm">Notifications</p>
                  </div>
                  {NOTIFICATIONS.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/40 ${n.unread ? 'bg-primary/5' : ''}`}
                    >
                      <span className="text-xl">{n.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{n.text}</p>
                        <p className="text-xs text-muted-foreground">{n.time}</p>
                      </div>
                      {n.unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Backdrop for notifications */}
      {showNotifs && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'discover' && <DiscoverPage />}
            {activeTab === 'roulette' && <RoulettePage />}
            {activeTab === 'chats' && <ChatsPage />}
            {activeTab === 'live' && <LivePage />}
            {activeTab === 'profile' && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav-blur flex items-center justify-around px-2 pb-safe pb-4 pt-2 sticky bottom-0 z-40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 gradient-fire rounded-2xl opacity-20"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                />
              )}
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
              {tab.id === 'chats' && totalUnread > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground font-bold">
                  {totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showMatch && <MatchModal />}
        {showVideoCall && <VideoCallOverlay />}
      </AnimatePresence>

      {/* Vibe Rooms */}
      <AnimatePresence>
        {showVibeRooms && (
          <VibeRooms onClose={() => setShowVibeRooms(false)} />
        )}
      </AnimatePresence>

      {/* Who Liked Me */}
      <AnimatePresence>
        {showWhoLikedMe && (
          <WhoLikedMe onClose={() => setShowWhoLikedMe(false)} />
        )}
      </AnimatePresence>

      {/* Daily Streak */}
      <AnimatePresence>
        {showStreak && (
          <DailyStreak currentStreak={currentStreak} onClose={() => setShowStreak(false)} />
        )}
      </AnimatePresence>

      {/* Speed Dating */}
      <AnimatePresence>
        {showSpeedDating && (
          <SpeedDating onClose={() => setShowSpeedDating(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
