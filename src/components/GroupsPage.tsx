import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowLeft, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useR2Upload } from '@/hooks/useR2Upload';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface DbGroup {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  category: string;
  banner_style: string | null;
  is_live: boolean;
  created_at: string;
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image';
  created_at: string;
  senderName?: string;
}

const CATS = ['Wszystkie', 'Muzyka', 'Lifestyle', 'Film', 'Kultura', 'Sport', 'Food'];

// ── Group chat view ─────────────────────────────────────────────
function GroupChatView({ group, isMember, onJoined, onBack }: {
  group: DbGroup; isMember: boolean; onJoined: () => void; onBack: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [joining, setJoining] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { upload } = useR2Upload();
  const senderNamesRef = useRef<Record<string, string>>({});

  const resolveSenderName = useCallback(async (senderId: string) => {
    if (senderNamesRef.current[senderId]) return senderNamesRef.current[senderId];
    const { data } = await db.from('profiles').select('display_name').eq('id', senderId).maybeSingle();
    const name = data?.display_name || 'Ktoś';
    senderNamesRef.current[senderId] = name;
    return name;
  }, []);

  useEffect(() => {
    if (!isMember) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await db.from('group_messages').select('*').eq('group_id', group.id).order('created_at', { ascending: true }).limit(200);
      const rows: GroupMessage[] = data ?? [];
      const withNames = await Promise.all(rows.map(async m => ({ ...m, senderName: await resolveSenderName(m.sender_id) })));
      if (!cancelled) { setMessages(withNames); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [group.id, isMember, resolveSenderName]);

  useEffect(() => {
    if (!isMember) return;
    const ch = supabase.channel(`group_msgs:${group.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${group.id}` }, async payload => {
        const m = payload.new as GroupMessage;
        const senderName = await resolveSenderName(m.sender_id);
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, { ...m, senderName }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [group.id, isMember, resolveSenderName]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    const { error } = await db.from('group_members').insert({ group_id: group.id, user_id: user.id });
    setJoining(false);
    if (error) { toast.error('Nie udało się dołączyć do grupy.'); return; }
    onJoined();
  };

  const handleSend = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    const { error } = await db.from('group_messages').insert({ group_id: group.id, sender_id: user.id, content, type: 'text' });
    setSending(false);
    if (error) toast.error('Nie udało się wysłać wiadomości.');
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSending(true);
    try {
      const { publicUrl } = await upload({ bucket: 'chat-media', file });
      await db.from('group_messages').insert({ group_id: group.id, sender_id: user.id, content: publicUrl, type: 'image' });
    } catch {
      toast.error('Nie udało się wysłać zdjęcia.');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 glass-strong border-b border-border">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: group.banner_style ?? undefined }}>
          {group.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{group.name}</div>
          <div className="text-xs text-muted-foreground">{group.category}</div>
        </div>
      </div>

      {!isMember ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="text-4xl">{group.emoji}</div>
          <p className="text-sm text-muted-foreground">Dołącz do grupy, aby zobaczyć i pisać wiadomości.</p>
          <button onClick={handleJoin} disabled={joining}
            className="gradient-fire text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50">
            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dołącz do grupy'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hidden">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-50">
                <p className="text-sm text-muted-foreground">Brak wiadomości. Napisz pierwszy!</p>
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{m.senderName}</span>}
                    {m.type === 'image' ? (
                      <img src={m.content} alt="" className="max-w-[220px] rounded-2xl object-cover" />
                    ) : (
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'gradient-fire text-primary-foreground rounded-br-sm' : 'glass text-foreground rounded-bl-sm'}`}>
                        {m.content}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <div className="px-4 py-3 border-t border-border glass-strong flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Napisz w grupie..."
              className="flex-1 bg-secondary rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={handleSend} disabled={sending || !text.trim()} className="w-10 h-10 gradient-fire rounded-full flex items-center justify-center disabled:opacity-50">
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Groups list ──────────────────────────────────────────────────
export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('Wszystkie');
  const [selectedGroup, setSelectedGroup] = useState<DbGroup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: groupRows }, { data: memberRows }] = await Promise.all([
      db.from('groups').select('*').order('created_at', { ascending: true }),
      db.from('group_members').select('group_id, user_id'),
    ]);
    setGroups(groupRows ?? []);
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    for (const row of (memberRows ?? []) as { group_id: string; user_id: string }[]) {
      counts[row.group_id] = (counts[row.group_id] ?? 0) + 1;
      if (row.user_id === user?.id) mine.add(row.group_id);
    }
    setMemberCounts(counts);
    setJoinedIds(mine);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const toggleJoin = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!user) return;
    const isJoined = joinedIds.has(groupId);
    setJoinedIds(prev => {
      const next = new Set(prev);
      if (isJoined) next.delete(groupId); else next.add(groupId);
      return next;
    });
    setMemberCounts(prev => ({ ...prev, [groupId]: Math.max(0, (prev[groupId] ?? 0) + (isJoined ? -1 : 1)) }));
    const { error } = isJoined
      ? await db.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
      : await db.from('group_members').insert({ group_id: groupId, user_id: user.id });
    if (error) { toast.error('Coś poszło nie tak. Spróbuj ponownie.'); load(); }
  };

  if (selectedGroup) {
    return (
      <GroupChatView
        group={selectedGroup}
        isMember={joinedIds.has(selectedGroup.id)}
        onJoined={() => { setJoinedIds(prev => new Set(prev).add(selectedGroup.id)); setMemberCounts(prev => ({ ...prev, [selectedGroup.id]: (prev[selectedGroup.id] ?? 0) + 1 })); }}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  const filtered = activeCat === 'Wszystkie' ? groups : groups.filter(g => g.category === activeCat);

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden">
      <div className="mx-5 mt-4 mb-5 rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(180,100,200,.07))', border: '1px solid rgba(201,168,76,.22)' }}>
        <div className="absolute right-4 top-3 text-4xl opacity-10">✦</div>
        <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'serif', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Znajdź swoich ludzi
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dołącz do grup pasjonatów, dyskutuj i poznaj nowych ludzi o podobnych zainteresowaniach
        </p>
      </div>

      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hidden">
        {CATS.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCat === cat
              ? 'bg-primary/15 text-primary border border-primary/40'
              : 'glass text-muted-foreground border border-border hover:border-primary/30'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="px-5 space-y-3 pb-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((g, i) => (
              <motion.div key={g.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden border border-border/50 glass cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setSelectedGroup(g)}>
                <div className="h-16 flex items-center justify-center relative text-3xl" style={{ background: g.banner_style ?? undefined }}>
                  {g.emoji}
                  {g.is_live && (
                    <div className="absolute top-2 left-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-primary/90 font-medium">Na żywo</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm mb-1" style={{ fontFamily: 'serif' }}>{g.name}</div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{g.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{(memberCounts[g.id] ?? 0).toLocaleString()} osób</span>
                    </div>
                    <button
                      onClick={e => toggleJoin(e, g.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${joinedIds.has(g.id)
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'glass text-muted-foreground border border-border hover:border-primary/40 hover:text-primary'}`}>
                      {joinedIds.has(g.id) ? '✓ Dołączono' : 'Dołącz'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 opacity-50">
              <Plus className="w-6 h-6" />
              <p className="text-sm text-muted-foreground">Brak grup w tej kategorii</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
