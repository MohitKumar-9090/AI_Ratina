import { useApp } from '../context/AppContext';
import {
  Eye, ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon
} from 'lucide-react';

const severityConfig = {
  // Numeric string keys
  '0': { icon: ShieldCheck, className: 'severity-none', key: 'stage0' },
  '1': { icon: Eye, className: 'severity-mild', key: 'stage1' },
  '2': { icon: AlertTriangle, className: 'severity-moderate', key: 'stage2' },
  '3': { icon: ShieldAlert, className: 'severity-severe', key: 'stage3' },
  '4': { icon: AlertOctagon, className: 'severity-proliferative', key: 'stage4' },

  // Stage keys (without and with spaces)
  stage0: { icon: ShieldCheck, className: 'severity-none', key: 'stage0' },
  stage1: { icon: Eye, className: 'severity-mild', key: 'stage1' },
  stage2: { icon: AlertTriangle, className: 'severity-moderate', key: 'stage2' },
  stage3: { icon: ShieldAlert, className: 'severity-severe', key: 'stage3' },
  stage4: { icon: AlertOctagon, className: 'severity-proliferative', key: 'stage4' },
  'stage 0': { icon: ShieldCheck, className: 'severity-none', key: 'stage0' },
  'stage 1': { icon: Eye, className: 'severity-mild', key: 'stage1' },
  'stage 2': { icon: AlertTriangle, className: 'severity-moderate', key: 'stage2' },
  'stage 3': { icon: ShieldAlert, className: 'severity-severe', key: 'stage3' },
  'stage 4': { icon: AlertOctagon, className: 'severity-proliferative', key: 'stage4' },

  // Single word keys
  none: { icon: ShieldCheck, className: 'severity-none', key: 'stage0' },
  mild: { icon: Eye, className: 'severity-mild', key: 'stage1' },
  moderate: { icon: AlertTriangle, className: 'severity-moderate', key: 'stage2' },
  severe: { icon: ShieldAlert, className: 'severity-severe', key: 'stage3' },
  proliferative: { icon: AlertOctagon, className: 'severity-proliferative', key: 'stage4' },

  // Clinical full name keys
  'no dr': { icon: ShieldCheck, className: 'severity-none', key: 'stage0' },
  'mild dr': { icon: Eye, className: 'severity-mild', key: 'stage1' },
  'moderate dr': { icon: AlertTriangle, className: 'severity-moderate', key: 'stage2' },
  'severe dr': { icon: ShieldAlert, className: 'severity-severe', key: 'stage3' },
  'proliferative dr': { icon: AlertOctagon, className: 'severity-proliferative', key: 'stage4' },
};

export default function SeverityBadge({ severity, size = 'md' }) {
  const { t } = useApp();
  const rawKey = (severity !== null && severity !== undefined) ? String(severity).trim().toLowerCase() : 'stage0';
  const config = severityConfig[rawKey] || severityConfig[`stage${rawKey}`] || severityConfig.stage0;
  const Icon = config.icon;
  const iconSize = size === 'lg' ? 18 : 14;

  return (
    <span className={`severity-badge ${config.className} ${size === 'lg' ? 'severity-badge-lg' : ''}`}>
      <Icon size={iconSize} strokeWidth={2.2} />
      {t(`severity.${config.key}`)}
    </span>
  );
}
