# 🔥 Spark Connect — Randkowa aplikacja PWA 18+

**spark-connect.hardbanrecordslab.online**  
Całkowicie bezpłatna aplikacja randkowa 18+. Monetyzacja wyłącznie przez reklamy.

---

## Szybki start (lokalnie)

```bash
npm install
cp .env.example .env        # uzupełnij VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev                 # http://localhost:8080
```

Pełna instrukcja krok po kroku → **LAUNCH_GUIDE.md**

---

## Stack

| Warstwa | Technologia |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| State | Zustand |
| UI | shadcn/ui + Radix |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Storage | Cloudflare R2 (zdjęcia, media, prywatne pliki) |
| Deploy | Vercel (frontend) |
| Push | Web Push API + VAPID |
| Email | Resend API |
| PWA | Service Worker + Web App Manifest |

---

## Architektura

```
spark-connect.hardbanrecordslab.online  ← Vercel
         │
         ├── Supabase
         │   ├── PostgreSQL (13 migracji, RLS)
         │   ├── Auth (email + Google OAuth)
         │   ├── Realtime WebSocket (czat, presence)
         │   └── Edge Functions (6 funkcji Deno)
         │
         └── Cloudflare R2
             ├── spark-avatars    → media.hardbanrecordslab.online
             ├── spark-chat-media → chat.hardbanrecordslab.online
             └── spark-private    → signed URLs (prywatne zdjęcia)
```

---

## Deploy (skrót)

```bash
# 1. Supabase — uruchom migracje
npx supabase link --project-ref TWOJ_PROJECT_ID
npx supabase db push

# 2. Supabase — wdróż Edge Functions
npx supabase functions deploy

# 3. Supabase — ustaw sekrety (patrz LAUNCH_GUIDE.md Krok 13)
npx supabase secrets set R2_ACCOUNT_ID="..."
npx supabase secrets set VAPID_PUBLIC_KEY="..."
npx supabase secrets set RESEND_API_KEY="..."

# 4. Vercel — deploy
npm run build
vercel --prod
```

---

## Zmienne środowiskowe (.env)

```env
VITE_SUPABASE_URL=https://TWOJ_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_VAPID_PUBLIC_KEY=BEl62...
VITE_APP_URL=https://spark-connect.hardbanrecordslab.online
```

Klucze R2 i service_role NIE trafiają do .env — są w Supabase Secrets.

---

## Komponenty (37)

`AuthFlow` · `DiscoverPage` · `ChatsPage` · `ProfilePage` · `AppLayout`  
`AdminPanel` · `SettingsPage` · `MatchModal` · `FilterPanel`  
`PrivatePhotos` · `AvailableNow` · `WhoLikedMe` · `DailyStreak`  
`SpeedDating` · `RoulettePage` · `LivePage` · `StoriesSystem`  
`CompatibilityQuiz` · `WhisperMessage` · `SuperSwipe` · `IcebreakerModal`  
`RewardedAd` · `AdBanner` · `GiftSystem` · `VibeCheck` · `VibeRooms`  
`FaceVerify` · `ProfilePhotoGallery` · `ReferralSystem` · `EmojiPicker`  
`ChatContextMenu` · `VideoCallOverlay` · `ErrorBoundary` + więcej

## Hooki (11)

`useAuth` · `useProfile` · `useDiscoverProfiles` · `useConversations`  
`useR2Upload` · `useAvailability` · `useUserSettings` · `useGeolocation`  
`useNSFWCheck` · `usePushNotifications` · `use-toast`

## Edge Functions (6)

`generate-upload-url` · `get-private-photo-url` · `send-push-notification`  
`send-email` · `calculate-chemistry` · `gdpr-export`

## Migracje SQL (13)

Tabele: `profiles` · `swipes` · `matches` · `conversations` · `messages`  
`reactions` · `reports` · `push_subscriptions` · `user_settings`  
`chemistry_scores` · `referrals` · `private_photos` · `private_photo_requests`  
`availability` · `whisper_messages` · `super_swipes` · `story_reactions`  
`rate_limits`

---

## Admin

Panel admina dostępny tylko dla: **spark-connect@hardbanrecordslab.online**  
URL: `https://spark-connect.hardbanrecordslab.online` → zakładka Admin

Funkcje admina: ręczna weryfikacja profili (approve/reject/ban), podgląd zdjęć, history zgłoszeń, statystyki.

---

## Koszty

| Skala | Miesięcznie |
|---|---|
| 0–500 użytkowników | $0 |
| 1 000–5 000 użytkowników | ~$1–15 |
| 10 000–50 000 użytkowników | ~$150–360 |

Przychody z reklam przy 10k DAU (adult niche): ~$2 000–8 000/mies.

---

MIT License · Spark Connect 2026
