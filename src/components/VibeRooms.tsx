import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, MicOff, Video, VideoOff, PhoneOff, Crown, Plus, Lock, Globe, X, Loader2, AlertCircle } from 'lucide-react';
import { Room, RoomEvent, Track, type RemoteTrack, type RemoteTrackPublication, type RemoteParticipant, type TrackPublication, type Participant } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const CATEGORIES = ['Chill & Talk 💬', 'Flirt Lounge 🔥', 'Speed Dating ⚡'];

interface VibeRoom {
  id: string;
  hostId: string;
  name: string;
  category: string;
  isPrivate: boolean;
  maxParticipants: number;
  currentParticipants: number;
  hostName: string;
  hostPhoto: string;
}

function mapRoom(r: Record<string, any>): VibeRoom {
  return {
    id: r.id,
    hostId: r.host_id,
    name: r.name,
    category: r.category,
    isPrivate: r.is_private,
    maxParticipants: r.max_participants,
    currentParticipants: r.current_participants,
    hostName: r.profiles?.display_name ?? 'User',
    hostPhoto: r.profiles?.avatar_url ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  };
}

function useVibeRooms() {
  const [rooms, setRooms] = useState<VibeRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('vibe_rooms')
        .select('id, host_id, name, category, is_private, max_participants, current_participants, profiles!host_id(display_name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRooms((data ?? []).map(mapRoom));
    } catch (err) {
      console.error('fetchRooms error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  return { rooms, loading, refetch: fetchRooms };
}

// ── Room list ─────────────────────────────────────────────────────────────────

function RoomCard({ room, onJoin, joining }: { room: VibeRoom; onJoin: () => void; joining: boolean }) {
  const isFull = room.currentParticipants >= room.maxParticipants;
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
              {room.currentParticipants}/{room.maxParticipants}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onJoin}
        disabled={isFull || joining}
        className={`flex-shrink-0 text-xs px-4 py-2 rounded-xl font-bold transition-all ${
          isFull ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'gradient-fire text-primary-foreground'
        }`}
      >
        {isFull ? 'Full' : joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join'}
      </button>
    </motion.div>
  );
}

// ── Active Room (real LiveKit group room) ──────────────────────────────────────

interface TileInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  cameraOn: boolean;
  isHost: boolean;
}

function ActiveRoom({ roomId, roomName, hostId, isPrivate, onLeave }: {
  roomId: string; roomName: string; hostId: string; isPrivate: boolean; onLeave: () => void;
}) {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [tiles, setTiles] = useState<TileInfo[]>([]);
  const [connState, setConnState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const roomRef = useRef<Room | null>(null);

  const upsertTile = useCallback((t: TileInfo) => {
    setTiles(prev => {
      const idx = prev.findIndex(p => p.identity === t.identity);
      if (idx === -1) return [...prev, t];
      const next = [...prev];
      next[idx] = { ...next[idx], ...t };
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let room: Room | null = null;

    async function connect() {
      if (!user) return;
      setConnState('connecting');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Brak sesji');

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ vibeRoomId: roomId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Nie udało się połączyć' }));
          throw new Error(err.error ?? 'Nie udało się połączyć');
        }
        const { token, wsUrl } = await res.json() as { token: string; wsUrl: string };
        if (cancelled) return;

        room = new Room();
        roomRef.current = room;

        const attachVideo = (identity: string, track: RemoteTrack) => {
          const container = document.getElementById(`vibe-tile-${identity}`);
          if (container) {
            container.innerHTML = '';
            const el = track.attach();
            el.className = 'w-full h-full object-cover';
            container.appendChild(el);
          }
        };

        room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
          upsertTile({ identity: p.identity, name: p.name || 'User', isLocal: false, isMuted: !p.isMicrophoneEnabled, cameraOn: p.isCameraEnabled, isHost: p.identity === hostId });
        });
        room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
          setTiles(prev => prev.filter(t => t.identity !== p.identity));
        });
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video) {
            attachVideo(participant.identity, track);
            upsertTile({ identity: participant.identity, name: participant.name || 'User', isLocal: false, isMuted: !participant.isMicrophoneEnabled, cameraOn: true, isHost: participant.identity === hostId });
          }
          if (track.kind === Track.Kind.Audio) track.attach();
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          track.detach();
          if (track.kind === Track.Kind.Video) upsertTile({ identity: participant.identity, name: participant.name || 'User', isLocal: false, isMuted: !participant.isMicrophoneEnabled, cameraOn: false, isHost: participant.identity === hostId });
        });
        room.on(RoomEvent.TrackMuted, (pub: TrackPublication, participant: Participant) => {
          if (pub.kind === Track.Kind.Audio) upsertTile({ identity: participant.identity, name: participant.name || 'User', isLocal: participant.identity === user.id, isMuted: true, cameraOn: participant.isCameraEnabled, isHost: participant.identity === hostId });
        });
        room.on(RoomEvent.TrackUnmuted, (pub: TrackPublication, participant: Participant) => {
          if (pub.kind === Track.Kind.Audio) upsertTile({ identity: participant.identity, name: participant.name || 'User', isLocal: participant.identity === user.id, isMuted: false, cameraOn: participant.isCameraEnabled, isHost: participant.identity === hostId });
        });
        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) onLeave();
        });

        await room.connect(wsUrl, token);
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true);

        if (cancelled) { room.disconnect(); return; }

        // Seed tiles: self + anyone already in the room before we joined.
        upsertTile({ identity: user.id, name: 'Ty', isLocal: true, isMuted: false, cameraOn: true, isHost: hostId === user.id });
        room.remoteParticipants.forEach((p) => {
          upsertTile({ identity: p.identity, name: p.name || 'User', isLocal: false, isMuted: !p.isMicrophoneEnabled, cameraOn: p.isCameraEnabled, isHost: p.identity === hostId });
        });

        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.videoTrack) {
          const container = document.getElementById(`vibe-tile-${user.id}`);
          if (container) {
            container.innerHTML = '';
            const el = camPub.videoTrack.attach();
            el.className = 'w-full h-full object-cover scale-x-[-1]';
            container.appendChild(el);
          }
        }

        setConnState('connected');
      } catch (err) {
        console.error('Vibe room connect failed:', err);
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Nie udało się połączyć');
          setConnState('error');
        }
      }
    }

    connect();
    return () => {
      cancelled = true;
      room?.disconnect();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const toggleMute = useCallback(async () => {
    const next = !isMuted;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
    if (user) upsertTile({ identity: user.id, name: 'Ty', isLocal: true, isMuted: next, cameraOn: !isCamOff, isHost: hostId === user.id });
  }, [isMuted, isCamOff, user, hostId, upsertTile]);

  const toggleCamera = useCallback(async () => {
    const next = !isCamOff;
    await roomRef.current?.localParticipant.setCameraEnabled(!next);
    setIsCamOff(next);
  }, [isCamOff]);

  const handleLeave = async () => {
    roomRef.current?.disconnect();
    try { await db.rpc('leave_vibe_room', { p_room_id: roomId }); } catch { /* silent */ }
    onLeave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
    >
      <div className="glass-strong border-b border-border px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{roomName}</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-xs text-emerald-400">
              {connState === 'connected' ? `Live · ${tiles.length} ${tiles.length === 1 ? 'osoba' : 'osoby'}` : connState === 'error' ? 'Błąd połączenia' : 'Łączenie…'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPrivate ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Globe className="w-4 h-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{isPrivate ? 'Prywatny' : 'Publiczny'}</span>
        </div>
      </div>

      {connState === 'error' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      ) : (
        <div className="flex-1 p-3 grid grid-cols-2 gap-3 content-start overflow-y-auto scrollbar-hidden">
          {tiles.map((t, i) => (
            <motion.div
              key={t.identity}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-2xl overflow-hidden h-40 bg-secondary"
            >
              <div id={`vibe-tile-${t.identity}`} className="w-full h-full" />
              {!t.cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <VideoOff className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-3 flex items-center gap-2">
                <span className="text-xs font-bold text-primary-foreground">{t.name}</span>
                {t.isHost && (
                  <div className="w-4 h-4 gradient-fire rounded-full flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              {t.isMuted && (
                <div className="absolute bottom-2 right-3 w-6 h-6 bg-destructive/80 rounded-full flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {connState === 'connecting' && (
            <div className="col-span-2 flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Łączenie…
            </div>
          )}
        </div>
      )}

      <div className="glass-strong border-t border-border px-6 py-5 flex items-center justify-between">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-destructive' : 'glass'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-primary-foreground" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleLeave}
          className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center"
        >
          <PhoneOff className="w-7 h-7 text-primary-foreground" />
        </button>

        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCamOff ? 'bg-destructive' : 'glass'}`}
        >
          {isCamOff ? <VideoOff className="w-5 h-5 text-primary-foreground" /> : <Video className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}

// ── Create Room Modal ─────────────────────────────────────────────────────────

function CreateRoomModal({ onClose, onCreate, creating }: { onClose: () => void; onCreate: (name: string, cat: string, priv: boolean) => void; creating: boolean }) {
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
            <span className="text-sm">Private room (link only, unlisted)</span>
          </div>
          <button
            onClick={() => setIsPrivate(p => !p)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isPrivate ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <button
          onClick={() => { if (name.trim() && !creating) onCreate(name, category, isPrivate); }}
          disabled={!name.trim() || creating}
          className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
            name.trim() && !creating ? 'gradient-fire text-primary-foreground glow-red' : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Room 🚀'}
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
  const { user } = useAuth();
  const { rooms, loading, refetch } = useVibeRooms();
  const [activeRoom, setActiveRoom] = useState<VibeRoom | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('All');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filters = ['All', ...CATEGORIES];
  const filtered = filter === 'All' ? rooms : rooms.filter(r => r.category === filter);

  const handleJoin = async (room: VibeRoom) => {
    if (!user || joiningId) return;
    setJoiningId(room.id);
    try {
      const { error } = await db.rpc('join_vibe_room', { p_room_id: room.id });
      if (error) throw error;
      setActiveRoom(room);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('room_full')) toast.error('Pokój jest pełny');
      else if (msg.includes('room_not_found')) toast.error('Pokój już się zakończył');
      else toast.error('Nie udało się dołączyć do pokoju');
      refetch();
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreate = async (name: string, category: string, isPrivate: boolean) => {
    setCreating(true);
    try {
      const { data, error } = await db.rpc('create_vibe_room', { p_name: name, p_category: category, p_is_private: isPrivate, p_max_participants: 4 });
      if (error) throw error;
      const room = Array.isArray(data) ? data[0] : data;
      setShowCreate(false);
      setActiveRoom(mapRoom({ ...room, profiles: null }));
    } catch {
      toast.error('Nie udało się utworzyć pokoju');
    } finally {
      setCreating(false);
    }
  };

  const handleLeaveActive = () => {
    setActiveRoom(null);
    refetch();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65] bg-background flex flex-col"
      >
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

        <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pb-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-3">🏠</div>
              <p className="font-medium">No rooms yet</p>
              <p className="text-sm">Be the first to create one!</p>
            </div>
          ) : (
            filtered.map(room => (
              <RoomCard key={room.id} room={room} joining={joiningId === room.id} onJoin={() => handleJoin(room)} />
            ))
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {activeRoom && (
          <ActiveRoom
            roomId={activeRoom.id}
            roomName={activeRoom.name}
            hostId={activeRoom.hostId}
            isPrivate={activeRoom.isPrivate}
            onLeave={handleLeaveActive}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreate} creating={creating} />
        )}
      </AnimatePresence>
    </>
  );
}
