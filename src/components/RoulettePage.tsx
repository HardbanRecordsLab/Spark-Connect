import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Wifi, Loader2, AlertCircle } from 'lucide-react';
import { Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRouletteMatch } from '@/hooks/useRouletteMatch';
import AdBanner from '@/components/AdBanner';

export default function RoulettePage() {
  const { user } = useAuth();
  const { status, sessionId, peer, search, skip, leave } = useRouletteMatch(user?.id);
  const [connState, setConnState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  // Connect to LiveKit whenever we get matched into a session.
  useEffect(() => {
    let cancelled = false;
    let room: Room | null = null;

    async function connect() {
      if (status !== 'matched' || !sessionId) return;
      setConnState('connecting');
      setCallDuration(0);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Brak sesji');
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ rouletteSessionId: sessionId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Nie udało się połączyć' }));
          throw new Error(err.error ?? 'Nie udało się połączyć');
        }
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
        room.on(RoomEvent.ParticipantDisconnected, () => { if (!cancelled) skip(); });

        await room.connect(wsUrl, token);
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true);
        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.videoTrack && localVideoRef.current) camPub.videoTrack.attach(localVideoRef.current);
      } catch (err) {
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
  }, [status, sessionId]);

  useEffect(() => {
    if (connState !== 'connected' || status !== 'matched') return;
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [connState, status]);

  const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const toggleMute = useCallback(async () => {
    const next = !isMuted;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    const next = !isCameraOff;
    await roomRef.current?.localParticipant.setCameraEnabled(!next);
    setIsCameraOff(next);
  }, [isCameraOff]);

  const handleSkip = () => { roomRef.current?.disconnect(); skip(); };
  const handleEnd = () => { roomRef.current?.disconnect(); leave(); setShowInterstitial(true); };

  return (
    <div className="h-full flex flex-col bg-radial-glow">
      <AnimatePresence>
        {showInterstitial && <AdBanner placement="interstitial" onClose={() => setShowInterstitial(false)} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8"
          >
            <div className="relative">
              <motion.div className="w-32 h-32 rounded-full gradient-fire flex items-center justify-center text-6xl"
                animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>⚡</motion.div>
              <div className="absolute -inset-2 rounded-full gradient-fire opacity-20 blur-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Spark Roulette</h1>
              <p className="text-muted-foreground leading-relaxed">
                Prawdziwa, losowa wideo-rozmowa z inną osobą online. Naciśnij Start, żeby dołączyć do kolejki.
              </p>
            </div>
            <button onClick={search}
              className="w-full gradient-fire text-primary-foreground font-bold text-lg py-4 rounded-2xl glow-red active:scale-95 transition-transform">
              Start Roulette ⚡
            </button>
            <AdBanner placement="roulette" />
          </motion.div>
        )}

        {status === 'searching' && (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-6"
          >
            <div className="relative">
              <motion.div className="w-28 h-28 rounded-full border-4 border-primary/30"
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
              <motion.div className="absolute inset-3 rounded-full border-4 border-primary"
                animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />
              <div className="absolute inset-0 flex items-center justify-center text-4xl">⚡</div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Szukam kogoś dla Ciebie…</h2>
              <p className="text-muted-foreground text-sm">Poczekaj, aż ktoś dołączy</p>
            </div>
            <button onClick={leave} className="glass px-6 py-3 rounded-xl text-sm text-muted-foreground">
              Anuluj
            </button>
          </motion.div>
        )}

        {status === 'matched' && peer && (
          <motion.div key="matched" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 relative bg-black">
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

            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70 pointer-events-none" />

            <div className="absolute top-16 right-4 w-28 h-36 rounded-2xl overflow-hidden glass border border-white/10 bg-secondary">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <VideoOff className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium">{connState === 'connected' ? formatDur(callDuration) : '…'}</span>
            </div>

            <div className="absolute top-4 left-0 right-0 flex flex-col items-center pointer-events-none">
              <p className="font-bold text-lg text-white">{peer.displayName}{peer.age ? `, ${peer.age}` : ''}</p>
              {peer.city && <p className="text-sm text-white/70">{peer.city}</p>}
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-destructive' : 'glass'}`}>
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
              </button>
              <button onClick={handleSkip} className="glass px-6 py-4 rounded-2xl font-semibold text-sm">
                Następna ➡️
              </button>
              <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-destructive' : 'glass'}`}>
                {isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6" />}
              </button>
            </div>
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              <button onClick={handleEnd} className="bg-destructive text-destructive-foreground px-8 py-2.5 rounded-full text-sm font-semibold">
                Zakończ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
