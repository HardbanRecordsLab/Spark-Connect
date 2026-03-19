import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Play, Loader2, Camera, Film, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useNSFWCheck } from '@/hooks/useNSFWCheck';
import type { User } from '@supabase/supabase-js';

const MAX_PHOTOS = 4;

interface Props {
  photos: string[];
  profileVideo: string | null;
  userId: string;
  user: User | null;
  onPhotosChange: (photos: string[]) => void;
  onVideoChange: (url: string | null) => void;
  updateProfile: (updates: Record<string, unknown>) => Promise<unknown>;
}

export default function ProfilePhotoGallery({
  photos,
  profileVideo,
  userId,
  user,
  onPhotosChange,
  onVideoChange,
  updateProfile,
}: Props) {
  const { upload: uploadToR2 } = useR2Upload();
  const [uploading, setUploading] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [nsfwWarning, setNsfwWarning] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<number>(0);
  const { checkFile } = useNSFWCheck();

  const handleAddPhoto = (slot: number) => {
    pendingSlotRef.current = slot;
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const slot = pendingSlotRef.current;

    // NSFW check before upload
    setUploading(`checking-${slot}`);
    const nsfw = await checkFile(file);
    if (nsfw.result === 'unsafe') {
      setUploading(null);
      setNsfwWarning('To zdjęcie nie spełnia naszych zasad. Użyj innego zdjęcia.');
      if (e.target) e.target.value = '';
      return;
    }
    if (nsfw.result === 'uncertain') {
      // Allow upload but flag for human review — don't block user
      console.warn('Photo flagged for review:', nsfw.reason);
    }

    setUploading(`photo-${slot}`);
    try {
      const { publicUrl } = await uploadToR2({ bucket: 'avatars', file, filename: file.name });
      const newPhotos = [...photos];
      newPhotos[slot] = publicUrl;
      const trimmed = newPhotos.slice(0, MAX_PHOTOS);
      onPhotosChange(trimmed);
      const updates: Record<string, unknown> = { photos: trimmed };
      if (slot === 0) updates.avatar_url = publicUrl;
      await updateProfile(updates);
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Upload nie powiódł się. Spróbuj ponownie.');
    }
    setUploading(null);
    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = async (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    const updates: Record<string, unknown> = { photos: newPhotos };
    if (index === 0 && newPhotos.length > 0) updates.avatar_url = newPhotos[0];
    else if (index === 0) updates.avatar_url = '';
    await updateProfile(updates);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // max 30 MB
    if (file.size > 30 * 1024 * 1024) {
      alert('Video max 30 MB');
      return;
    }
    setUploading('video');
    try {
      const { publicUrl } = await uploadToR2({ bucket: 'chat-media', file, filename: file.name });
            const videoPhotos = photos.filter(p => !p.startsWith('video:'));
      const withVideo = [...videoPhotos.slice(0, MAX_PHOTOS), `video:${publicUrl}`];
      await updateProfile({ photos: withVideo });
    } catch (err) {
      console.error('Video upload failed:', err);
      alert('Upload wideo nie powiódł się.');
    }
    setUploading(null);
    if (e.target) e.target.value = '';
  };

  const handleRemoveVideo = async () => {
    onVideoChange(null);
    const withoutVideo = photos.filter(p => !p.startsWith('video:'));
    await updateProfile({ photos: withoutVideo });
  };

  const displayPhotos = photos.filter(p => !p.startsWith('video:'));
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => displayPhotos[i] ?? null);

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3">Zdjęcia ({displayPhotos.length}/{MAX_PHOTOS})</p>

      {/* NSFW warning */}
      <AnimatePresence>
        {nsfwWarning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 glass border border-destructive/30 rounded-xl p-3 mb-3"
          >
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive flex-1">{nsfwWarning}</p>
            <button onClick={() => setNsfwWarning(null)} className="text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {slots.map((photo, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden bg-secondary"
          >
            {photo ? (
              <>
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightbox(photo)}
                />
                {uploading === `photo-${i}` && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
                <button
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-foreground" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-xs bg-primary/80 text-primary-foreground px-2 py-0.5 rounded-full">
                    Main
                  </span>
                )}
              </>
            ) : (
              <button
                onClick={() => handleAddPhoto(i)}
                disabled={!!uploading}
                className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              >
                {uploading === `photo-${i}` ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">Add photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Profile video */}
      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Film className="w-4 h-4 text-primary" />
        Profile video <span className="text-xs text-muted-foreground font-normal">(max 30s, 30MB)</span>
      </p>
      {profileVideo ? (
        <div className="relative rounded-xl overflow-hidden bg-secondary aspect-video">
          {videoPlaying ? (
            <video
              src={profileVideo}
              autoPlay
              controls
              className="w-full h-full object-cover"
              onEnded={() => setVideoPlaying(false)}
            />
          ) : (
            <div className="relative w-full h-full">
              <video src={profileVideo} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm cursor-pointer"
                onClick={() => setVideoPlaying(true)}
              >
                <div className="w-12 h-12 gradient-fire rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                </div>
              </div>
            </div>
          )}
          {uploading === 'video' && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          <button
            onClick={handleRemoveVideo}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={!!uploading}
          className="w-full flex items-center justify-center gap-3 glass border border-dashed border-border rounded-xl py-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          {uploading === 'video' ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload profile video</span>
            </>
          )}
        </button>
      )}

      {/* Hidden inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              src={lightbox}
              alt="Preview"
              className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center"
              onClick={() => setLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
