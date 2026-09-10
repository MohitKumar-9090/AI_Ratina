import { useApp } from '../context/AppContext';
import { WifiOff } from 'lucide-react';
import './OfflineIndicator.css';

export default function OfflineIndicator() {
  const { isOffline, t } = useApp();

  if (!isOffline) return null;

  return (
    <div className="offline-bar" id="offline-indicator">
      <WifiOff size={16} />
      <span>{t('offline.status')}</span>
    </div>
  );
}
