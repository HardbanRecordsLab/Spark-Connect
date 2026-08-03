import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Users, Video, Heart, X,
  Calendar, Timer, Mic, MicOff, VideoOff, Loader2, AlertCircle, Wifi,
} from 'lucide-react';
import { Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
import { toast } from 'sonner';
import AdBanner from '@/components/AdBanner';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/hooks/useAuth';
import { useRouletteMatch } from '@/hooks/useRouletteMatch';
import { supabase } from '@/integrations/supabase/client';
import { triggerPush } from '@/hooks/useConversations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface SDEvent {
  id: string;
  title: string;
  emoji: string;
  category: string;
  start_time: string;
  round_minutes: number;
  rounds: number;
  capacity: number;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Teraz!';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  return `${days[date.getDay()]}, ${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// A round joins 5 min before start_time and stays open through the
// whole event window (start_time .. start_time + rounds*round_minutes).
function joinWindow(event: SDEvent): { canJoin: boolean; ms: number } {
  const start = new Date(event.start_time).getTime();
  const end = start + event.rounds * event.round_minutes * 60 * 1000;
  const now = Date.now();
  return { canJoin: now >= start - 5 * 60 * 1000 && now <= end, ms: start - now };
}

// ── EventCard ─────────────────────────────────────────────────
function EventCard({ event, registered, spotsLeft, onToggleRegister, onJoin, busy }: {
  event: SDEvent; registered: boolean; spotsLeft: number;
  onToggleRegister: () => void; onJoin: () => void; busy: boolean;
}) {
  const [, forceTick] = useState(0);
  useEffect(() => { const t = setInterval(() => forceTick(v => v + 1), 1000); return () => clearInterval(t); }, []);
  const { canJoin, ms } = joinWindow(event);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-border">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl gradient-fire flex items-center justify-center text-2xl flex-shrink-0">{event.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{event.title}</h3>
          <p className="text-xs text-muted-foreground">{event.category}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${spotsLeft <= 3 ? 'bg-destructive/20 text-destructive' : 'glass text-muted-foreground'}`}>
          {spotsLeft > 0 ? `${spotsLeft} miejsc` : 'Pełne'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="glass rounded-xl p-2 text-center">
          <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{formatDate(event.start_time)}</p>
        </div>
        <div className="glass rounded-xl p-2 text-center">
          <Clock className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{formatTime(event.start_time)}</p>
        </div>
        <div className="glass rounded-xl p-2 text-center">
          <Users className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{event.capacity - spotsLeft} os.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer className="w-3.5 h-3.5" />
          <span>{event.rounds} rund × {event.round_minutes} min</span>
        </div>
        <span className={canJoin ? 'text-primary font-bold animate-pulse text-xs' : 'text-muted-foreground text-xs'}>
          {canJoin ? '🟢 Możesz dołączyć!' : `⏰ ${formatCountdown(ms)}`}
        </span>
      </div>

      {registered ? (
        <button onClick={canJoin ? onJoin : onToggleRegister} disabled={busy}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
            canJoin ? 'gradient-fire text-primary-foreground glow-red' : 'glass text-muted-foreground'
          }`}>
          <Video className="w-4 h-4" />
          {canJoin ? 'Dołącz teraz!' : 'Zapisano — anuluj zapis'}
        </button>
      ) : (
        <button onClick={onToggleRegister} disabled={busy || spotsLeft === 0}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
            spotsLeft > 0 ? 'gradient-fire text-primary-foreground' : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}>
          {spotsLeft > 0 ? '+ Zapisz się (bezpłatnie)' : 'Brak miejsc'}
        </button>
      )}
    </motion.div>
  );
}

// ── Live session (real pairing + real LiveKit video) ────────────
function LiveSession({ event, onExit }: { event: SDEvent; onExit: (matchedNames: string[]) => void }) {
  const { user } = useAuth();
  const { status, sessionId, peer, search, skip, leave } = useRouletteMatch(user?.id, event.id);
  const [connState, setConnState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(event.round_minutes * 60);
  const [liking, setLiking] = useState(false);
  const [likedThisRound, setLikedThisRound] = useState(false);
  const matchedNamesRef = useRef<string[]>([]);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { search(); }, [search]);

  const nextRound = useCallback(() => {
    roomRef.current?.disconnect();
    setLikedThisRound(false);
    if (round >= event.rounds) {
      leave();
      onExit(matchedNamesRef.current);
      return;
    }
    setRound(r => r + 1);
    setTimeLeft(event.round_minutes * 60);
    skip();
  }, [round, event.rounds, event.round_minutes, skip, leave, onExit]);

  // Round countdown -> auto-advance
  useEffect(() => {
    if (status !== 'matched') return;
    setTimeLeft(event.round_minutes * 60);
    const t = setInterval(() => {
      setTimeLeft(s => { if (s <= 1) { clearInterval(t); nextRound(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sessionId]);

  // LiveKit connection
  useEffect(() => {
    let cancelled = false;
    let room: Room | null = null;
    async function connect() {
      if (status !== 'matched' || !sessionId) return;
      setConnState('connecting');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Brak sesji');
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ rouletteSessionId: sessionId }),
        });
        if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Nie udało się połączyć' })); throw new Error(err.error ?? 'Nie udało się połączyć'); }
        const { token, wsUrl } = await res.json() as { token: string; wsUrl: string };
        if (cancelled) return;
        room = new Room();
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video && remoteContainerRef.current) {
            const el = track.attach();
            el.className = 'w-full h-full object-cover';
            remoteContainerRef.current.innerHTML = '';
            remoteContainerRef.current.appendChild(el);
            setConnState('connected');
          }
          if (track.kind === Track.Kind.Audio) track.attach();
        });
        room.on(RoomEvent.ParticipantDisconnected, () => { if (!cancelled) nextRound(); });
        await room.connect(wsUrl, token);
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true);
        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.videoTrack && localVideoRef.current) camPub.videoTrack.attach(localVideoRef.current);
      } catch (err) {
        if (!cancelled) { setErrorMsg(err instanceof Error ? err.message : 'Nie udało się połączyć'); setConnState('error'); }
      }
    }
    connect();
    return () => { cancelled = true; room?.disconnect(); roomRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sessionId]);

  const handleLike = async () => {
    if (!peer || liking || likedThisRound) return;
    setLiking(true);
    const { data, error } = await db.rpc('record_swipe', { p_swiped_id: peer.id, p_direction: 'right' });
    setLiking(false);
    setLikedThisRound(true);
    if (error) { toast.error('Nie udało się zapisać polubienia.'); return; }
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.matched) {
      matchedNamesRef.current = [...matchedNamesRef.current, peer.displayName];
      toast.success(`To dopasowanie z ${peer.displayName}! 🔥`);
      triggerPush(peer.id, 'Nowe dopasowanie 🔥', 'Masz nowe dopasowanie! Napisz pierwszy/a.', '/');
    } else {
      toast.success(`Polubiono ${peer.displayName} 💚`);
    }
  };

  const toggleMute = async () => { const next = !isMuted; await roomRef.current?.localParticipant.setMicrophoneEnabled(!next); setIsMuted(next); };
  const toggleCamera = async () => { const next = !isCameraOff; await roomRef.current?.localParticipant.setCameraEnabled(!next); setIsCameraOff(next); };
  const handleExit = () => { roomRef.current?.disconnect(); leave(); onExit(matchedNamesRef.current); };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="h-1.5 bg-secondary flex-shrink-0">
        <motion.div className={`h-full ${timeLeft <= 20 ? 'bg-destructive' : 'bg-primary'}`}
          animate={{ width: `${(timeLeft / (event.round_minutes * 60)) * 100}%` }} transition={{ type: 'tween', duration: 1 }} />
      </div>
      <div className="flex items-center justify-between px-5 py-3 glass-strong flex-shrink-0">
        <div>
          <p className="text-xs text-muted-foreground">Runda {round} / {event.rounds}</p>
          <p className="font-bold">{status === 'matched' && peer ? peer.displayName : 'Szukam...'}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${timeLeft <= 20 ? 'bg-destructive/20 border border-destructive/40' : 'glass'}`}>
          <Timer className={`w-3.5 h-3.5 ${timeLeft <= 20 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
          <span className={`text-sm font-bold tabular-nums ${timeLeft <= 20 ? 'text-destructive' : 'text-primary'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        {status === 'searching' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-white/80 text-sm">Szukam partnera na tę rundę…</p>
          </div>
        )}

        {status === 'matched' && peer && (
          <>
            <div ref={remoteContainerRef} className="absolute inset-0 flex items-center justify-center bg-black" />
            {connState !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95">
                <img src={peer.photos?.[0]} alt="" className="w-24 h-24 rounded-full object-cover opacity-70" />
                {connState === 'error' ? (
                  <div className="flex flex-col items-center gap-2 px-8 text-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <p className="text-sm text-destructive">{errorMsg}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white/80">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Łączenie z {peer.displayName}…</span>
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-border shadow-xl bg-secondary">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {isCameraOff && <div className="absolute inset-0 flex items-center justify-center bg-secondary"><VideoOff className="w-5 h-5 text-muted-foreground" /></div>}
            </div>
            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium">{connState === 'connected' ? 'Połączono' : '…'}</span>
            </div>
          </>
        )}
      </div>

      <div className="px-6 py-5 glass-strong flex-shrink-0">
        <div className="flex items-center justify-center gap-5">
          <button onClick={nextRound} className="w-14 h-14 glass rounded-full flex items-center justify-center border border-destructive/30">
            <X className="w-6 h-6 text-destructive" />
          </button>
          <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-destructive' : 'glass'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={handleLike} disabled={liking || likedThisRound || status !== 'matched'}
            className="w-14 h-14 gradient-fire rounded-full flex items-center justify-center glow-red disabled:opacity-50">
            <Heart className={`w-6 h-6 text-primary-foreground ${likedThisRound ? 'fill-primary-foreground' : ''}`} />
          </button>
          <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-destructive' : 'glass'}`}>
            {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">💚 Like = chcesz się spotkać ponownie</p>
        <button onClick={handleExit} className="w-full mt-3 text-xs text-muted-foreground underline">Zakończ sesję</button>
      </div>
    </div>
  );
}

// ── Results screen ─────────────────────────────────────────────
function Results({ matches, totalRounds, onClose }: { matches: string[]; totalRounds: number; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="text-6xl">
          {matches.length > 0 ? '🔥' : '💪'}
        </motion.div>
        <h2 className="text-2xl font-black">{matches.length > 0 ? `${matches.length} dopasowań!` : 'Dobra próba!'}</h2>
        <p className="text-muted-foreground">Rozmawiałeś/aś z maks. {totalRounds} osobami</p>
        {matches.length > 0 && (
          <div className="w-full glass rounded-2xl p-4 border border-primary/20">
            <p className="text-sm font-semibold mb-3 text-primary">Wzajemne dopasowania 💚</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {matches.map(name => <span key={name} className="glass px-3 py-1.5 rounded-full text-sm font-medium border border-primary/30">{name}</span>)}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Dopasowania pojawiły się w Twoich wiadomościach</p>
      </div>
      <div className="px-6 pb-10 space-y-3">
        <AdBanner placement="interstitial" onClose={() => {}} />
        <button onClick={onClose} className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl">Przejdź do wiadomości 💬</button>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────
interface SpeedDatingProps { onClose: () => void }

export default function SpeedDating({ onClose }: SpeedDatingProps) {
  const { user } = useAuth();
  const { setActiveTab } = useAppStore();
  const [events, setEvents] = useState<SDEvent[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [spotsByEvent, setSpotsByEvent] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [liveEvent, setLiveEvent] = useState<SDEvent | null>(null);
  const [results, setResults] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: eventRows }, { data: regRows }] = await Promise.all([
      db.from('speed_dating_events').select('*').order('start_time', { ascending: true }),
      db.from('speed_dating_registrations').select('event_id, user_id'),
    ]);
    const rows: SDEvent[] = eventRows ?? [];
    setEvents(rows);
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    for (const r of (regRows ?? []) as { event_id: string; user_id: string }[]) {
      counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
      if (r.user_id === user?.id) mine.add(r.event_id);
    }
    const spots: Record<string, number> = {};
    for (const e of rows) spots[e.id] = e.capacity - (counts[e.id] ?? 0);
    setSpotsByEvent(spots);
    setRegisteredIds(mine);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const toggleRegister = async (event: SDEvent) => {
    if (!user || busyId) return;
    setBusyId(event.id);
    const isRegistered = registeredIds.has(event.id);
    const { error } = isRegistered
      ? await db.from('speed_dating_registrations').delete().eq('event_id', event.id).eq('user_id', user.id)
      : await db.from('speed_dating_registrations').insert({ event_id: event.id, user_id: user.id });
    setBusyId(null);
    if (error) { toast.error(error.message?.includes('pełne') ? 'To wydarzenie jest już pełne.' : 'Coś poszło nie tak.'); return; }
    await load();
  };

  if (liveEvent) {
    return <LiveSession event={liveEvent} onExit={names => { setLiveEvent(null); setResults(names); }} />;
  }

  if (results) {
    return <Results matches={results} totalRounds={4} onClose={() => { setResults(null); setActiveTab('chats'); onClose(); }} />;
  }

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-40 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 glass-strong border-b border-border">
        <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h2 className="font-bold">Speed Dating</h2>
          <p className="text-xs text-muted-foreground">Wirtualne randki wideo — prawdziwe dopasowania</p>
        </div>
        <div className="glass px-2.5 py-1 rounded-full"><span className="text-xs text-primary font-medium">Bezpłatne</span></div>
      </div>

      <div className="mx-4 mt-4 glass rounded-2xl p-4 border border-primary/10">
        <p className="text-xs font-semibold text-primary mb-2">Jak to działa?</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{ emoji: '📋', label: 'Zapisz się' }, { emoji: '⚡', label: 'Rozmowy wideo' }, { emoji: '💚', label: 'Like = match' }].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hidden">
        <AdBanner placement="discover" />
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">Brak zaplanowanych wydarzeń.</div>
        ) : (
          events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              registered={registeredIds.has(event.id)}
              spotsLeft={spotsByEvent[event.id] ?? event.capacity}
              busy={busyId === event.id}
              onToggleRegister={() => toggleRegister(event)}
              onJoin={() => setLiveEvent(event)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
