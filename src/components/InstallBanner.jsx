import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ArrowDownToLine, X, Sparkles } from 'lucide-react';
import './InstallBanner.css';

export default function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('retina_pwa_banner_dismissed') === 'true';
  });

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('retina_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      setIsDismissed(true);
    }
  };

  return (
    <div className="glass-card install-banner" id="pwa-install-banner">
      <div className="install-banner-left">
        <div className="install-app-icon-wrap">
          <img src="/pwa-192x192.png" alt="Retina AI" className="install-app-icon" />
          <div className="install-badge-glow">
            <Sparkles size={10} />
          </div>
        </div>
        <div className="install-banner-text">
          <div className="install-banner-title">
            <strong>Install Retina AI</strong>
            <span className="install-pill">PWA App</span>
          </div>
          <p className="install-banner-desc">
            Add to home screen or desktop for fast clinical screening and offline app shell access.
          </p>
        </div>
      </div>

      <div className="install-banner-actions">
        <button
          className="btn btn-primary btn-sm install-btn"
          onClick={handleInstallClick}
          id="install-pwa-btn"
          aria-label="Install Retina AI Application"
          title="Install Retina AI on your device"
        >
          <ArrowDownToLine size={15} />
          <span>Install App</span>
        </button>
        <button
          className="btn btn-ghost btn-sm dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
