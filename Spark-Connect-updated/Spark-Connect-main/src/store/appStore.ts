import { create } from 'zustand';

export type AppView = 'landing' | 'login' | 'register' | 'onboarding' | 'app';
export type AppTab = 'discover' | 'feed' | 'roulette' | 'chats' | 'live' | 'profile' | 'groups' | 'map' | 'visitors' | 'hotnot';

export interface User {
  id: string;
  displayName: string;
  age: number;
  gender: string;
  orientation: string;
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
  donorBadge: boolean;
  coinBalance: number;
  moodStatus: string;
  location: { city: string };
  interests: string[];
  photos: string[];
  relationshipType: string;
  profileComplete: boolean;
  // Enhanced attributes
  height?: number;
  bodyType?: string;
  eyeColor?: string;
  hairColor?: string;
  smoking?: string;
  drinking?: string;
  children?: string;
  education?: string;
  occupation?: string;
  languages?: string[];
  lookingFor?: string[];
  lastOnlineAt?: string;
  profileViews?: number;
  totalLikes?: number;
  verificationVideoUrl?: string;
  stealthMode?: boolean;
  breastSize?: string;
  pubicHair?: string;
  sexualRole?: string;
  safeSex?: string;
  likes?: string[];
  dislikes?: string[];
  relationshipGoal?: string;
  lookingForGender?: string;
  lifestyle18?: string;
  tattoos?: string;
  piercing?: string;
}

export interface Profile {
  id: string;
  displayName: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
  interests: string[];
  relationshipType: string;
  moodStatus: string;
  distance: number | null;
  isVerified: boolean;
  donorBadge: boolean;
  chemistryScore: number;
  gender: string;
  orientation: string;
  // Enhanced attributes
  height?: number;
  bodyType?: string;
  eyeColor?: string;
  hairColor?: string;
  smoking?: string;
  drinking?: string;
  children?: string;
  education?: string;
  occupation?: string;
  languages?: string[];
  lookingFor?: string[];
  lastOnlineAt?: string;
  profileViews?: number;
  totalLikes?: number;
  verificationVideoUrl?: string;
  stealthMode?: boolean;
  breastSize?: string;
  pubicHair?: string;
  sexualRole?: string;
  safeSex?: string;
  likes?: string[];
  dislikes?: string[];
  relationshipGoal?: string;
  lookingForGender?: string;
  lifestyle18?: string;
  tattoos?: string;
  piercing?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'gift' | 'voice';
  sentAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  matchId: string;
  user: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
  isOnline: boolean;
  isTyping: boolean;
}

export interface LiveStream {
  id: string;
  streamer: Profile;
  title: string;
  viewerCount: number;
  tipTotal: number;
  thumbnail: string;
  category: string;
}

interface AppStore {
  view: AppView;
  activeTab: AppTab;
  currentUser: User | null;
  discoverProfiles: Profile[];
  currentCardIndex: number;
  conversations: Conversation[];
  liveStreams: LiveStream[];
  showMatch: boolean;
  matchedProfile: Profile | null;
  showVideoCall: boolean;
  videoCallUser: Profile | null;
  showRoulette: boolean;
  coinAnimation: boolean;

  setView: (view: AppView) => void;
  setActiveTab: (tab: AppTab) => void;
  setCurrentUser: (user: User | null) => void;
  swipeLeft: () => void;
  swipeRight: () => void;
  superLike: () => void;
  dismissMatch: () => void;
  startVideoCall: (user: Profile) => void;
  endVideoCall: () => void;
  addCoins: (amount: number) => void;
}

const mockPhotos = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
];

const mockInterestSets = [
  ['Travel ✈️', 'Photography 📸', 'Coffee ☕', 'Yoga 🧘'],
  ['Music 🎵', 'Gym 💪', 'Cooking 🍳', 'Netflix 🎬'],
  ['Art 🎨', 'Hiking 🏔️', 'Wine 🍷', 'Books 📚'],
  ['Gaming 🎮', 'Movies 🎥', 'Dancing 💃', 'Beach 🏖️'],
  ['Fitness 🏋️', 'Fashion 👗', 'Brunch 🥞', 'Pilates 🤸'],
];

export const mockProfiles: Profile[] = [
  { 
    id: '1', displayName: 'Sofia', age: 26, city: 'Warsaw', bio: 'Life is too short for boring conversations. Let\'s create something memorable 🔥', 
    photos: [mockPhotos[0], mockPhotos[1]], interests: mockInterestSets[0], relationshipType: 'both', moodStatus: 'Looking for fun', 
    distance: 3, isVerified: true, donorBadge: false, chemistryScore: 94, gender: 'female', orientation: 'straight',
    height: 168, bodyType: 'Slim', eyeColor: 'Blue', hairColor: 'Blonde', smoking: 'Never', drinking: 'Socially',
    lastOnlineAt: new Date().toISOString(), profileViews: 1240, totalLikes: 450
  },
  { 
    id: '2', displayName: 'Mia', age: 24, city: 'Kraków', bio: 'Adventure seeker. Photographer. Will probably steal your fries 😈', 
    photos: [mockPhotos[1], mockPhotos[2]], interests: mockInterestSets[1], relationshipType: 'relationship', moodStatus: 'Just chatting', 
    distance: 8, isVerified: true, donorBadge: true, chemistryScore: 87, gender: 'female', orientation: 'bisexual',
    height: 162, bodyType: 'Average', eyeColor: 'Brown', hairColor: 'Brown', smoking: 'Socially', drinking: 'Socially',
    lastOnlineAt: new Date().toISOString(), profileViews: 2100, totalLikes: 890
  },
  { 
    id: '3', displayName: 'Elena', age: 29, city: 'Gdańsk', bio: 'Wine enthusiast, amateur chef, professional overthinker. Ask me about my travels 🌍', 
    photos: [mockPhotos[2], mockPhotos[3]], interests: mockInterestSets[2], relationshipType: 'hookup', moodStatus: 'Serious only', 
    distance: 15, isVerified: false, donorBadge: false, chemistryScore: 76, gender: 'female', orientation: 'straight',
    height: 175, bodyType: 'Athletic', eyeColor: 'Green', hairColor: 'Black', smoking: 'Regularly', drinking: 'Regularly',
    lastOnlineAt: new Date(Date.now() - 3600000).toISOString(), profileViews: 850, totalLikes: 230
  },
  { id: '4', displayName: 'Zara', age: 23, city: 'Wrocław', bio: 'Gym rat by day, movie buff by night. Looking for my partner in crime 🎬', photos: [mockPhotos[4], mockPhotos[0]], interests: mockInterestSets[3], relationshipType: 'both', moodStatus: 'Looking for fun', distance: 22, isVerified: true, donorBadge: false, chemistryScore: 91, gender: 'female', orientation: 'straight' },
  { id: '5', displayName: 'Alex', age: 28, city: 'Poznań', bio: 'Tech guy with a creative soul. Into deep talks and good food 🍕', photos: [mockPhotos[5], mockPhotos[6]], interests: mockInterestSets[4], relationshipType: 'relationship', moodStatus: 'Just chatting', distance: 5, isVerified: true, donorBadge: true, chemistryScore: 83, gender: 'male', orientation: 'straight' },
  { id: '6', displayName: 'Marco', age: 31, city: 'Warsaw', bio: 'Italian, passionate about food and even more passionate about life 🍝', photos: [mockPhotos[6], mockPhotos[7]], interests: mockInterestSets[0], relationshipType: 'hookup', moodStatus: 'Looking for fun', distance: 2, isVerified: false, donorBadge: false, chemistryScore: 79, gender: 'male', orientation: 'straight' },
];

const mockConversations: Conversation[] = [
  {
    id: 'c1', matchId: 'm1',
    user: mockProfiles[0],
    lastMessage: 'Hey! I saw you like photography too 📸',
    lastMessageAt: '2 min ago',
    unreadCount: 2,
    isOnline: true,
    isTyping: true,
    messages: [
      { id: 'msg1', senderId: '1', content: 'Hey! I saw you like photography too 📸', type: 'text', sentAt: '14:32', isRead: false },
      { id: 'msg2', senderId: 'me', content: 'Yes! I shoot mostly street and portraits. You?', type: 'text', sentAt: '14:33', isRead: true },
      { id: 'msg3', senderId: '1', content: 'Landscapes and travel! We should do a collab shoot sometime 🔥', type: 'text', sentAt: '14:34', isRead: false },
    ]
  },
  {
    id: 'c2', matchId: 'm2',
    user: mockProfiles[1],
    lastMessage: 'That place sounds amazing, when are you going?',
    lastMessageAt: '1 hr ago',
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    messages: [
      { id: 'msg4', senderId: 'me', content: 'I\'m planning a trip to Bali next month', type: 'text', sentAt: '13:10', isRead: true },
      { id: 'msg5', senderId: '2', content: 'That place sounds amazing, when are you going?', type: 'text', sentAt: '13:45', isRead: true },
    ]
  },
  {
    id: 'c3', matchId: 'm3',
    user: mockProfiles[4],
    lastMessage: 'Haha, same! We should watch it together sometime 😄',
    lastMessageAt: '3 hr ago',
    unreadCount: 1,
    isOnline: true,
    isTyping: false,
    messages: [
      { id: 'msg6', senderId: '5', content: 'Have you seen the new season of The Bear?', type: 'text', sentAt: '11:20', isRead: true },
      { id: 'msg7', senderId: 'me', content: 'Obsessed with it!!', type: 'text', sentAt: '11:25', isRead: true },
      { id: 'msg8', senderId: '5', content: 'Haha, same! We should watch it together sometime 😄', type: 'text', sentAt: '11:30', isRead: false },
    ]
  },
];

const mockLiveStreams: LiveStream[] = [
  { id: 'l1', streamer: mockProfiles[0], title: 'Chill vibes & good convos 💕', viewerCount: 234, tipTotal: 1820, thumbnail: mockPhotos[0], category: 'Chill & Talk' },
  { id: 'l2', streamer: mockProfiles[1], title: 'Q&A + sending gifts! 🎁', viewerCount: 156, tipTotal: 980, thumbnail: mockPhotos[1], category: 'Flirt Lounge' },
  { id: 'l3', streamer: mockProfiles[4], title: 'Speed dating vibes ⚡', viewerCount: 89, tipTotal: 430, thumbnail: mockPhotos[5], category: 'Speed Dating' },
  { id: 'l4', streamer: mockProfiles[2], title: 'Wine & chat night 🍷', viewerCount: 312, tipTotal: 2100, thumbnail: mockPhotos[2], category: 'Chill & Talk' },
];

export const useAppStore = create<AppStore>((set, get) => ({
  view: 'landing',
  activeTab: 'discover',
  currentUser: null,
  discoverProfiles: [...mockProfiles],
  currentCardIndex: 0,
  conversations: mockConversations,
  liveStreams: mockLiveStreams,
  showMatch: false,
  matchedProfile: null,
  showVideoCall: false,
  videoCallUser: null,
  showRoulette: false,
  coinAnimation: false,

  setView: (view) => set({ view }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  
  swipeLeft: () => {
    const { currentCardIndex, discoverProfiles } = get();
    if (currentCardIndex < discoverProfiles.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1 });
    }
  },
  
  swipeRight: () => {
    const { currentCardIndex, discoverProfiles } = get();
    const profile = discoverProfiles[currentCardIndex];
    if (Math.random() > 0.4) {
      set({ showMatch: true, matchedProfile: profile });
    }
    if (currentCardIndex < discoverProfiles.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1 });
    }
  },
  
  superLike: () => {
    const { currentCardIndex, discoverProfiles } = get();
    const profile = discoverProfiles[currentCardIndex];
    set({ showMatch: true, matchedProfile: profile });
    if (currentCardIndex < discoverProfiles.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1 });
    }
  },
  
  dismissMatch: () => set({ showMatch: false, matchedProfile: null }),
  startVideoCall: (user) => set({ showVideoCall: true, videoCallUser: user }),
  endVideoCall: () => set({ showVideoCall: false, videoCallUser: null }),
  addCoins: (amount) => {
    const { currentUser } = get();
    if (currentUser) {
      set({ currentUser: { ...currentUser, coinBalance: currentUser.coinBalance + amount }, coinAnimation: true });
      setTimeout(() => set({ coinAnimation: false }), 2000);
    }
  },
}));
