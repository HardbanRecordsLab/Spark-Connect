import { useAppStore } from '@/store/appStore';
import AuthFlow from '@/components/AuthFlow';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const { view } = useAppStore();
  
  return (
    <div className="app-container app-noise shadow-2xl border-x border-white/5 h-screen">
      {view === 'app' ? <AppLayout /> : <AuthFlow />}
    </div>
  );
};

export default Index;
