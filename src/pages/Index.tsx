import { useAppStore } from '@/store/appStore';
import AuthFlow from '@/components/AuthFlow';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const { view } = useAppStore();
  return view === 'app' ? <AppLayout /> : <AuthFlow />;
};

export default Index;
