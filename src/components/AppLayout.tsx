import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Bell, Flame, Zap, Map, Eye, Flame as FlameIcon } from 'lucide-react';
import { useAppStore, type AppTab } from '@/store/appStore';
import { useState, useEffect } from 'react';
import DiscoverPage from './DiscoverPage';
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

const tabs: { id: AppTab; label: string; emoji: string; badge?: number }[] = [
  { id: 'discover', label: 'Odkryj', emoji: '🔍' },
  { id: 'chats', label: 'Czaty', emoji: '💬' },
  { id: 'groups', label: 'Grupy', emoji: '✦' },
  { id: 'map', label: 'Mapa', emoji: '📍' },
  { id: 'visitors', label: 'Wizyty', emoji: '👁️' },
];

const NOTIFICATIONS = [
  { id: 'n1', emoji: '💚', text: 'Sofia polubiła Cię!', time: '2 min temu', unread: true },
  { id: 'n2', emoji: '🔥', text: 'To dopasowanie z Mią!', time: '15 min temu', unread: true },
  { id: 'n3', emoji: '💬', text: 'Zara wysłała wiadomość', time: '1 godz. temu', unread: true },
  { id: 'n4', emoji: '⭐', text: 'Alex cię Super Liknął!', time: '2 godz. temu', unread: false },
  { id: 'n5', emoji: '🎁', text: 'Marco wysłał prezent', time: '3 godz. temu', unread: false },
];

// Group chat panel (slide-in)
function GroupChatPanel({ name, emoji, onClose }: { name: string; emoji: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState([
    { id: 1, sender: 'Karolina', img: 49, me: false, text: 'Ktoś był wczoraj na koncercie w Hydrozagadce? 🎷', time: '18:30', reactions: ['🔥5', '❤️3'] },
    { id: 2, sender: 'Marek', img: 10, me: false, text: 'Tak! Kwartet Hawkins grał fenomenalnie.', time: '18:32', reactions: [] },
    { id: 3, sender: 'Ty', img: 5, me: true, text: 'Następny raz koniecznie!', time: '18:37', reactions: [] },
  ]);

  const send = () => {
    if (!text.trim()) return;
    const t = new Date();
    const time = `${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`;
    setMsgs(m => [...m, { id: Date.now(), sender: 'Ty', img: 5, me: true, text, time, reactions: [] }]);
    setText('');
    setTimeout(() => {
      const replies = ['Super! 🙌', 'Zgadzam się!', 'Ciekawe 💭', 'Też tak myślę ✨'];
      const names = ['Karolina','Marek','Ania'];
      const imgs = [49, 10, 45];
      const ri = Math.floor(Math.random() * 3);
      setMsgs(m => [...m, { id: Date.now()+1, sender: names[ri], img: imgs[ri], me: false, text: replies[Math.floor(Math.random()*replies.length)], time, reactions: [] }]);
    }, 1000 + Math.random() * 700);
  };

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 glass-strong border-b border-border">
        <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center text-sm">‹</button>
        <div className="w-9 h-9 gradient-fire rounded-xl flex items-center justify-center text-lg flex-shrink-0">{emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{name}</div>
          <div className="text-xs text-muted-foreground">847 uczestników · 12 online</div>
        </div>
        <button className="w-8 h-8 glass rounded-full flex items-center justify-center text-xs text-muted-foreground">⋯</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hidden">
        <div className="text-center">
          <span className="text-xs glass px-3 py-1 rounded-full text-muted-foreground italic">Dołączyłeś do grupy {name}</span>
        </div>
        {msgs.map(m => (
          <div key={m.id} className={`flex gap-2 items-end ${m.me ? 'flex-row-reverse' : ''}`}>
            <img src={`https://i.pravatar.cc/26?img=${m.img}`} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-border" />
            <div className={`max-w-[72%] ${m.me ? 'items-end' : 'items-start'} flex flex-col`}>
              {!m.me && <span className="text-xs text-primary mb-1 px-1">{m.sender}</span>}
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.me ? 'gradient-fire text-primary-foreground rounded-br-sm' : 'glass text-foreground rounded-bl-sm'}`}>
                {m.text}
              </div>
              {m.reactions.length > 0 && (
                <div className="flex gap-1 mt-1 px-1">
                  {m.reactions.map(r => <span key={r} className="text-xs glass px-2 py-0.5 rounded-full">{r}</span>)}
                </div>
              )}
              <span className="text-xs text-muted-foreground mt-1 px-1">{m.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border glass-strong">
        <div className="flex gap-2 mb-2">
          {['📷','🎁','👻','🎤','😊'].map(ic => (
            <button key={ic} className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs text-muted-foreground border border-border hover:border-primary transition-colors">{ic}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Napisz wiadomość..."
            className="flex-1 bg-secondary rounded-2xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
          <button onClick={send} className="w-9 h-9 gradient-fire rounded-full flex items-center justify-center flex-shrink-0 text-sm">➤</button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AppLayout() {
  const { activeTab, setActiveTab, showMatch, showVideoCall } = useAppStore();
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const { conversations } = useConversations(user?.id ?? null);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showVibeRooms, setShowVibeRooms] = useState(false);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showSpeedDating, setShowSpeedDating] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [notifsSeen, setNotifsSeen] = useState(false);
  const [groupChat, setGroupChat] = useState<{ name: string; emoji: string } | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const { permission, subscribed, subscribe } = usePushNotifications(user?.id ?? null);

  const unreadNotifs = notifsSeen ? 0 : NOTIFICATIONS.filter(n => n.unread).length;
  const currentStreak = 7;

  useEffect(() => {
    const key = `streak_shown_${new Date().toDateString()}`;
    if (!localStorage.getItem(key)) {
      setTimeout(() => setShowStreak(true), 1500);
      localStorage.setItem(key, '1');
    }
  }, []);

  useEffect(() => {
    if (!user || subscribed || permission === 'denied') return;
    const key = 'push_prompt_shown';
    if (!localStorage.getItem(key)) {
      setTimeout(() => setShowPushPrompt(true), 5000);
      localStorage.setItem(key, '1');
    }
  }, [user, subscribed, permission]);

  const openChat = (name: string) => {
    // Switch to chats tab — the chat will open from there
    setActiveTab('chats');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-3 pb-3 glass-strong sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#000' }}>
            <img src="/spark-connect-logo.png" alt="Spark Connect" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-base gradient-text" style={{ fontFamily: 'serif' }}>Spark Connect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowVibeRooms(true)}
            className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-full text-xs font-medium text-primary border border-primary/20">
            🎲 Rooms
          </button>
          <button onClick={() => setShowSpeedDating(true)}
            className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-full text-xs font-semibold text-accent border border-accent/30">
            ⚡ Speed
          </button>
          <button onClick={() => setActiveTab('hotnot' as AppTab)}
            className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-full text-xs font-semibold text-rose-400 border border-rose-500/30">
            🔥 Hot/Not
          </button>
          <button onClick={() => setShowStreak(true)}
            className="flex items-center gap-1 glass px-2 py-1.5 rounded-full text-xs">
            🔥<span className="font-semibold text-accent">{currentStreak}</span>
          </button>
          <div className="relative">
            <button onClick={() => { setShowNotifs(v => !v); setNotifsSeen(true); }}
              className="relative w-8 h-8 glass rounded-full flex items-center justify-center border border-border">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground font-bold">
                  {unreadNotifs}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
                  className="absolute top-10 right-0 w-72 glass-strong rounded-2xl border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-bold text-sm">Powiadomienia</p>
                  </div>
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/40 ${n.unread ? 'bg-primary/5' : ''}`}>
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

      {showNotifs && <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="h-full">
            {activeTab === 'discover' && <DiscoverPage />}
            {activeTab === 'roulette' && <RoulettePage />}
            {activeTab === 'chats' && <ChatsPage />}
            {activeTab === 'live' && <LivePage />}
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'groups' && (
              <GroupsPage onOpenGroupChat={(name, emoji) => setGroupChat({ name, emoji })} />
            )}
            {activeTab === 'map' && (
              <MapPage onOpenChat={openChat} onSafety={() => setShowSafety(true)} />
            )}
            {activeTab === 'visitors' && <VisitorsPage onOpenChat={openChat} />}
            {activeTab === ('hotnot' as AppTab) && <HotOrNotPage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav-blur flex items-center justify-around px-2 pb-safe pb-4 pt-2 sticky bottom-0 z-40">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'chats' ? totalUnread : tab.id === 'visitors' ? 18 : 0;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200">
              {isActive && (
                <motion.div layoutId="nav-pill"
                  className="absolute inset-0 gradient-fire rounded-2xl opacity-20"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }} />
              )}
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
              {badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground font-bold">
                  {badge}
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
        {showVibeRooms && <VibeRooms onClose={() => setShowVibeRooms(false)} />}
        {showWhoLikedMe && <WhoLikedMe onClose={() => setShowWhoLikedMe(false)} />}
        {showStreak && <DailyStreak currentStreak={currentStreak} onClose={() => setShowStreak(false)} />}
        {showSpeedDating && <SpeedDating onClose={() => setShowSpeedDating(false)} />}
        {showSafety && <SafetyCenter onClose={() => setShowSafety(false)} />}
        {groupChat && <GroupChatPanel name={groupChat.name} emoji={groupChat.emoji} onClose={() => setGroupChat(null)} />}
        {showPushPrompt && permission !== 'denied' && !subscribed && (
          <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-24 left-4 right-4 z-50 glass-strong rounded-2xl p-4 border border-primary/30 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 gradient-fire rounded-xl flex items-center justify-center flex-shrink-0 text-lg">🔔</div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-0.5">Włącz powiadomienia</p>
                <p className="text-xs text-muted-foreground">Dowiedz się natychmiast o matchach i wiadomościach</p>
              </div>
              <button onClick={() => setShowPushPrompt(false)} className="text-muted-foreground p-1">✕</button>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { subscribe(); setShowPushPrompt(false); }}
                className="flex-1 gradient-fire text-primary-foreground py-2.5 rounded-xl text-sm font-bold">
                Włącz 🔔
              </button>
              <button onClick={() => setShowPushPrompt(false)}
                className="px-4 glass rounded-xl text-sm text-muted-foreground">
                Później
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
