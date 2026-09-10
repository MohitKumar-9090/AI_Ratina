import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ScanEye,
  Users,
  FileText,
  Settings
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { t } = useApp();
  const location = useLocation();

  // Hide nav during full-screen processing scanner
  if (location.pathname === '/screening/processing') return null;

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.home'), id: 'nav-home' },
    { to: '/screening', icon: ScanEye, label: t('nav.newScreening'), id: 'nav-screening' },
    { to: '/patients', icon: Users, label: t('nav.patients'), id: 'nav-patients' },
    { to: '/reports', icon: FileText, label: t('nav.reports'), id: 'nav-reports' },
    { to: '/settings', icon: Settings, label: t('nav.settings'), id: 'nav-settings' },
  ];

  return (
    <nav className="bottom-nav-container" id="main-nav" aria-label="Main Navigation">
      <div className="bottom-nav glass-nav">
        {links.map(link => {
          const isHome = link.to === '/dashboard';
          const isActive = isHome
            ? location.pathname === '/' || location.pathname === '/dashboard'
            : location.pathname.startsWith(link.to);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              id={link.id}
            >
              <div className="nav-icon-wrapper">
                <link.icon size={22} strokeWidth={2.1} />
              </div>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
