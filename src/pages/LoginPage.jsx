import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, UserCog, ShieldCheck, LogIn } from 'lucide-react';
import './LoginPage.css';

const roles = [
  { id: 'healthWorker', icon: Eye, color: '#2EC4B6' },
  { id: 'physician', icon: UserCog, color: '#06D6A0' },
  { id: 'admin', icon: ShieldCheck, color: '#FFD166' },
];

export default function LoginPage() {
  const { setRole, setUserName, t } = useApp();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('healthWorker');
  const [name, setName] = useState('');

  const handleSignIn = (e) => {
    e.preventDefault();
    setRole(selectedRole);
    setUserName(name || 'Dr. Sharma');
    navigate(selectedRole === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="login-page" id="login-page">
      {/* Animated background shapes */}
      <div className="login-bg-shapes">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>

      <div className="login-container animate-fade-in">
        {/* Logo/Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <Eye size={36} strokeWidth={1.5} />
          </div>
          <h1 className="login-title">{t('app.title')}</h1>
          <p className="login-tagline">{t('app.tagline')}</p>
        </div>

        {/* Login Card */}
        <form className="login-card glass-card-static" onSubmit={handleSignIn} id="login-form">
          <h2>{t('login.welcome')}</h2>

          {/* Name Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-name">{t('login.name')}</label>
            <input
              type="text"
              id="login-name"
              className="form-input"
              placeholder={t('login.enterName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">{t('login.selectRole')}</label>
            <div className="role-selector">
              {roles.map(role => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-option glass-card ${selectedRole === role.id ? 'role-active' : ''}`}
                    onClick={() => setSelectedRole(role.id)}
                    id={`role-${role.id}`}
                    style={selectedRole === role.id ? { borderColor: role.color, boxShadow: `0 0 20px ${role.color}33` } : {}}
                  >
                    <Icon size={24} style={selectedRole === role.id ? { color: role.color } : {}} />
                    <span>{t(`login.${role.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign In Button */}
          <button type="submit" className="btn btn-primary btn-lg login-submit" id="login-submit">
            <LogIn size={20} />
            {t('login.signIn')}
          </button>
        </form>

        <p className="login-footer">{t('app.subtitle')}</p>
      </div>
    </div>
  );
}
