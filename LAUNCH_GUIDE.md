# 🚀 Spark Connect — Kompletna instrukcja uruchomienia v8

**Domena:** spark-connect.hardbanrecordslab.online  
**Admin email:** spark-connect@hardbanrecordslab.online  
**Stack:** React + Vite → Vercel | PostgreSQL + Auth + Realtime → Supabase | Pliki → Cloudflare R2  
**Czas:** ~90 minut od zera do live  
**Koszt startowy:** $0/miesiąc  

---

## PRZEGLĄD — co gdzie działa

```
Użytkownik (telefon/przeglądarka)
         │
         ▼
   Vercel (frontend)
   spark-connect.hardbanrecordslab.online
   React SPA + PWA + Service Worker
         │
         ├──► Supabase (baza + auth + realtime + edge functions)
         │    ├── PostgreSQL — 13 migracji, RLS na każdej tabeli
         │    ├── Auth — email/hasło + Google OAuth
         │    ├── Realtime WebSocket — czat, presence, typing
         │    └── Edge Functions (6 funkcji Deno)
         │        ├── generate-upload-url   ← presigned URL dla R2
         │        ├── get-private-photo-url ← signed URL dla prywatnych zdjęć
         │        ├── send-push-notification
         │        ├── send-email            ← Resend API
         │        ├── calculate-chemistry   ← nightly batch
         │        └── gdpr-export
         │
         └──► Cloudflare R2 (storage plików)
              ├── spark-avatars    → media.hardbanrecordslab.online
              ├── spark-chat-media → chat.hardbanrecordslab.online
              └── spark-private    → signed URLs only
```

---

## KROK 1 — Supabase: stwórz projekt

1. Wejdź na **https://supabase.com** → Sign up (GitHub/email)
2. Kliknij **New Project**
3. Wypełnij:
   - **Name:** `spark-connect`
   - **Database Password:** wygeneruj silne hasło — zapisz je!
   - **Region:** `eu-central-1` (Frankfurt — najbliżej Polski)
4. Kliknij **Create new project** → czekaj ~2 minuty

**Skopiuj i zapisz** (Settings → API):

| Wartość | Gdzie trafia |
|---|---|
| **Project URL** | `VITE_SUPABASE_URL` w .env |
| **anon / public** key | `VITE_SUPABASE_PUBLISHABLE_KEY` w .env |
| **service_role** key | Supabase Secrets (NIE do .env!) |
| **Project Reference ID** | potrzebny do CLI (z URL projektu) |

---

## KROK 2 — Supabase: uruchom migracje

**Opcja A — przez SQL Editor (bez CLI):**

Dashboard → SQL Editor → New query  
Wklej i uruchom każdy plik **w tej kolejności**:

```
1.  supabase/migrations/20260308113709_...sql  ← profiles, matches, swipes, messages, conversations
2.  supabase/migrations/20260308113730_...sql  ← reactions, reports, user_roles
3.  supabase/migrations/20260308114418_...sql  ← dodatkowe indeksy
4.  supabase/migrations/20260308115214_...sql  ← dodatkowe polityki RLS
5.  supabase/migrations/20260308120317_...sql  ← functions pomocnicze
6.  supabase/migrations/20260308122324_...sql  ← push_subscriptions
7.  supabase/migrations/20260317000001_user_settings.sql
8.  supabase/migrations/20260317000002_chemistry_referrals.sql
9.  supabase/migrations/20260317000003_admin_verification.sql
10. supabase/migrations/20260317000004_private_photos.sql
11. supabase/migrations/20260317000005_availability.sql
12. supabase/migrations/20260317000006_whisper_superswipe_stories.sql
13. supabase/migrations/20260317000007_postgis_reports_ratelimit_cron.sql
```

**Opcja B — przez CLI (szybciej):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref TWOJ_PROJECT_ID
supabase db push
```

**Po migracji #13 — włącz Extensions:**

Dashboard → Database → Extensions → włącz:
- ✅ `postgis` — realna odległość GPS w Discover
- ✅ `pg_cron` — automatyczne czyszczenie wygasłych danych
- ✅ `pg_net` — HTTP calls z bazy (potrzebny do pg_cron + Edge Functions)

**Po włączeniu pg_cron** — uruchom w SQL Editor:

```sql
-- Usuń wygasłe wiadomości co godzinę
SELECT cron.schedule('delete-expired-messages','0 * * * *',
  $$DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < now()$$);

-- Usuń wygasłe statusy dostępności co 30 minut
SELECT cron.schedule('delete-expired-availability','*/30 * * * *',
  $$DELETE FROM public.availability WHERE expires_at < now()$$);

-- Wyczyść stare rate_limits raz dziennie
SELECT cron.schedule('cleanup-rate-limits','0 4 * * *',
  $$DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 days'$$);
```

---

## KROK 3 — Supabase: Storage Bucket (tylko GDPR)

Dashboard → Storage → New bucket:

| Nazwa | Publiczny | Rozmiar |
|---|---|---|
| `gdpr-exports` | ❌ NIE (prywatny) | 50 MB |

> Zdjęcia i media NIE trafiają do Supabase Storage — idą do Cloudflare R2 (Krok 5).

---

## KROK 4 — Supabase: Auth

Dashboard → Authentication → Settings:

- **Site URL:** `https://spark-connect.hardbanrecordslab.online`
- **Redirect URLs:** dodaj `https://spark-connect.hardbanrecordslab.online/**`
- **Email confirmations:** ✅ włączone

### Google OAuth (opcjonalne ale zalecane)

1. Wejdź na **https://console.cloud.google.com**
2. New project → APIs & Services → Credentials
3. Create credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs — dodaj:
   ```
   https://TWOJ_PROJECT_ID.supabase.co/auth/v1/callback
   ```
6. Skopiuj **Client ID** i **Client Secret**
7. W Supabase → Authentication → Providers → Google → wklej oba → Save

### Apple OAuth (opcjonalne — wymaga $99/rok Apple Developer)

Jeśli nie masz konta Apple Developer — usuń przycisk "Kontynuuj z Apple" z `src/components/AuthFlow.tsx` (funkcja `handleApple`).

---

## KROK 5 — Cloudflare R2: storage plików

### 5a. Utwórz konto Cloudflare

1. Wejdź na **https://cloudflare.com** → Sign up (bezpłatne)
2. Lewy sidebar → **R2 Object Storage** → Get started

### 5b. Utwórz 3 buckety

Dla każdego: R2 → Create bucket

| Nazwa bucketu | Typ | Uwagi |
|---|---|---|
| `spark-avatars` | Publiczny | Zdjęcia profilowe |
| `spark-chat-media` | Publiczny | Media w czacie |
| `spark-private` | Prywatny | Prywatne zdjęcia — tylko signed URL |

Ustawienia każdego bucketu: Region = **EEUR (Eastern Europe)**

### 5c. Własna domena dla publicznych bucketów

Dla `spark-avatars`:
1. Otwórz bucket → Settings → Custom Domains → Connect Domain
2. Wpisz: `media.hardbanrecordslab.online`
3. Cloudflare automatycznie doda CNAME w DNS (twoja domena musi być w Cloudflare)

Dla `spark-chat-media`:
1. Custom Domain: `chat.hardbanrecordslab.online`

### 5d. Wygeneruj klucze API R2

R2 → Manage R2 API Tokens → Create API Token:
- Permissions: **Object Read & Write**
- Specify buckets: zaznacz wszystkie 3

Zapisz:
```
Account ID:        (z URL strony Cloudflare — 32 znaki hex)
Access Key ID:     (wygenerowany)
Secret Access Key: (wygenerowany — pojawia się tylko RAZ, zapisz!)
```

### 5e. Ustaw sekrety R2 w Supabase

```bash
supabase secrets set R2_ACCOUNT_ID="twoj_account_id"
supabase secrets set R2_ACCESS_KEY_ID="twoj_access_key"
supabase secrets set R2_SECRET_ACCESS_KEY="twoj_secret_key"
supabase secrets set R2_PUBLIC_BUCKET="spark-avatars"
supabase secrets set R2_CHAT_BUCKET="spark-chat-media"
supabase secrets set R2_PRIVATE_BUCKET="spark-private"
supabase secrets set R2_PUBLIC_URL="https://media.hardbanrecordslab.online"
supabase secrets set R2_CHAT_URL="https://chat.hardbanrecordslab.online"
```

---

## KROK 6 — Supabase: Edge Functions

### 6a. Zainstaluj Supabase CLI (jeśli jeszcze nie)

```bash
npm install -g supabase
supabase login
supabase link --project-ref TWOJ_PROJECT_ID
```

### 6b. Wygeneruj klucze VAPID (push notifications)

```bash
npx web-push generate-vapid-keys
```

Zapisz output:
```
Public Key:  BEl62iUYgUivxIkv69y...
Private Key: UDWgdik9sMqKuBLQ...
```

### 6c. Ustaw WSZYSTKIE sekrety

```bash
# Push notifications
supabase secrets set VAPID_PUBLIC_KEY="BEl62iUYgUivxIkv69y..."
supabase secrets set VAPID_PRIVATE_KEY_JWK="twoj_private_key_jwk"
supabase secrets set VAPID_SUBJECT="mailto:spark-connect@hardbanrecordslab.online"

# Resend (emaile transakcyjne) — pobierz klucz z resend.com/api-keys
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase ustawia je automatycznie, nie musisz ich dodawać.

### 6d. Wdróż wszystkie 6 Edge Functions

```bash
supabase functions deploy generate-upload-url
supabase functions deploy get-private-photo-url
supabase functions deploy send-push-notification
supabase functions deploy send-email
supabase functions deploy calculate-chemistry
supabase functions deploy gdpr-export
```

Lub wszystkie naraz:
```bash
supabase functions deploy
```

### 6e. Zaplanuj nightly chemistry score

W SQL Editor (po włączeniu pg_net i pg_cron):
```sql
SELECT cron.schedule(
  'chemistry-nightly',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url := 'https://TWOJ_PROJECT_ID.supabase.co/functions/v1/calculate-chemistry',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    )
  $$
);
```

---

## KROK 7 — Resend: konto emailowe

1. Wejdź na **https://resend.com** → Sign up (bezpłatne — 3000 emaili/mies.)
2. Dodaj domenę: **hardbanrecordslab.online**
3. Zweryfikuj domain przez DNS (Cloudflare) — dodaj rekordy MX, SPF, DKIM które pokaże Resend
4. API Keys → Create API Key → skopiuj
5. Wstaw do sekretu: `supabase secrets set RESEND_API_KEY="re_xxx"`

Szablon emaili używa:
- **From:** `no-reply@hardbanrecordslab.online`
- **Reply-To:** `spark-connect@hardbanrecordslab.online`

---

## KROK 8 — Środowisko lokalne

```bash
# Skopiuj plik konfiguracyjny
cp .env.example .env
```

Edytuj `.env` — wstaw swoje wartości:
```env
VITE_SUPABASE_URL=https://TWOJ_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69y...
VITE_APP_URL=https://spark-connect.hardbanrecordslab.online
```

Uruchom lokalnie:
```bash
npm install
npm run dev
# Otwórz http://localhost:8080
```

---

## KROK 9 — Deploy na Vercel

### 9a. Przez panel Vercel (najprostsze)

1. Wejdź na **https://vercel.com** → New Project
2. Import z GitHub/upload ZIP
3. Framework preset: **Vite** (auto-detect)
4. Build & Output:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Environment Variables — dodaj:

| Klucz | Wartość |
|---|---|
| `VITE_SUPABASE_URL` | `https://TWOJ_PROJECT_ID.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` (anon key) |
| `VITE_VAPID_PUBLIC_KEY` | `BEl62...` |
| `VITE_APP_URL` | `https://spark-connect.hardbanrecordslab.online` |

6. Kliknij **Deploy** → czekaj ~2 minuty

### 9b. Własna domena na Vercel

Po deploymencie:
1. Vercel Dashboard → Settings → Domains → Add Domain
2. Wpisz: `spark-connect.hardbanrecordslab.online`
3. Vercel pokaże rekord DNS — dodaj go w Cloudflare:
   ```
   Type: CNAME
   Name: spark-connect
   Target: cname.vercel-dns.com
   Proxy: ✅ (pomarańczowa chmurka)
   ```

### 9c. Zaktualizuj Supabase po ustawieniu domeny

Dashboard → Authentication → Settings:
- Site URL: `https://spark-connect.hardbanrecordslab.online`
- Redirect URLs: `https://spark-connect.hardbanrecordslab.online/**`

---

## KROK 10 — Konto administratora

1. Zarejestruj się w aplikacji emailem: `spark-connect@hardbanrecordslab.online`
2. Potwierdź email (link w skrzynce)
3. Panel admina dostępny pod: `https://spark-connect.hardbanrecordslab.online` → zakładka Admin (dolna nawigacja widoczna tylko dla tego emaila)

Lub bezpośrednio: `https://spark-connect.hardbanrecordslab.online/?tab=admin`

---

## KROK 11 — Weryfikacja po deploymencie

Przejdź przez całą listę przed ogłoszeniem aplikacji:

### Auth i onboarding
- [ ] Rejestracja emailem → email potwierdzający przychodzi z `no-reply@hardbanrecordslab.online`
- [ ] Logowanie emailem działa
- [ ] Google OAuth — przekierowanie do Google i powrót do aplikacji
- [ ] Onboarding 4 kroki — dane zapisują się w tabeli `profiles`
- [ ] Reset hasła — email przychodzi, link działa

### Discover
- [ ] Karty profilowe się ładują
- [ ] Swipe w prawo (like) i w lewo (skip) działa
- [ ] Filtry (wiek, odległość, płeć) działają
- [ ] Pasek "Dostępni teraz" pojawia się gdy ktoś ma włączony status

### Upload zdjęć
- [ ] Upload avatara w onboardingu → zdjęcie pojawia się w profilu
- [ ] Upload w galerii profilowej → URL zaczyna się od `https://media.hardbanrecordslab.online/`
- [ ] Upload w czacie → URL zaczyna się od `https://chat.hardbanrecordslab.online/`

### Chat
- [ ] Wiadomości wysyłają się i odbierają w czasie rzeczywistym
- [ ] Emoji picker działa
- [ ] Upload zdjęcia/audio w czacie
- [ ] Push notification przychodzi gdy nowa wiadomość

### Profil i ustawienia
- [ ] Edycja bio, zainteresowań, miasta — zapisuje się
- [ ] Geolokalizacja (przycisk GPS) — pobiera miasto
- [ ] Quiz kompatybilności — wynik zapisuje się na profilu
- [ ] Prywatne zdjęcia — upload, prośba o dostęp, akceptacja
- [ ] Eksport danych GDPR — pobiera plik JSON

### Admin panel
- [ ] Logowanie tylko na `spark-connect@hardbanrecordslab.online`
- [ ] Lista nowych profili widoczna
- [ ] Zatwierdzenie profilu → profil pojawia się w Discover
- [ ] Odrzucenie z powodem działa

### PWA
- [ ] Na telefonie (Chrome): "Dodaj do ekranu głównego" → ikona Spark Connect
- [ ] Otwórz bez internetu → aplikacja ładuje się z cache (SW offline)
- [ ] Push notification prompt pojawia się

---

## KROK 12 — Reklamy (gdy masz użytkowników)

Edytuj `src/lib/adConfig.ts`:
```typescript
// Zmień z 'mock' na wybraną sieć:
export const ACTIVE_AD_PLATFORM: AdPlatform = 'adsterra';

// Wstaw swój ID:
export const ADSENSE_PUBLISHER_ID = 'ca-pub-TWOJ_ID';
```

Odkomentuj skrypt reklamowy w `index.html`.

**Sieci reklamowe akceptujące adult content:**
- **TrafficJunky** — trafficjunky.com (największa sieć adult, należy do Pornhub)
- **AdSterra** — adsterra.com (bez minimalnego ruchu, szybka akceptacja)
- **ExoClick** — exoclick.com (popularna w EU)
- **Google AdSense** — adsense.google.com (ostrożnie — może odrzucić adult content)

---

## KROK 13 — Sekretna konfiguracja — pełna lista sekretów

Wszystkie sekrety ustawiasz przez CLI lub Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# === OBOWIĄZKOWE ===

# Cloudflare R2
supabase secrets set R2_ACCOUNT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set R2_ACCESS_KEY_ID="yyyyyyyyyyyyyyyyyyyyyyyy"
supabase secrets set R2_SECRET_ACCESS_KEY="zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
supabase secrets set R2_PUBLIC_BUCKET="spark-avatars"
supabase secrets set R2_CHAT_BUCKET="spark-chat-media"
supabase secrets set R2_PRIVATE_BUCKET="spark-private"
supabase secrets set R2_PUBLIC_URL="https://media.hardbanrecordslab.online"
supabase secrets set R2_CHAT_URL="https://chat.hardbanrecordslab.online"

# Push Notifications (VAPID)
supabase secrets set VAPID_PUBLIC_KEY="BEl62iUY..."
supabase secrets set VAPID_PRIVATE_KEY_JWK='{"kty":"EC","crv":"P-256",...}'
supabase secrets set VAPID_SUBJECT="mailto:spark-connect@hardbanrecordslab.online"

# Resend (emaile transakcyjne)
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"

# === OPCJONALNE (gdy włączysz) ===

# Sentry (error tracking)
# supabase secrets set SENTRY_DSN="https://xxx@sentry.io/xxx"

# LiveKit (WebRTC Roulette)
# supabase secrets set LIVEKIT_API_KEY="APIxxxxxxxxxx"
# supabase secrets set LIVEKIT_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# supabase secrets set LIVEKIT_HOST="wss://your-project.livekit.cloud"
```

---

## PODSUMOWANIE KOSZTÓW

| Serwis | Free tier | Kiedy płacisz |
|---|---|---|
| Vercel | 100GB bandwidth, ∞ deploys | Pro $20/mies. przy dużym ruchu |
| Supabase | 500MB DB, 50k users, 500k edge calls | Pro $25/mies. przy ~3k DAU |
| Cloudflare R2 | 10GB storage, 0 egress | $0.015/GB powyżej 10GB |
| Resend | 3000 emaili/mies. | $20/mies. za 50k emaili |
| Cloudflare DNS | ∞ | bezpłatne zawsze |

**Przy 0–500 użytkownikach: $0/miesiąc**  
**Przy 1000–5000 użytkownikach: ~$1–15/miesiąc**  
**Przy 10 000+ użytkownikach: ~$150–360/miesiąc**

---

## TABELE BAZY DANYCH — skrócony spis

| Tabela | Opis |
|---|---|
| `profiles` | Dane użytkowników (lat/lng/chemistry_score/admin_approved) |
| `swipes` | Historia swipe'ów (is_super) |
| `matches` | Wzajemne dopasowania |
| `conversations` | Rozmowy powiązane z matchem |
| `messages` | Wiadomości (expires_at, is_read, type) |
| `reactions` | Emoji reakcje na wiadomości |
| `user_settings` | Ustawienia prywatności i powiadomień |
| `chemistry_scores` | Precomputed pary user_a/user_b/score |
| `referrals` | Kody poleceń i nagrody |
| `private_photos` | Prywatne zdjęcia (key w R2) |
| `private_photo_requests` | Prośby o dostęp do prywatnych zdjęć |
| `availability` | Status "dostępny teraz" (wygasa automatycznie) |
| `whisper_messages` | Anonimowe pierwsze wiadomości |
| `super_swipes` | Super swipe z załączoną wiadomością |
| `story_reactions` | Reakcje emoji na stories |
| `push_subscriptions` | Subskrypcje push notifications |
| `reports` | Zgłoszenia użytkowników (bot/spam/etc.) |
| `rate_limits` | Śledzenie limitów (200 wiad/h, 500 swipe/dzień) |

---

## EDGE FUNCTIONS — spis

| Funkcja | Opis | Trigger |
|---|---|---|
| `generate-upload-url` | Presigned URL dla R2 | Upload zdjęcia/video |
| `get-private-photo-url` | Signed URL dla prywatnych zdjęć | Dostęp po weryfikacji |
| `send-push-notification` | Web Push przez VAPID | Nowa wiadomość / match |
| `send-email` | Email przez Resend (5 szablonów) | Welcome / match / etc. |
| `calculate-chemistry` | Batch chemistry scores | pg_cron 03:00 UTC |
| `gdpr-export` | Eksport danych użytkownika (JSON) | Żądanie RODO |

