import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Eye, X, Check, Image as ImageIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useR2Upload, getPrivatePhotoUrl } from '@/hooks/useR2Upload';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type AccessStatus = 'none' | 'pending' | 'granted' | 'rejected';

interface PrivatePhoto {
  id: string;
  signedUrl: string;
}

// Resolve signed URLs for a batch of private photo ids in parallel.
// Any photo whose signed URL fails to resolve (e.g. access revoked
// between listing and fetch) is silently dropped rather than shown broken.
async function resolvePhotoUrls(ids: string[]): Promise<PrivatePhoto[]> {
  const results = await Promise.allSettled(ids.map(id => getPrivatePhotoUrl(id)));
  return ids
    .map((id, i) => {
      const r = results[i];
      return r.status === 'fulfilled' ? { id, signedUrl: r.value } : null;
    })
    .filter((p): p is PrivatePhoto => p !== null);
}

// ── Component used on OTHER user's profile ─────────────────────
interface PrivatePhotoViewerProps {
  ownerId: string;
  ownerName: string;
  ownerPhoto: string;
}

export function PrivatePhotoViewer({ ownerId, ownerName, ownerPhoto }: PrivatePhotoViewerProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccessStatus>('none');
  const { upload: uploadToR2 } = useR2Upload();
  const [photos, setPhotos] = useState<PrivatePhoto[]>([]);
  const [count, setCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !ownerId) return;
    loadStatus();
    loadCount();
  }, [user, ownerId]);

  const loadStatus = async () => {
    const { data } = await db
      .from('private_photo_requests')
      .select('status')
      .eq('requester_id', user!.id)
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (data) {
      setStatus(data.status as AccessStatus);
      if (data.status === 'granted') loadPhotos();
    }
  };

  const loadCount = async () => {
    const { count: c } = await db
      .from('private_photos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ownerId);
    setCount(c ?? 0);
  };

  const loadPhotos = async () => {
    const { data } = await db
      .from('private_photos')
      .select('id')
      .eq('user_id', ownerId)
      .order('created_at', { ascending: false });
    setPhotos(await resolvePhotoUrls((data ?? []).map((p: { id: string }) => p.id)));
  };

  const requestAccess = async () => {
    if (!user || sending) return;
    setSending(true);
    await db.from('private_photo_requests').upsert({
      requester_id: user.id,
      owner_id: ownerId,
      status: 'pending',
      created_at: new Date().toISOString(),
    }, { onConflict: 'requester_id,owner_id' });
    setStatus('pending');
    setSending(false);
  };

  if (count === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Prywatne zdjęcia 🔒</p>
        <span className="ml-auto text-xs text-muted-foreground">{count} zdjęć</span>
      </div>

      {status === 'none' && (
        <div className="text-center">
          {/* Blurred preview grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[...Array(Math.min(count, 3))].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-secondary/80 overflow-hidden flex items-center justify-center relative">
                <img src={ownerPhoto} alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-60" />
                <Lock className="w-5 h-5 text-muted-foreground absolute" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {ownerName} ma prywatne zdjęcia. Wyślij prośbę o dostęp.
          </p>
          <button
            onClick={requestAccess}
            disabled={sending}
            className="w-full gradient-fire text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {sending ? '...' : <><Eye className="w-4 h-4" /> Poproś o dostęp</>}
          </button>
        </div>
      )}

      {status === 'pending' && (
        <div className="text-center py-3">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div className="text-3xl mb-2">⏳</div>
          </motion.div>
          <p className="text-sm text-muted-foreground">Prośba wysłana — czekaj na odpowiedź</p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="text-center py-3 opacity-60">
          <div className="text-3xl mb-2">🔒</div>
          <p className="text-sm text-muted-foreground">Dostęp odrzucony</p>
        </div>
      )}

      {status === 'granted' && (
        <div>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map(photo => (
              <div
                key={photo.id}
                onClick={() => setLightbox(photo.signedUrl)}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img src={photo.signedUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-xs text-primary text-center mt-2 flex items-center justify-center gap-1">
            <Unlock className="w-3 h-3" /> Masz dostęp do prywatnych zdjęć
          </p>
        </div>
      )}

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
            <img src={lightbox} alt="" className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain" />
            <button className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center" onClick={() => setLightbox(null)}>
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Component used in OWN profile to manage private photos ─────
interface MyPrivatePhotosProps {
  userId: string;
}

export function MyPrivatePhotos({ userId }: MyPrivatePhotosProps) {
  const { upload: uploadToR2 } = useR2Upload();
  const [photos, setPhotos] = useState<PrivatePhoto[]>([]);
  const [requests, setRequests] = useState<{ id: string; requester_id: string; name: string; photo: string; status: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadPhotos();
    loadRequests();
  }, [userId]);

  const loadPhotos = async () => {
    const { data } = await db.from('private_photos').select('id').eq('user_id', userId).order('created_at', { ascending: false });
    setPhotos(await resolvePhotoUrls((data ?? []).map((p: { id: string }) => p.id)));
  };

  const loadRequests = async () => {
    const { data } = await db
      .from('private_photo_requests')
      .select('id, requester_id, status, profiles!requester_id(display_name, avatar_url)')
      .eq('owner_id', userId)
      .eq('status', 'pending');
    setRequests((data ?? []).map((r: {id: string; requester_id: string; status: string; profiles: {display_name: string; avatar_url: string}}) => ({
      id: r.id,
      requester_id: r.requester_id,
      status: r.status,
      name: r.profiles?.display_name ?? 'Użytkownik',
      photo: r.profiles?.avatar_url ?? '',
    })));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { key } = await uploadToR2({ bucket: 'private', file, filename: file.name });
      // Store key in DB — URL is always fetched on-demand via signed URL
      await db.from('private_photos').insert({ user_id: userId, key, url: '' });
      await loadPhotos();
    } catch (err) {
      console.error('Private photo upload failed:', err);
      toast.error('Upload nie powiódł się.');
    }
    setUploading(false);
    if (e.target) e.target.value = '';
  };

  const removePhoto = async (id: string) => {
    await db.from('private_photos').delete().eq('id', id);
    // Note: R2 cleanup should be done via admin/Edge Function
    // For now mark as deleted in DB — R2 object cleanup via lifecycle rule
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleRequest = async (reqId: string, requesterId: string, approve: boolean) => {
    await db.from('private_photo_requests')
      .update({ status: approve ? 'granted' : 'rejected' })
      .eq('id', reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  return (
    <div className="glass rounded-2xl p-4 border border-primary/20">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Prywatne zdjęcia 🔒</p>
          <span className="text-xs glass px-2 py-0.5 rounded-full text-muted-foreground">{photos.length}</span>
          {requests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {requests.length}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-4">
              {/* Pending requests */}
              {requests.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Prośby o dostęp ({requests.length})</p>
                  <div className="space-y-2">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center gap-3 glass rounded-xl p-2.5">
                        <img src={req.photo} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium truncate">{req.name}</span>
                        <button onClick={() => handleRequest(req.id, req.requester_id, true)}
                          className="w-8 h-8 rounded-full gradient-fire flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </button>
                        <button onClick={() => handleRequest(req.id, req.requester_id, false)}
                          className="w-8 h-8 rounded-full glass border border-destructive/30 flex items-center justify-center flex-shrink-0">
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos grid */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Moje prywatne zdjęcia</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map(photo => (
                    <div key={photo.id} className="aspect-square relative rounded-xl overflow-hidden group">
                      <img src={photo.signedUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-destructive" />
                      </button>
                    </div>
                  ))}
                  {/* Add button */}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {uploading
                      ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      : <>
                          <Plus className="w-5 h-5 text-primary mb-1" />
                          <span className="text-xs text-muted-foreground">Dodaj</span>
                        </>
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tylko osoby którym przyznasz dostęp mogą zobaczyć te zdjęcia 🔒
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
