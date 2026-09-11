import { usePWAInstall } from '../hooks/usePWAInstall';
import { ArrowDownToLine } from 'lucide-react';
import './InstallBanner.css';

export default function InstallBanner({ className = '' }) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // If already installed or not currently installable, do not render the install button
  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    await promptInstall();
  };

  return (
    <button
      type="button"
      className={`btn-install-app ${className}`}
      onClick={handleInstallClick}
      id="install-app-btn"
      aria-label="Install App"
      title="Install App"
    >
      <ArrowDownToLine size={16} className="install-icon" />
      <span>Install App</span>
    </button>
  );
}
