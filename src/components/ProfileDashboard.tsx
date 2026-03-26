import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, Heart, MessageSquare, Shield, Star, 
  Users, Map, Camera, Edit3, Share2, ChevronRight,
  Home, Search, Bell, LogOut, Menu, X
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProfileStats {
  views: number;
  likes: number;
  matches: number;
  messages: number;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const ProfileDashboard: React.FC = () => {
  const { currentUser, setView } = useAppStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    views: 0,
    likes: 0,
    matches: 0,
    messages: 0
  });

  const navigationItems: NavigationItem[] = [
    { id: 'overview', label: 'Przegląd', icon: <Home className="w-4 h-4" /> },
    { id: 'profile', label: 'Mój profil', icon: <User className="w-4 h-4" /> },
    { id: 'photos', label: 'Zdjęcia', icon: <Camera className="w-4 h-4" /> },
    { id: 'matches', label: 'Dopasowania', icon: <Heart className="w-4 h-4" />, badge: stats.matches },
    { id: 'messages', label: 'Wiadomości', icon: <MessageSquare className="w-4 h-4" />, badge: stats.messages },
    { id: 'discover', label: 'Odkrywaj', icon: <Search className="w-4 h-4" /> },
    { id: 'map', label: 'Mapa', icon: <Map className="w-4 h-4" /> },
    { id: 'settings', label: 'Ustawienia', icon: <Settings className="w-4 h-4" /> },
  ];

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      try {
        // TODO: Replace with actual API call
        setStats({
          views: Math.floor(Math.random() * 1000) + 100,
          likes: Math.floor(Math.random() * 500) + 50,
          matches: Math.floor(Math.random() * 100) + 10,
          messages: Math.floor(Math.random() * 200) + 20
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        toast.error('Nie udało się załadować statystyk');
      }
    };

    loadStats();
  }, []);

  const handleLogout = async () => {
    try {
      // TODO: Implement actual logout
      setView('landing');
      navigate('/');
      toast.success('Wylogowano pomyślnie');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Błąd wylogowania');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold mb-6">Statystyki profilu</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 glass rounded-xl">
                  <div className="text-3xl font-bold text-primary mb-2">{stats.views}</div>
                  <div className="text-sm text-muted-foreground">Wyświetleń</div>
                </div>
                <div className="text-center p-4 glass rounded-xl">
                  <div className="text-3xl font-bold text-pink-500 mb-2">{stats.likes}</div>
                  <div className="text-sm text-muted-foreground">Polubień</div>
                </div>
                <div className="text-center p-4 glass rounded-xl">
                  <div className="text-3xl font-bold text-green-500 mb-2">{stats.matches}</div>
                  <div className="text-sm text-muted-foreground">Dopasowań</div>
                </div>
                <div className="text-center p-4 glass rounded-xl">
                  <div className="text-3xl font-bold text-blue-500 mb-2">{stats.messages}</div>
                  <div className="text-sm text-muted-foreground">Wiadomości</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4">Aktywność ostatnia</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Aktywny teraz</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Online</span>
                </div>
                <div className="flex items-center justify-between p-3 glass rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Ostatnie logowanie</span>
                  </div>
                  <span className="text-sm text-muted-foreground">2h temu</span>
                </div>
                <div className="flex items-center justify-between p-3 glass rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Ostatnia wiadomość</span>
                  </div>
                  <span className="text-sm text-muted-foreground">5h temu</span>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edytuj profil</h2>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edytuj
              </button>
            </div>
            <div className="text-center py-8">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Przejdź do edycji profilu</p>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-6 text-center"
          >
            <div className="py-16">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-bold mb-2">Sekcja w budowie</h3>
              <p className="text-muted-foreground">Ta funkcja będzie dostępna wkrótce</p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-radial-glow">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass rounded-xl flex items-center justify-center"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-60 glass-strong border-r border-border h-screen sticky top-0 flex flex-col"
            >
              {/* Logo */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">🔥</span>
                  </div>
                  <div>
                    <div className="font-bold">Spark Connect</div>
                    <div className="text-xs text-primary">Premium</div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-glass text-foreground hover:text-primary'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* User section */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(currentUser?.displayName)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">
                      {currentUser?.displayName || 'Użytkownik'}
                    </div>
                    <div className="text-xs text-muted-foreground">Premium</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl hover:bg-glass text-destructive transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Wyloguj</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {activeSection === 'overview' && 'Panel główny'}
                {activeSection === 'profile' && 'Mój profil'}
                {activeSection === 'photos' && 'Zdjęcia'}
                {activeSection === 'matches' && 'Dopasowania'}
                {activeSection === 'messages' && 'Wiadomości'}
                {activeSection === 'discover' && 'Odkrywaj'}
                {activeSection === 'map' && 'Mapa'}
                {activeSection === 'settings' && 'Ustawienia'}
              </h1>
              <p className="text-muted-foreground">
                {activeSection === 'overview' && 'Witaj z powrotem! Oto Twój panel sterowania.'}
                {activeSection === 'profile' && 'Zarządzaj swoimi danymi profilu.'}
                {activeSection === 'photos' && 'Dodawaj i zarządzaj swoimi zdjęciami.'}
                {activeSection === 'matches' && 'Przeglądaj swoje dopasowania.'}
                {activeSection === 'messages' && 'Sprawdź swoje wiadomości.'}
                {activeSection === 'discover' && 'Odkrywaj nowych ludzi.'}
                {activeSection === 'map' && 'Znajdź ludzi w Twojej okolicy.'}
                {activeSection === 'settings' && 'Dostosuj swoje preferencje.'}
              </p>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileDashboard;
