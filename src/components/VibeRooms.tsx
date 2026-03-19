import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, MicOff, Video, VideoOff, PhoneOff, Crown, Plus, Lock, Globe, X } from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['Chill & Talk 💬', 'Flirt Lounge 🔥', 'Speed Dating ⚡'];

const mockRooms = [
  { id: 'r1', name: 'Late Night Vibes 🌙', category: 'Chill & Talk 💬', participants: 3, maxParticipants: 4, isPrivate: false, host: 'Sofia', hostPhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80' },
  { id: 'r2', name: 'Flirt & Chill 🔥', category: 'Flirt Lounge 🔥', participants: 2, maxParticipants: 4, isPrivate: false, host: 'Mia', hostPhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80' },
  { id: 'r3', name: 'Speed Round ⚡', category: 'Speed Dating ⚡', participants: 4, maxParticipants: 4, isPrivate: false, host: 'Zara', hostPhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80' },
  { id: 'r4', name: 'Private Room', category: 'Chill & Talk 💬', participants: 1, maxParticipants: 4, isPrivate: true, host: 'Alex', hostPhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80' },
];

const mockParticipants = [
  { id: '1', name: 'Sofia', photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80', isMuted: false, isHost: true },
  { id: '2', name: 'Mia', photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80', isMuted: true, isHost: false },
  { id: '3', name: 'You', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', isMuted: false, isHost: false },
];

// ── Room list ─────────────────────────────────────────────────────────────────

function RoomCard({ room, onJoin }: { room: typeof mockRooms[0]; onJoin: () => void }) {
  const isFull = room.participants >= room.maxParticipants;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 flex items-center gap-3"
    >
      <div className="relative flex-shrink-0">
        <img src={room.hostPhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 gradient-fire rounded-full flex items-center justify-center">
          <Crown className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">{room.name}</span>
          {room.isPrivate && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{room.category}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className={`text-xs font-medium ${isFull ? 'text-destructive' : 'text-emerald-400'}`}>
              {room.participants}/{room.maxParticipants}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onJoin}
        disabled={isFull}
        className={`flex-shrink-0 text-xs px-4 py-2 rounded-xl font-bold transition-all ${
          isFull ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'gradient-fire text-primary-foreground'
        }`}
      >
        {isFull ? 'Full' : 'Join'}
      </button>
    </motion.div>
  );
}

// ── Active Room ───────────────────────────────────────────────────────────────

function ActiveRoom({ roomName, onLeave }: { roomName: string; onLeave: () => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="glass-strong border-b border-border px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{roomName}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live · {mockParticipants.length} people</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Public</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 p-3 grid grid-cols-2 gap-3 content-start">
        {mockParticipants.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 h-48' : 'h-40'}`}
          >
            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              <span className="text-xs font-bold text-primary-foreground">{p.name}</span>
              {p.isHost && (
                <div className="w-4 h-4 gradient-fire rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </div>
            {p.isMuted && (
              <div className="absolute bottom-2 right-3 w-6 h-6 bg-destructive/80 rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="glass-strong border-t border-border px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-destructive' : 'glass'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-primary-foreground" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={onLeave}
          className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center"
        >
          <PhoneOff className="w-7 h-7 text-primary-foreground" />
        </button>

        <button
          onClick={() => setIsCamOff(!isCamOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isCamOff ? 'bg-destructive' : 'glass'
          }`}
        >
          {isCamOff ? <VideoOff className="w-5 h-5 text-primary-foreground" /> : <Video className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}

// ── Create Room Modal ─────────────────────────────────────────────────────────

function CreateRoomModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, cat: string, priv: boolean) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full glass-strong rounded-t-3xl border-t border-border p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Create a Vibe Room</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Room name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Late Night Vibes 🌙"
            className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-3 py-2 rounded-xl transition-all ${
                  category === c ? 'gradient-fire text-primary-foreground' : 'glass text-muted-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Private room (invite only)</span>
          </div>
          <button
            onClick={() => setIsPrivate(p => !p)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isPrivate ? 'left-5.5 left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <button
          onClick={() => { if (name.trim()) { onCreate(name, category, isPrivate); onClose(); } }}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-2xl font-bold transition-all ${
            name.trim() ? 'gradient-fire text-primary-foreground glow-red' : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          Create Room 🚀
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface VibeRoomsProps {
  onClose: () => void;
}

export default function VibeRooms({ onClose }: VibeRoomsProps) {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('All');
  const [rooms, setRooms] = useState(mockRooms);

  const filters = ['All', ...CATEGORIES];
  const filtered = filter === 'All' ? rooms : rooms.filter(r => r.category === filter);

  const handleCreate = (name: string, cat: string, priv: boolean) => {
    const newRoom = {
      id: `r${Date.now()}`,
      name, category: cat, isPrivate: priv,
      participants: 1, maxParticipants: 4,
      host: 'You', hostPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    };
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom.id);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65] bg-background flex flex-col"
      >
        {/* Header */}
        <div className="glass-strong border-b border-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-bold">Vibe Rooms 🎥</h2>
              <p className="text-xs text-muted-foreground">Group video chat, 2–4 people</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 gradient-fire text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hidden">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f ? 'gradient-fire text-primary-foreground' : 'glass text-muted-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pb-6 space-y-3">
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} onJoin={() => setActiveRoom(room.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-3">🏠</div>
              <p className="font-medium">No rooms yet</p>
              <p className="text-sm">Be the first to create one!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Active room overlay */}
      <AnimatePresence>
        {activeRoom && (
          <ActiveRoom
            roomName={rooms.find(r => r.id === activeRoom)?.name ?? 'Vibe Room'}
            onLeave={() => setActiveRoom(null)}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </>
  );
}
