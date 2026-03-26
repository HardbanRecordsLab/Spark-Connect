import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, User, MapPin, Calendar, Heart,
  Briefcase, GraduationCap, Camera, Shield, Star, Sparkles,
  Check, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { useR2Upload } from '@/hooks/useR2Upload';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  // Step 1: Basic Info
  displayName: string;
  age: string;
  gender: string;
  city: string;
  bio: string;
  
  // Step 2: Lifestyle
  height: string;
  bodyType: string;
  smoking: string;
  drinking: string;
  tattoos: string;
  piercing: string;
  
  // Step 3: Passions & Interests
  passions: string[];
  interests: string[];
  likes: string[];
  dislikes: string[];
  
  // Step 4: Relationships & Intentions
  relationshipStatus: string;
  relationshipGoal: string;
  lookingFor: string[];
  
  // Step 5: Sexual Orientation
  orientation: string;
  sexualRole: string;
  safeSex: string;
  
  // Step 6: Sexual Preferences (18+)
  kinks: string[];
  experience: string;
  boundaries: string[];
  
  // Step 7: Who I'm Looking For
  targetAgeMin: string;
  targetAgeMax: string;
  targetGender: string;
  targetLocation: string;
  targetRelationship: string;
  
  // Step 8: Photos
  photos: File[];
  avatar: File | null;
  
  // Step 9: Verification
  faceVerified: boolean;
  idVerified: boolean;
}

const ProfileWizard: React.FC = () => {
  const navigate = useNavigate();
  const { setView } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSensitive, setShowSensitive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: '',
    gender: '',
    city: '',
    bio: '',
    interests: [],
    relationshipType: '',
    avatar: null,
    smoking: '',
    drinking: '',
    tattoos: '',
    piercing: '',
    passions: [],
    interests: [],
    likes: [],
    dislikes: [],
    
    // Step 4
    relationshipStatus: '',
    relationshipGoal: '',
    lookingFor: [],
    
    // Step 5
    orientation: '',
    sexualRole: '',
    safeSex: '',
    
    // Step 6
    kinks: [],
    experience: '',
    boundaries: [],
    
    // Step 7
    targetAgeMin: '',
    targetAgeMax: '',
    targetGender: '',
    targetLocation: '',
    targetRelationship: '',
    
    // Step 8
    photos: [],
    avatar: null,
    
    // Step 9
    faceVerified: false,
    idVerified: false
  });

  const totalSteps = 9;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const steps = [
    { id: 0, title: 'Witaj', subtitle: 'Zacznijmy Twoją przygodę' },
    { id: 1, title: 'Podstawowe', subtitle: 'Kim jesteś?' },
    { id: 2, title: 'Styl życia', subtitle: 'Twój styl' },
    { id: 3, title: 'Pasje', subtitle: 'Czym żyjesz?' },
    { id: 4, title: 'Relacje', subtitle: 'Czego szukasz?' },
    { id: 5, title: 'Orientacja', subtitle: 'Twoja tożsamość' },
    { id: 6, title: 'Preferencje', subtitle: '18+ opcji' },
    { id: 7, title: 'Szukam', subtitle: 'Kogo szukasz?' },
    { id: 8, title: 'Zdjęcia', subtitle: 'Pokaż siebie' }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Implement actual profile creation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Musisz być zalogowany/a');

      // Upload avatar if provided
      let avatarUrl = '';
      if (profileData.avatar) {
        const { upload } = useR2Upload();
        const result = await upload({
          bucket: 'avatars',
          file: profileData.avatar,
          filename: `avatar-${user.id}`
        });
        avatarUrl = result.publicUrl;
      }

      // Save profile data to Supabase
      const profileDataToSave = {
        id: user.id,
        display_name: profileData.displayName,
        age: parseInt(profileData.age) || 25,
        gender: profileData.gender,
        orientation: profileData.orientation,
        bio: profileData.bio,
        city: profileData.city,
        avatar_url: avatarUrl,
        interests: profileData.interests || [],
        relationship_goal: profileData.relationshipGoal || '',
        looking_for: profileData.lookingFor || [],
        profile_complete: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileDataToSave)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil utworzony pomyślnie!');
      setView('app');
      navigate('/profile');
    } catch (error) {
      console.error('Profile creation failed:', error);
      toast.error(`Błąd tworzenia profilu: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Witaj w <span className="text-primary">SparkConnect</span></h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Stwórz swój unikalny profil i znajdź idealne dopasowanie
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="glass-strong rounded-2xl p-6 text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Pełna prywatność</h3>
                <p className="text-sm text-muted-foreground">Dane intymne widoczne tylko dla dopasowanych par</p>
              </div>
              <div className="glass-strong rounded-2xl p-6 text-center">
                <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Bez limitów</h3>
                <p className="text-sm text-muted-foreground">Wszystkie funkcje dostępne dla każdego użytkownika</p>
              </div>
              <div className="glass-strong rounded-2xl p-6 text-center">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Inteligentne dopasowania</h3>
                <p className="text-sm text-muted-foreground">Algorytm AI znajdzie idealnych partnerów</p>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Rozpocznijmy 🔥
            </button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold mb-2">Podstawowe informacje</h2>
            <p className="text-muted-foreground mb-6">Powiedz nam kim jesteś — te dane będą widoczne na Twoim profilu.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Imię i nazwisko</label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => updateProfileData('displayName', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                  placeholder="Jan Kowalski"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Wiek</label>
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => updateProfileData('age', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                  placeholder="25"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Płeć</label>
                <select
                  value={profileData.gender}
                  onChange={(e) => updateProfileData('gender', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                >
                  <option value="">Wybierz...</option>
                  <option value="male">Mężczyzna</option>
                  <option value="female">Kobieta</option>
                  <option value="non-binary">Niebinarna</option>
                  <option value="other">Inna</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Miasto</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => updateProfileData('city', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                  placeholder="Warszawa"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">O sobie</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors resize-vertical"
                rows={4}
                placeholder="Opisz siebie w kilku słowach..."
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold mb-2">Styl życia</h2>
            <p className="text-muted-foreground mb-6">Im więcej powiesz o sobie, tym trafniej dobierzemy Twoje dopasowania.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Wzrost</label>
                <select
                  value={profileData.height}
                  onChange={(e) => updateProfileData('height', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                >
                  <option value="">Wybierz...</option>
                  <option value="150-160">150-160 cm</option>
                  <option value="160-170">160-170 cm</option>
                  <option value="170-180">170-180 cm</option>
                  <option value="180-190">180-190 cm</option>
                  <option value="190+">190+ cm</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Typ sylwetki</label>
                <select
                  value={profileData.bodyType}
                  onChange={(e) => updateProfileData('bodyType', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                >
                  <option value="">Wybierz...</option>
                  <option value="slim">Szczupła</option>
                  <option value="athletic">Atletyczna</option>
                  <option value="average">Średnia</option>
                  <option value="curvy">Kształtna</option>
                  <option value="large">Duża</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Palenie</label>
                <select
                  value={profileData.smoking}
                  onChange={(e) => updateProfileData('smoking', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                >
                  <option value="">Wybierz...</option>
                  <option value="never">Nigdy</option>
                  <option value="occasionally">Okazjonalnie</option>
                  <option value="regularly">Regularnie</option>
                  <option value="trying">Próbuję rzucić</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alkohol</label>
                <select
                  value={profileData.drinking}
                  onChange={(e) => updateProfileData('drinking', e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-border focus:border-primary transition-colors"
                >
                  <option value="">Wybierz...</option>
                  <option value="never">Nigdy</option>
                  <option value="occasionally">Okazjonalnie</option>
                  <option value="socially">Społecznie</option>
                  <option value="regularly">Regularnie</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-2">Sekcja w budowie</h3>
            <p className="text-muted-foreground">Ta funkcja będzie dostępna wkrótce</p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-radial-glow">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 glass-strong border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-glass text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id + 1}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-6 h-0.5 transition-colors ${
                      index < currentStep ? 'bg-green-500' : 'bg-glass'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="h-1 bg-glass rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-pink-500"
              style={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 glass rounded-xl font-medium hover:bg-glass transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Wstecz
          </button>

          {currentStep === totalSteps - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Tworzenie profilu...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Utwórz profil
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all"
            >
              Dalej
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard;
