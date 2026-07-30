import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Shield, Sparkles, Lock, Camera, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';

// ── Tiny reusable primitives ──────────────────────────────────────
function Chip({ label, on, onToggle, color = 'flame' }: { label: string; on: boolean; onToggle: () => void; color?: string }) {
  const cls = {
    flame:  on ? 'bg-primary/20 border-primary/50 text-primary'    : 'glass border-border text-muted-foreground hover:border-primary/30',
    gold:   on ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'glass border-border text-muted-foreground hover:border-amber-400/30',
    purple: on ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'glass border-border text-muted-foreground hover:border-purple-400/30',
    green:  on ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'glass border-border text-muted-foreground hover:border-emerald-400/30',
    pink:   on ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' : 'glass border-border text-muted-foreground hover:border-pink-400/30',
  }[color] ?? '';
  return (
    <button onClick={onToggle} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${cls}`}>
      {label}
    </button>
  );
}

function MultiChips({ label, hint, items, sel, toggle, color }: {
  label?: string; hint?: string; items: string[]; sel: string[]; toggle: (v: string) => void; color?: string;
}) {
  return (
    <div className="mb-4">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          {hint && <span className="text-[10px] text-muted-foreground/60">{hint}</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.map(it => <Chip key={it} label={it} on={sel.includes(it)} onToggle={() => toggle(it)} color={color} />)}
      </div>
    </div>
  );
}

function RadioChips({ label, items, val, set }: { label?: string; items: string[]; val: string; set: (v: string) => void }) {
  return (
    <div className="mb-4">
      {label && <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {items.map(it => <Chip key={it} label={it} on={val === it} onToggle={() => set(it)} />)}
      </div>
    </div>
  );
}

function Block({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-border p-5 mb-3">
      <p className="text-sm font-semibold mb-4 flex items-center gap-2">{icon && <span>{icon}</span>}{title}</p>
      {children}
    </div>
  );
}

function Inp({ label, value, set, placeholder, type = 'text' }: { label: string; value: string; set: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
        className="bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors w-full" />
    </div>
  );
}

function Sel({ label, value, set, options }: { label: string; value: string; set: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <select value={value} onChange={e => set(e.target.value)}
        className="bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors w-full appearance-none cursor-pointer">
        <option value="">Wybierz...</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, set, placeholder, max = 500, rows = 4 }: {
  label: string; value: string; set: (v: string) => void; placeholder?: string; max?: number; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <textarea value={value} onChange={e => set(e.target.value)} placeholder={placeholder} rows={rows} maxLength={max}
        className="bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors w-full resize-none" />
      <p className="text-[10px] text-muted-foreground text-right">{value.length} / {max}</p>
    </div>
  );
}

function Toggle({ label, checked, set }: { label: string; checked: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground/85">{label}</span>
      <button onClick={() => set(!checked)}
        className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${checked ? 'bg-primary' : 'bg-secondary'}`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

// ── Step definitions ──────────────────────────────────────────────
const STEPS = [
  { icon: '🏠', label: 'Start' },
  { icon: '👤', label: 'Podstawowe' },
  { icon: '🌿', label: 'Styl życia' },
  { icon: '🎭', label: 'Pasje' },
  { icon: '💑', label: 'Intencje' },
  { icon: '🌈', label: 'Orientacja' },
  { icon: '💋', label: 'Intymne 18+' },
  { icon: '🎯', label: 'Szukam' },
  { icon: '📸', label: 'Media' },
  { icon: '🔐', label: 'Prywatność' },
];

// ── Main wizard ───────────────────────────────────────────────────
const ProfileWizard: React.FC = () => {
  const navigate = useNavigate();
  const { setView } = useAppStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>(Array(6).fill(null));

  // All form fields flat state
  const [f, setF] = useState({
    // step 1 — basic
    displayName: '', age: '', gender: '', city: '', bio: '',
    height: '', bodyType: '', eyeColor: '', hairColor: '', tattoos: '', piercing: '',
    // step 2 — lifestyle
    smoking: '', drinking: '', diet: '', activityLevel: '', dayRhythm: '', pets: '', housing: '',
    education: '', occupation: '', mbti: '', zodiac: '',
    personalityTags: [] as string[], personalityText: '',
    religion: '', politics: '', valuesTags: [] as string[], dealbreakers: '',
    // step 3 — passions
    passionsArt: [] as string[], passionsSport: [] as string[], passionsTravel: [] as string[],
    passionsFood: [] as string[], passionsTech: [] as string[], passionsText: '',
    // step 4 — intentions
    intentions: [] as string[], childrenPref: '', marriagePlans: '', relocationReadiness: '',
    relationshipStyle: '', communicationStyle: [] as string[],
    // step 5 — orientation
    orientation: '', genderIdentity: '', pronouns: '', attractedTo: [] as string[],
    openRelationship: '', disclosureLevel: '',
    // step 6 — intimate
    intimateStyle: [] as string[], rolePlayPrefs: [] as string[], bdsmPrefs: [] as string[],
    exhibPrefs: [] as string[], groupPrefs: [] as string[], otherPrefs18: [] as string[],
    sexDescription: '', sexualPreferences: [] as string[], safeSex: '',
    likesList: [] as string[], dislikesList: [] as string[],
    // step 7 — looking for
    targetAgeMin: '18', targetAgeMax: '99', targetGender: [] as string[],
    targetLocation: '', relationshipGoal: '', lookingFor: [] as string[],
    personalityMatch: [] as string[], dealbreakersPartner: '',
    // step 9 — privacy
    profileVisibility: 'Wszyscy', showAge: true, showCity: true,
    showIntimate: false, allowMessages: 'Dopasowania', incognitoMode: false,
  });

  const s = (field: string) => (val: any) => setF(p => ({ ...p, [field]: val }));
  const tog = (field: string) => (val: string) => setF(p => {
    const arr = (p as any)[field] as string[];
    return { ...p, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
  });

  const goStep = (n: number) => {
    setStep(Math.max(0, Math.min(n, STEPS.length - 1)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Spark Connect is an 18+-only platform — enforce it client-side too
    // (the database also rejects age < 18 via a CHECK constraint, but a
    // clear in-app error is much better UX than a raw DB error).
    const parsedAge = parseInt(f.age, 10);
    if (!f.age || Number.isNaN(parsedAge) || parsedAge < 18) {
      toast.error('Musisz mieć ukończone 18 lat, aby korzystać ze Spark Connect.');
      return;
    }
    if (parsedAge > 120) {
      toast.error('Podaj prawidłowy wiek.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Musisz być zalogowany/a');

      // Upload avatar
      let avatarUrl = '';
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = publicUrl;
        }
      }

      // Upload gallery photos
      const photoUrls: string[] = [];
      for (const file of photoFiles.filter(Boolean) as File[]) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
          photoUrls.push(publicUrl);
        }
      }

      const db = supabase as any;
      const { error } = await db.from('profiles').upsert({
        id: user.id,
        // basic
        display_name: f.displayName,
        age: parseInt(f.age) || null,
        gender: f.gender || null,
        city: f.city || null,
        bio: f.bio || null,
        avatar_url: avatarUrl || null,
        photos: photoUrls.length ? photoUrls : null,
        // appearance
        height: parseInt(f.height) || null,
        body_type: f.bodyType || null,
        eye_color: f.eyeColor || null,
        hair_color: f.hairColor || null,
        tattoos: f.tattoos || null,
        piercing: f.piercing || null,
        // lifestyle
        smoking: f.smoking || null,
        drinking: f.drinking || null,
        diet: f.diet || null,
        activity_level: f.activityLevel || null,
        day_rhythm: f.dayRhythm || null,
        pets: f.pets || null,
        housing: f.housing || null,
        education: f.education || null,
        occupation: f.occupation || null,
        mbti: f.mbti || null,
        zodiac: f.zodiac || null,
        personality_tags: f.personalityTags.length ? f.personalityTags : null,
        personality_text: f.personalityText || null,
        religion: f.religion || null,
        politics: f.politics || null,
        values_tags: f.valuesTags.length ? f.valuesTags : null,
        dealbreakers: f.dealbreakers || null,
        // passions
        passions_art: f.passionsArt.length ? f.passionsArt : null,
        passions_sport: f.passionsSport.length ? f.passionsSport : null,
        passions_travel: f.passionsTravel.length ? f.passionsTravel : null,
        passions_food: f.passionsFood.length ? f.passionsFood : null,
        passions_tech: f.passionsTech.length ? f.passionsTech : null,
        passions_text: f.passionsText || null,
        interests: [...f.passionsArt, ...f.passionsSport, ...f.passionsFood].slice(0, 15),
        // intentions
        intentions: f.intentions.length ? f.intentions : null,
        children_preference: f.childrenPref || null,
        marriage_plans: f.marriagePlans || null,
        relocation_readiness: f.relocationReadiness || null,
        relationship_style: f.relationshipStyle || null,
        communication_style: f.communicationStyle.length ? f.communicationStyle : null,
        // orientation
        orientation: f.orientation || null,
        gender_identity: f.genderIdentity || null,
        pronouns: f.pronouns || null,
        attracted_to: f.attractedTo.length ? f.attractedTo : null,
        open_relationship: f.openRelationship || null,
        disclosure_level: f.disclosureLevel || null,
        // intimate
        intimate_style: f.intimateStyle.length ? f.intimateStyle : null,
        role_play_prefs: f.rolePlayPrefs.length ? f.rolePlayPrefs : null,
        bdsm_prefs: f.bdsmPrefs.length ? f.bdsmPrefs : null,
        exhib_prefs: f.exhibPrefs.length ? f.exhibPrefs : null,
        group_prefs: f.groupPrefs.length ? f.groupPrefs : null,
        other_prefs_18: f.otherPrefs18.length ? f.otherPrefs18 : null,
        sex_description: f.sexDescription || null,
        sexual_preferences: f.sexualPreferences.length ? f.sexualPreferences : null,
        safe_sex: f.safeSex || null,
        likes_list: f.likesList.length ? f.likesList : null,
        dislikes_list: f.dislikesList.length ? f.dislikesList : null,
        // looking for
        target_age_min: parseInt(f.targetAgeMin) || 18,
        target_age_max: parseInt(f.targetAgeMax) || 99,
        target_gender: f.targetGender.length ? f.targetGender : null,
        target_location: f.targetLocation || null,
        relationship_goal: f.relationshipGoal || null,
        looking_for: f.lookingFor.length ? f.lookingFor : null,
        personality_match: f.personalityMatch.length ? f.personalityMatch : null,
        dealbreakers_partner: f.dealbreakersPartner || null,
        // privacy
        profile_visibility: f.profileVisibility,
        show_age: f.showAge,
        show_city: f.showCity,
        show_intimate: f.showIntimate,
        allow_messages: f.allowMessages,
        incognito_mode: f.incognitoMode,
        // meta
        profile_complete: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success('🔥 Profil gotowy! SparkAI™ szuka dopasowań...');
      setView('app');
      navigate('/');
    } catch (err: any) {
      toast.error(`Błąd: ${err.message || 'Spróbuj ponownie'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step renders ────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      case 0: return (
        <div className="text-center py-6">
          <div className="text-7xl mb-5">🔥</div>
          <h2 className="text-4xl font-black mb-3 uppercase italic tracking-tighter text-white">Witaj w Świecie <br /><span className="text-primary">Bez Zahamowań</span></h2>
          <p className="text-white/60 mb-6 max-w-sm mx-auto leading-relaxed font-medium">
            To Twoja przestrzeń na spełnienie najskrytszych fantazji. Stwórz autentyczny profil i pozwól SparkAI™ połączyć Cię z ludźmi, którzy pragną tego samego co Ty.
          </p>
          <div className="bg-red-500/10 rounded-2xl border border-red-500/20 p-4 text-[10px] font-black uppercase tracking-widest text-red-400 mb-4 max-w-sm mx-auto animate-pulse">
            🔞 Portal przeznaczony wyłącznie dla dorosłych. Zero tabu.
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Tylko 2 minuty do startu — reszta jest opcjonalna</p>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
            {[
              { i: <Flame className="w-6 h-6 text-primary" />, t: 'Czysta Erotyka', d: 'Dopasowania oparte na pożądaniu i preferencjach' },
              { i: <Shield className="w-6 h-6 text-primary" />, t: 'Pełna Dyskrecja', d: 'Twoje intymne dane są bezpieczne i szyfrowane' },
              { i: <Zap className="w-6 h-6 text-primary" />, t: 'Szybka Akcja', d: 'Znajdź kogoś na teraz dzięki Vibe Rooms' },
            ].map(x => (
              <div key={x.t} className="glass rounded-2xl border border-white/5 p-4 text-left hover:border-primary/30 transition-all">
                <div className="mb-2">{x.i}</div>
                <p className="text-[10px] font-black uppercase mb-1 leading-tight">{x.t}</p>
                <p className="text-[9px] text-white/40 leading-relaxed font-bold italic">{x.d}</p>
              </div>
            ))}
          </div>
          <button onClick={() => goStep(1)}
            className="px-12 py-5 gradient-fire text-white rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,26,78,0.4)]">
            ODBLOKUJ PRAGNIENIA 🔥
          </button>
        </div>
      );

      case 1: return (
        <>
          <Block title="Tożsamość" icon="👤">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Inp label="Imię / Pseudonim" value={f.displayName} set={s('displayName')} placeholder="Jak chcesz być nazywany/a?" />
              <Inp label="Wiek" value={f.age} set={s('age')} placeholder="25" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Sel label="Płeć" value={f.gender} set={s('gender')} options={['Kobieta','Mężczyzna','Niebinarna/y','Trans kobieta','Trans mężczyzna','Inna','Wolę nie podawać']} />
              <Inp label="Miasto / Region" value={f.city} set={s('city')} placeholder="Warszawa" />
            </div>
            <Textarea label="Bio — krótko o sobie" value={f.bio} set={s('bio')} placeholder="Co Cię wyróżnia? Czym żyjesz? Co chcesz żeby ludzie wiedzieli o Tobie na starcie?" max={300} rows={3} />
          </Block>
          <Block title="Zdjęcie profilowe" icon="📸">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-secondary/30 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all overflow-hidden flex-shrink-0"
                onClick={() => document.getElementById('avInput')?.click()}>
                {avatarFile
                  ? <img src={URL.createObjectURL(avatarFile)} className="w-full h-full rounded-full object-cover" alt="avatar" />
                  : <Camera className="w-6 h-6 text-muted-foreground" />
                }
              </div>
              <input id="avInput" type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setAvatarFile(e.target.files[0]); }} />
              <p className="text-xs text-muted-foreground leading-relaxed">Wymagane, aby wejść do aplikacji. Wybierz zdjęcie, na którym wyraźnie widać Twoją twarz — to jedyna rzecz, której naprawdę potrzebujemy na start.</p>
            </div>
          </Block>
          <Block title="Wygląd" icon="🪞">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Inp label="Wzrost (cm)" value={f.height} set={s('height')} placeholder="170" />
              <Sel label="Sylwetka" value={f.bodyType} set={s('bodyType')} options={['Szczupła','Atletyczna','Średnia','Krągła','Plus size','Wolę nie podawać']} />
              <Sel label="Oczy" value={f.eyeColor} set={s('eyeColor')} options={['Niebieskie','Brązowe','Zielone','Szare','Piwne']} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Sel label="Włosy" value={f.hairColor} set={s('hairColor')} options={['Czarne','Blond','Brązowe','Rude','Siwe','Łysy','Kolorowe']} />
              <Sel label="Tatuaże" value={f.tattoos} set={s('tattoos')} options={['Brak','Kilka małych','Kilka dużych','Dużo','Full sleeve']} />
              <Sel label="Piercing" value={f.piercing} set={s('piercing')} options={['Brak','Tylko uszy','Kilka miejsc','Dużo']} />
            </div>
          </Block>
        </>
      );

      case 2: return (
        <>
          <Block title="Nawyki & Zdrowie" icon="🌿">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Sel label="Palenie" value={f.smoking} set={s('smoking')} options={['Nie palę','Rzuciłam/em','Okazjonalnie','Regularnie','Tylko e-papieros','Wolę nie podawać']} />
              <Sel label="Alkohol" value={f.drinking} set={s('drinking')} options={['Nie piję','Okazjonalnie','Socjalnie','Regularnie','Trzeźwość','Wolę nie podawać']} />
              <Sel label="Dieta" value={f.diet} set={s('diet')} options={['Wszystkożerna','Wegetariańska','Wegańska','Pescatarian','Keto','Halal','Bezglutenowa']} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Sel label="Aktywność fizyczna" value={f.activityLevel} set={s('activityLevel')} options={['Nieaktywna/y','Rzadko','2–3x w tygodniu','Codziennie','Wyczynowo']} />
              <Sel label="Rytm dnia" value={f.dayRhythm} set={s('dayRhythm')} options={['Ranny ptaszek 🌅','Sowa nocna 🦉','Bez różnicy']} />
              <Sel label="Sytuacja mieszkaniowa" value={f.housing} set={s('housing')} options={['Mieszkam sama/sam','Z roommates','Z rodziną','Własne mieszkanie']} />
            </div>
          </Block>
          <Block title="Osobowość" icon="🎭">
            <MultiChips label="Jak się opisujesz? (do 8)" hint="wybierz max 8"
              items={['Empatyczna/y','Ambitna/y','Kreatywna/y','Romantyczna/y','Spontaniczna/y','Niezależna/y','Odważna/y','Lojalna/y','Dowcipna/y','Bezpośrednia/y','Wyluzowana/y','Introwertyczna/y','Ekstrawertyczna/y','Optymistyczna/y','Realistyczna/y','Artystyczna/y','Zmysłowa/y','Charyzmatyczna/y']}
              sel={f.personalityTags} toggle={tog('personalityTags')} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Sel label="MBTI (opcjonalnie)" value={f.mbti} set={s('mbti')} options={['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP']} />
              <Sel label="Znak zodiaku" value={f.zodiac} set={s('zodiac')} options={['Baran ♈','Byk ♉','Bliźnięta ♊','Rak ♋','Lew ♌','Panna ♍','Waga ♎','Skorpion ♏','Strzelec ♐','Koziorożec ♑','Wodnik ♒','Ryby ♓']} />
            </div>
            <Textarea label="Opisz swoją osobowość własnymi słowami" value={f.personalityText} set={s('personalityText')} placeholder="Co Cię wyróżnia? Jak Cię widzą znajomi? Jaką energię wnosisz w relacje?" />
          </Block>
          <Block title="Wartości & Światopogląd" icon="🧭">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Sel label="Religia / Duchowość" value={f.religion} set={s('religion')} options={['Ateista/ka','Agnostyk/czka','Katolik/czka','Chrześcijanin/ka','Muzułmanin/ka','Buddysta/ka','Duchowy/a','Wolę nie podawać']} />
              <Sel label="Poglądy polityczne" value={f.politics} set={s('politics')} options={['Lewicowe','Centrolewicowe','Centrowe','Centroprawicowe','Prawicowe','Apolityczny/a','Wolę nie podawać']} />
            </div>
            <MultiChips label="Najważniejsze wartości (do 6)" items={['Rodzina','Wolność','Lojalność','Szczerość','Ambicja','Empatia','Sprawiedliwość','Przyroda','Sztuka','Nauka','Równość','Stabilność','Przygoda','Autentyczność','Mądrość']} sel={f.valuesTags} toggle={tog('valuesTags')} color="gold" />
          </Block>
        </>
      );

      case 3: return (
        <>
          <Block title="Sztuka & Kultura" icon="🎨">
            <MultiChips items={['🎨 Malarstwo','📷 Fotografia','🎭 Teatr','🎬 Kino','📚 Literatura','🎵 Koncerty','🎸 Rock/Metal','🎹 Jazz','🎤 Hip-hop','🎧 Elektronika','🖼 Galerie sztuki','📖 Komiksy','🎮 Gaming','🎲 Planszówki','♟ Szachy','🌐 Podcasty']} sel={f.passionsArt} toggle={tog('passionsArt')} />
          </Block>
          <Block title="Sport & Aktywność" icon="⚽">
            <MultiChips items={['🧘 Yoga','🏃 Bieganie','🚴 Rowerzysta/ka','🏊 Pływanie','🧗 Wspinaczka','🏋️ Siłownia','🎾 Tenis','⛷ Narty','🤸 Taniec','🥊 Sztuki walki','🚣 Kajak','🤿 Nurkowanie','⚽ Piłka nożna','🏀 Koszykówka']} sel={f.passionsSport} toggle={tog('passionsSport')} color="green" />
          </Block>
          <Block title="Podróże & Przygoda" icon="✈️">
            <MultiChips items={['✈️ Podróże za granicę','🏙 City-breaki','🏕 Kemping','🗺 Backpacking','🏖 Plaże tropikalne','🏔 Góry','🌍 Egzotyka','🚐 Roadtrip','🌆 Architektura miast','🍜 Turystyka kulinarna']} sel={f.passionsTravel} toggle={tog('passionsTravel')} color="gold" />
          </Block>
          <Block title="Jedzenie & Gotowanie" icon="🍷">
            <MultiChips items={['🍝 Gotowanie','🍷 Wino','🍺 Craft beer','☕ Kawiarnie','🍣 Sushi','🌶 Kuchnia azjatycka','🥗 Zdrowe jedzenie','🥩 BBQ','🍰 Pieczenie','🍹 Koktajle']} sel={f.passionsFood} toggle={tog('passionsFood')} color="pink" />
          </Block>
          <Block title="Technologia & Nauka" icon="💻">
            <MultiChips items={['💻 Programowanie','🤖 AI/ML','🔭 Astronomia','🧬 Biologia','🔬 Nauki ścisłe','⚡ Elektronika','📱 Nowe technologie','🌱 Ekologia','♻ Zrównoważony rozwój']} sel={f.passionsTech} toggle={tog('passionsTech')} />
            <div className="mt-3">
              <Textarea label="Opowiedz o swoich pasjach własnymi słowami" value={f.passionsText} set={s('passionsText')} placeholder="np. Fotografuję krajobrazy miejskie o świcie, gram na gitarze od 12 lat..." />
            </div>
          </Block>
        </>
      );

      case 4: return (
        <>
          <Block title="Czego szukasz?" icon="💑">
            <MultiChips label="Intencje (możesz wybrać kilka)" items={['💕 Poważny związek','💍 Małżeństwo','🤝 Randki / Coś nowego','💬 Przyjaźń i coś więcej','🔥 Bez zobowiązań','🌈 Open relationship','🏖 Kompan/ka podróży','🤫 Dyskretne spotkania','👫 Poliamoria','🔄 Jeszcze nie wiem']} sel={f.intentions} toggle={tog('intentions')} />
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Sel label="Dzieci" value={f.childrenPref} set={s('childrenPref')} options={['Nie chcę','Kiedyś, nie teraz','Chcę','Mam, nie chcę więcej','Mam, chcę więcej','Wolę nie podawać']} />
              <Sel label="Małżeństwo" value={f.marriagePlans} set={s('marriagePlans')} options={['Nie planuję','Może kiedyś','Tak, chcę','Po rozwodzie','Wolę nie podawać']} />
              <Sel label="Przeprowadzka" value={f.relocationReadiness} set={s('relocationReadiness')} options={['Nie — jestem tu','W obrębie miasta','W Polsce','Europa — OK','Gdziekolwiek']} />
            </div>
          </Block>
          <Block title="Styl relacji" icon="💞">
            <RadioChips label="Model relacji" items={['Monogamia','Seryjna monogamia','Poliamoria etyczna','Relacja otwarta','Swinging','Anarchia relacyjna','Jeszcze nie wiem']} val={f.relationshipStyle} set={s('relationshipStyle')} />
            <MultiChips label="Styl komunikacji" items={['Bezpośrednia/y','Delikatna/y','Przez tekst','Telefonista/ka','Face to face','Emocjonalna/y','Logiczna/y','Humorystyczna/y']} sel={f.communicationStyle} toggle={tog('communicationStyle')} color="purple" />
          </Block>
        </>
      );

      case 5: return (
        <>
          <Block title="Orientacja seksualna" icon="🌈">
            <RadioChips label="Orientacja" items={['Heteroseksualny/a','Biseksualny/a','Homoseksualny/a','Panseksualny/a','Aseksualny/a','Demiseksualny/a','Kweer','Eksperymentuję','Wolę nie podawać']} val={f.orientation} set={s('orientation')} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Sel label="Tożsamość płciowa" value={f.genderIdentity} set={s('genderIdentity')} options={['Kobieta (cis)','Mężczyzna (cis)','Trans kobieta','Trans mężczyzna','Niebinarna/y','Płynna/y genderowo','Inna','Wolę nie podawać']} />
              <Sel label="Zaimki (opcjonalnie)" value={f.pronouns} set={s('pronouns')} options={['ona/jej','on/jego','oni/ich','ono/jego','brak preferencji','Wolę nie podawać']} />
            </div>
          </Block>
          <Block title="Pociąg & Preferencje" icon="💫">
            <MultiChips label="Kogo pociągasz się?" items={['Kobiety','Mężczyźni','Osoby niebinarne','Trans kobiety','Trans mężczyźni','Nie ma znaczenia']} sel={f.attractedTo} toggle={tog('attractedTo')} color="pink" />
            <RadioChips label="Stosunek do relacji otwartych" items={['Tylko monogamia','Otwarty/a na rozmowę','Zdecydowanie otwarty/a','Preferuję open','Tylko non-monogamia']} val={f.openRelationship} set={s('openRelationship')} />
            <RadioChips label="Poziom ujawniania orientacji" items={['Całkowicie otwarty/a','Otwarty/a w swoim środowisku','Półotwarty/a','Dyskretnie','Anonimowo tylko']} val={f.disclosureLevel} set={s('disclosureLevel')} />
          </Block>
        </>
      );

      case 6: return (
        <>
          <div className="glass rounded-2xl border border-purple-500/30 p-4 mb-3 flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-300">Strefa prywatna 18+</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Poniższe dane widoczne tylko dla dopasowań. Możesz pominąć tę sekcję.</p>
            </div>
          </div>
          <Block title="Zmysłowe & Romantyczne" icon="💋">
            <MultiChips items={['💆 Długie masaże','🕯 Świece / kąpiel','🫦 Głębokie pocałunki','👀 Kontakt wzrokowy','🌹 Romantyczna atmosfera','🛁 Wspólna kąpiel','🌙 Całonocne czuwanie','🎵 Muzyka w tle','🌸 Tantra i oddech']} sel={f.intimateStyle} toggle={tog('intimateStyle')} color="pink" />
          </Block>
          <Block title="Role-play & Fantazje" icon="🎭">
            <MultiChips items={['👔 Nieznajomi','🏥 Medyczne','👮 Władza/Autorytet','👩‍🎓 Nauczyciel/ka','🏖 Holiday fling','🎬 Naśladowanie filmów','✍️ Własne scenariusze']} sel={f.rolePlayPrefs} toggle={tog('rolePlayPrefs')} color="purple" />
          </Block>
          <Block title="BDSM & Dominacja/Uległość" icon="🔗">
            <MultiChips items={['🎀 Light bondage','⛓ Kajdanki','🙈 Blindfold','👑 Dominacja werbalna','🐾 Pet play','📜 Kontrakt/reguły','🏹 Impact play (lekki)','🏹 Impact play (intensywny)','🔥 Wax play','🎪 Shibari']} sel={f.bdsmPrefs} toggle={tog('bdsmPrefs')} />
          </Block>
          <Block title="Ekshibicjonizm & Voyeuryzm" icon="📸">
            <MultiChips items={['📸 Zdjęcia intymne (wymiana)','🔭 Voyeuryzm','💃 Striptiz','🌌 Seks w plenerze','🚗 W samochodzie','👄 Sexting & Wideo','📱 Online intimacy','🔮 Mirror play']} sel={f.exhibPrefs} toggle={tog('exhibPrefs')} color="gold" />
          </Block>
          <Block title="Grupy & Specjalne" icon="👫">
            <MultiChips items={['👫 Menage à trois','🎉 Swinging','👯 Para + para','🔄 Biseksualna zabawa','🌐 Online only','🎭 Imprezy tematyczne']} sel={f.groupPrefs} toggle={tog('groupPrefs')} color="green" />
          </Block>
          <Block title="Preferencje & styl seksualny" icon="✨">
            <MultiChips label="Kim jesteś w łóżku?" items={['Dominujący/a 👑','Uległy/a ⛓️','Switch 🔄','Vanilla 🍦','Kinky 👅','Voyeur 👁️','Exhibitionist 🍑','Swinger 🍍']} sel={f.sexualPreferences} toggle={tog('sexualPreferences')} color="purple" />
            <RadioChips label="Bezpieczny seks" items={['Zawsze','Zależy od osoby','Nie używam','Tylko z partnerem']} val={f.safeSex} set={s('safeSex')} />
            <Textarea label="Opis własnymi słowami (tylko dla dopasowań)" value={f.sexDescription} set={s('sexDescription')} placeholder="Tutaj możesz napisać szczerze o tym co lubisz, czego szukasz, jaka energia Ci odpowiada..." max={800} />
          </Block>
        </>
      );

      case 7: return (
        <>
          <Block title="Kogo szukasz?" icon="🎯">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Inp label="Min. wiek" value={f.targetAgeMin} set={s('targetAgeMin')} placeholder="18" type="number" />
              <Inp label="Max. wiek" value={f.targetAgeMax} set={s('targetAgeMax')} placeholder="99" type="number" />
            </div>
            <MultiChips label="Płeć partnera/ki" items={['Kobieta','Mężczyzna','Para (KM)','Para (KK)','Para (MM)','Osoba niebinarna','Trans kobieta','Trans mężczyzna','Otwarta/y']} sel={f.targetGender} toggle={tog('targetGender')} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Sel label="Lokalizacja" value={f.targetLocation} set={s('targetLocation')} options={['Moje miasto','Do 30 km','Do 100 km','Cała Polska','Cała Europa','Gdziekolwiek']} />
              <Sel label="Typ relacji" value={f.relationshipGoal} set={s('relationshipGoal')} options={['Zabawa i seks 🔥','Randki bez zobowiązań 🌙','Szukam miłości 💍','Przyjaźń 🤝','Poliamoria 🌈','Dowolnie']} />
            </div>
          </Block>
          <Block title="Idealne cechy" icon="💎">
            <MultiChips label="Czego oczekujesz od partnera/ki?" items={['Otwartość','Humor','Inteligencja','Wrażliwość','Ambicja','Lojalność','Spontaniczność','Dojrzałość','Aktywność fizyczna','Niezależność','Szczerość','Ciepło','Pasja','Kreatywność']} sel={f.personalityMatch} toggle={tog('personalityMatch')} color="gold" />
            <Textarea label="Deal-breakery (absolutnie nieakceptowalne)" value={f.dealbreakersPartner} set={s('dealbreakersPartner')} placeholder="Twoje deal-breakery — może to być coś charakterologicznego, wartości, przekonania..." rows={3} />
          </Block>
        </>
      );

      case 8: return (
        <>
          <Block title="Dodatkowe zdjęcia (do 6)" icon="🖼">
            <p className="text-xs text-muted-foreground mb-4">Profile z 4+ zdjęciami dostają 8× więcej dopasowań.</p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => {
                const file = photoFiles[i];
                return (
                  <div key={i} className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${file ? 'border-transparent' : 'border-border/50 hover:border-primary/40 bg-secondary/20'}`}
                    onClick={() => document.getElementById(`ph${i}`)?.click()}>
                    {file ? (
                      <>
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt={`photo ${i}`} />
                        {i === 0 && <span className="absolute top-1 left-1 text-[9px] bg-primary/90 text-white px-1.5 py-0.5 rounded font-bold">GŁÓWNE</span>}
                      </>
                    ) : (
                      <><span className="text-2xl text-muted-foreground/40">+</span><span className="text-[10px] text-muted-foreground/40 mt-1">{i + 1}</span></>
                    )}
                    <input id={`ph${i}`} type="file" accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) { const nf = [...photoFiles]; nf[i] = e.target.files[0]; setPhotoFiles(nf); } }} />
                  </div>
                );
              })}
            </div>
          </Block>
        </>
      );

      case 9: return (
        <>
          <Block title="Widoczność profilu" icon="🔐">
            <RadioChips label="Kto może zobaczyć Twój profil?" items={['Wszyscy','Tylko zalogowani','Tylko premium','Tylko dopasowania','Ukryty']} val={f.profileVisibility} set={s('profileVisibility')} />
            <div className="mt-3 space-y-0">
              <Toggle label="Pokaż wiek na profilu" checked={f.showAge} set={s('showAge')} />
              <Toggle label="Pokaż miasto na profilu" checked={f.showCity} set={s('showCity')} />
              <Toggle label="Pokaż sekcję intymną dopasowaniom" checked={f.showIntimate} set={s('showIntimate')} />
              <Toggle label="Tryb incognito (przeglądaj anonimowo)" checked={f.incognitoMode} set={s('incognitoMode')} />
            </div>
          </Block>
          <Block title="Wiadomości" icon="💬">
            <RadioChips label="Kto może Ci pisać?" items={['Wszyscy','Tylko dopasowania','Tylko premium','Nikt (pauza)']} val={f.allowMessages} set={s('allowMessages')} />
          </Block>
          <div className="glass rounded-2xl border border-primary/20 p-5 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-lg mb-1">Gotowe! Profil skonfigurowany.</p>
            <p className="text-sm text-muted-foreground">Kliknij "Utwórz profil" — algorytm SparkAI™ od razu zacznie szukać dopasowań.</p>
          </div>
        </>
      );

      default: return null;
    }
  };

  const stepTitles = ['','Podstawowe informacje','Styl życia (opcjonalnie)','Pasje & Zainteresowania (opcjonalnie)','Relacje & Intencje (opcjonalnie)','Orientacja & Tożsamość (opcjonalnie)','Preferencje intymne 18+ (opcjonalnie)','Kogo szukasz? (opcjonalnie)','Dodatkowe zdjęcia (opcjonalnie)','Prywatność & Ustawienia (opcjonalnie)'];

  // Only identity + a profile photo are required to enter the app — everything
  // past step 1 is enrichment the user can finish later from their profile.
  // This mirrors how competitor dating sites get users into the product in
  // a handful of steps instead of forcing a full questionnaire upfront.
  const parsedAgeForCheck = parseInt(f.age, 10);
  const essentialsComplete = !!(
    f.displayName.trim() && f.gender && f.city.trim() && avatarFile &&
    !Number.isNaN(parsedAgeForCheck) && parsedAgeForCheck >= 18
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center gradient-fire shadow-[0_0_15px_rgba(255,26,78,0.5)]">
                <span className="text-sm">🔥</span>
              </div>
              <span className="text-sm font-black uppercase tracking-tighter gradient-text italic">Spark Connect</span>
            </div>
            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">
              {step === 0 ? 'Wprowadzenie' : step >= 10 ? 'Ukończone!' : `Krok ${step} / ${STEPS.length - 1}`}
              <span className="text-primary font-bold ml-2">{Math.round((step / (STEPS.length - 1)) * 100)}%</span>
            </span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide pb-1">
            {STEPS.map((st, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <button
                    onClick={() => i <= step + 1 ? goStep(i) : undefined}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                      i < step  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                      i === step ? 'bg-primary/20 border-primary text-primary shadow-sm' :
                                   'bg-secondary border-border text-muted-foreground'}`}>
                    {i < step ? '✓' : st.icon}
                  </button>
                  <span className="text-[9px] text-muted-foreground mt-0.5 max-w-10 truncate">{st.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-3 flex-shrink-0 mb-3.5 transition-colors ${i < step ? 'bg-emerald-500' : 'bg-border'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(347 100% 60%), hsl(45 100% 55%))' }}
              animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {step > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{STEPS[step]?.icon} Krok {step} / {STEPS.length - 1}</p>
            <h2 className="text-2xl font-bold">{stepTitles[step]}</h2>
          </div>
        )}

        {step >= 1 && essentialsComplete && step < STEPS.length - 1 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 glass rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300/90 flex-1">Masz już komplet niezbędnych danych — możesz wejść do aplikacji teraz, a resztę uzupełnić później w Profilu.</p>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-emerald-300 border border-emerald-500/40 rounded-xl px-3 py-2 hover:bg-emerald-500/10 transition-all disabled:opacity-50">
              Wejdź teraz →
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className={`flex mt-5 pt-5 border-t border-border ${step === 0 ? 'justify-center' : 'justify-between items-center'}`}>
          {step > 0 && (
            <button onClick={() => goStep(step - 1)}
              className="flex items-center gap-2 px-5 py-3 glass rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all font-medium text-sm">
              <ChevronLeft className="w-4 h-4" /> Wstecz
            </button>
          )}

          {step === STEPS.length - 1 ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-8 py-3.5 text-white rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(347 100% 60%), hsl(45 100% 55%))' }}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Tworzenie...</>
                : <>🔥 Utwórz profil!</>}
            </button>
          ) : step > 0 ? (
            <button onClick={() => goStep(step + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary/85 transition-all text-sm shadow-md shadow-primary/20">
              Dalej <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard;
