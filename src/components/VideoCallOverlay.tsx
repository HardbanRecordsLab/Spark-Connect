import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Smile, Loader2, AlertCircle } from 'lucide-react';
import { Room, RoomEvent, Track, type RemoteTrack, type RemoteTrackPublication, type RemoteParticipant } from 'livekit-client';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { ringUser } from '@/hooks/useCallSignaling';

const floatingEmojis = ['❤️', '🔥', '😍', '💕', '✨', '💋'];

type ConnectionState = 'connecting' | 'waiting' | 'connected' | 'error';

export default function VideoCallOverlay() {
  const { videoCallUser, videoCallMatchId, videoCallDirection, endVideoCall } = useAppStore();
  const { user } = useAuth();
  const { profile: myProfile } = useProfile(user);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [emojis, setEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [connState, setConnState] = useState<ConnectionState>('connecting');
  const [errorMsg, setErrorMsg] = useState('');

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let room: Room | null = null;

    async function connect() {
      if (!videoCallMatchId || !videoCallUser || !user) return;
      setConnState('connecting');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Brak sesji');

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ matchId: videoCallMatchId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Nie udało się połączyć' }));
          throw new Error(err.error ?? 'Nie udało się połączyć');
        }
        const { token, wsUrl } = await res.json() as { token: string; wsUrl: string };
        if (cancelled) return;

        room = new Room();
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, _p: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video && remoteContainerRef.current) {
            const el = track.attach();
            el.className = 'w-full h-full object-cover';
            remoteContainerRef.current.innerHTML = '';
            remoteContainerRef.current.appendChild(el);
            setConnState('connected');
          }
          if (track.kind === Track.Kind.Audio) track.attach();
        });
        room.on(RoomEvent.ParticipantDisconnected, () => {
          if (!cancelled) endVideoCall();
        });
        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) endVideoCall();
        });

        await room.connect(wsUrl, token);
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true);

        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.videoTrack && localVideoRef.current) {
          camPub.videoTrack.attach(localVideoRef.current);
        }

        if (cancelled) { room.disconnect(); return; }
        setConnState(prev => (prev === 'connected' ? prev : 'waiting'));

        // If this is the outgoing side, notify the other person now
        // that we're actually in the room and ready.
        if (videoCallDirection === 'outgoing') {
          ringUser(videoCallUser.id, videoCallMatchId, {
            id: user.id,
            displayName: myProfile?.displayName ?? 'User',
            photos: myProfile?.photos ?? [],
          });
        }
      } catch (err) {
        console.error('Video call connect failed:', err);
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
  }, [videoCallMatchId]);

  useEffect(() => {
    if (connState !== 'connected') return;
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [connState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const sendEmoji = (emoji: string) => {
    const id = Date.now();
    setEmojis(prev => [...prev, { id, emoji, x: Math.random() * 70 + 15 }]);
    setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), 2000);
    roomRef.current?.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ emoji })), { reliable: true });
  };

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

  const handleEnd = () => {
    roomRef.current?.disconnect();
    endVideoCall();
  };

  if (!videoCallUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="relative w-full h-full bg-black">
        {/* Remote video */}
        <div ref={remoteContainerRef} className="absolute inset-0 flex items-center justify-center bg-black" />

        {connState !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95">
            <img src={videoCallUser.photos?.[0]} alt="" className="w-24 h-24 rounded-full object-cover opacity-70" />
            {connState === 'error' ? (
              <div className="flex flex-col items-center gap-2 px-8 text-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-destructive">{errorMsg}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/80">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">{connState === 'connecting' ? 'Łączenie…' : `Dzwonię do ${videoCallUser.displayName}…`}</span>
              </div>
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70 pointer-events-none" />

        {emojis.map(e => (
          <motion.div
            key={e.id}
            className="absolute bottom-32 text-3xl pointer-events-none"
            style={{ left: `${e.x}%` }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -200, opacity: 0, scale: 1.2 }}
            transition={{ duration: 1.8 }}
          >
            {e.emoji}
          </motion.div>
        ))}

        <button className="absolute top-4 left-4 glass px-3 py-2 rounded-xl text-xs text-destructive border border-destructive/30 font-bold">
          🚨 PANIC
        </button>

        <div className="absolute top-4 left-0 right-0 flex flex-col items-center pointer-events-none">
          <p className="font-bold text-lg text-white">{videoCallUser.displayName}</p>
          <p className="text-sm text-white/70">{connState === 'connected' ? formatDuration(callDuration) : ''}</p>
        </div>

        {/* Self view */}
        <div className="absolute top-16 right-4 w-28 h-36 rounded-2xl overflow-hidden glass border border-white/10 bg-secondary">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="absolute bottom-36 left-4 flex gap-2">
          {floatingEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => sendEmoji(emoji)}
              className="w-9 h-9 glass rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-destructive' : 'glass'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
          </button>

          <button onClick={handleEnd} className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center">
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-destructive' : 'glass'}`}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
