import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Users, AlertTriangle, CheckCircle, MapPin, TrendingUp } from 'lucide-react';
import stats from '../data/dashboardStats.json';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { t } = useApp();

  const statCards = [
    { label: t('admin.thisMonth'), value: stats.thisMonth, change: '+12%', icon: Activity, color: 'var(--accent-primary)' },
    { label: t('admin.drRate'), value: `${stats.drPositiveRate}%`, change: '-2.1%', icon: AlertTriangle, color: 'var(--accent-alert)' },
    { label: t('dashboard.referrals'), value: stats.referralsMade, change: '+5', icon: Users, color: 'var(--accent-caution)' }
  ];

  return (
    <div className="page" id="admin-page">
      <div className="page-header">
        <h1 className="page-title">{t('admin.title')}</h1>
        <p className="page-subtitle">{t('admin.subtitle')}</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid-3 stagger-children" id="admin-kpis">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div className="glass-card kpi-card" key={i}>
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: `${c.color}20`, color: c.color }}>
                  <Icon size={20} />
                </div>
                <span className="kpi-change">{c.change}</span>
              </div>
              <div className="kpi-value">{c.value}</div>
              <div className="kpi-label">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Monthly Trend Chart */}
        <div className="glass-card chart-card" id="monthly-trend-chart">
          <h3>
            <TrendingUp size={18} className="chart-heading-icon" />
            {t('admin.screeningsOverTime')}
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="screenings" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} name="Total Screenings" />
                <Bar dataKey="drPositive" fill="var(--accent-alert)" radius={[6, 6, 0, 0]} name="DR Positive" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie */}
        <div className="glass-card chart-card" id="severity-distribution-chart">
          <h3>{t('admin.bySeverity')}</h3>
          <div className="chart-wrapper flex-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {stats.severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-legend">
            {stats.severityDistribution.map((item, i) => (
              <div className="legend-item" key={i}>
                <span className="legend-dot" style={{ background: item.color }}></span>
                <span className="legend-label">{item.grade} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Village Breakdown */}
      <div className="glass-card chart-card" id="village-breakdown-card">
        <h3>
          <MapPin size={18} className="chart-heading-icon" />
          {t('admin.byVillage')}
        </h3>
        <div className="village-table">
          {stats.villageBreakdown.map((v, i) => {
            const positivePct = Math.round((v.drPositive / v.total) * 100);
            return (
              <div className="village-row" key={i}>
                <div className="village-name">{v.village}</div>
                <div className="village-bar-wrapper">
                  <div className="village-bar" style={{ width: `${positivePct}%` }}></div>
                </div>
                <div className="village-stats">
                  <span>{v.drPositive} / {v.total}</span>
                  <span className="village-pct">({positivePct}% DR+)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
