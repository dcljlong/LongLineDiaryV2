import React, { useState, useEffect } from 'react';
import { useTheme, type ThemeId } from '@/hooks/useTheme';
import { BRAND } from '@/lib/brand';
import {
  Settings, Save, Check, BarChart3, Cloud, Users, ClipboardCheck,
  FileText, RefreshCw, Brain, Bell, Building2, Clock, Shield, HardHat, AlertCircle, User
} from 'lucide-react';
import type { AppSettings, UserRole } from '@/lib/sitecommand-types';
import { DEFAULT_SETTINGS, USER_ROLES } from '@/lib/sitecommand-types';
import { fetchSettings, saveSettings } from '@/lib/sitecommand-store';
import { useAuth } from '@/lib/auth';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary';
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

const roleIcons: Record<string, React.ElementType> = {
  site_manager: Shield,
  foreman: HardHat,
  safety_officer: AlertCircle,
};

const SettingsPage: React.FC<{ userRole?: UserRole | null }> = ({ userRole }) => {
  const { user, profile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<UserRole>('foreman');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then(s => { setSettings(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name);
      setProfileRole(profile.role);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ full_name: profileName, role: profileRole });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setProfileSaving(false);
  };

  const updateFeature = (key: keyof AppSettings['features'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  };

  const featureToggles: { key: keyof AppSettings['features']; label: string; description: string; icon: React.ElementType }[] = [
    { key: 'analytics', label: 'Analytics & Insights', description: 'Track crew productivity, project health, and trends', icon: BarChart3 },
    { key: 'weatherAlerts', label: 'Weather Alerts', description: 'Get weather forecasts and site impact warnings', icon: Cloud },
    { key: 'teamCollaboration', label: 'Team Collaboration', description: 'Comments, mentions, and team notes on logs', icon: Users },
    { key: 'approvalWorkflow', label: 'Approval Workflow', description: 'Require manager sign-off on daily logs', icon: ClipboardCheck },
    { key: 'customReports', label: 'Custom Reports', description: 'Build custom report templates and formats', icon: FileText },
    { key: 'autoCarryForward', label: 'Auto Carry Forward', description: 'Automatically move incomplete items to next day', icon: RefreshCw },
    { key: 'aiSummary', label: 'AI Daily Summary', description: 'Get AI-powered morning briefings across all jobs', icon: Brain },
    { key: 'notifications', label: 'Smart Notifications', description: 'Automated alerts for overdue items and reminders', icon: Bell },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your {BRAND.appName} preferences</p>
        </div>
        
      {/* Theme Presets */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">Theme</h2>
          <p className="text-xs text-muted-foreground mt-1">Choose a preset (applies instantly)</p>
        </div>

        {([
          { id: 'dark-navy', label: 'Dark — Navy (Default)', desc: 'LLD navy, low glare' },
          { id: 'dark-charcoal', label: 'Dark — Charcoal', desc: 'Neutral dark, higher contrast' },
          { id: 'light-soft', label: 'Light — Soft', desc: 'Professional grey background, white fields' },
          { id: 'light-blue', label: 'Light — Blue Tint', desc: 'Subtle blue tone, white fields' },
          { id: 'light-green', label: 'Light — Green Accent', desc: 'Green primary accents, white fields' },
          { id: 'light-contrast', label: 'Light — High Contrast', desc: 'Crisp borders + stronger contrast' },
        ] as { id: ThemeId; label: string; desc: string }[]).map((t) => {
          const selected = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={
                selected
                  ? "w-full p-3 rounded-xl border border-primary/30 bg-primary/10 text-left transition-colors"
                  : "w-full p-3 rounded-xl border border-border bg-card hover:bg-muted text-left transition-colors"
              }
            >
              <div className="text-sm font-semibold text-foreground">{t.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
            </button>
          )
        })}

      </div>
<button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            saved ? 'bg-emerald-500 text-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          } disabled:opacity-50`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Your Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className={inputCls}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                value={user.email || ''}
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </div>
          </div>

          {/* Role Selector */}
          <div className="mb-4">
            <label className={labelCls}>Your Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {USER_ROLES.map(r => {
                const Icon = roleIcons[r.value] || User;
                const selected = profileRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setProfileRole(r.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selected
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-muted border-border hover:border-border'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${selected ? 'text-primary' : 'text-muted-foreground'}`}>{r.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{r.description.split(',')[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              profileSaved ? 'bg-emerald-500 text-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            } disabled:opacity-50`}
          >
            {profileSaved ? <><Check className="w-3 h-3" /> Profile Saved</> : profileSaving ? 'Saving...' : <><Save className="w-3 h-3" /> Update Profile</>}
          </button>
        </div>
      )}

      {/* Not logged in notice */}
      {!user && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Sign in to manage your profile</p>
            <p className="text-xs text-muted-foreground">Create an account to save your settings and access role-based features.</p>
          </div>
        </div>
      )}

      {/* Company Settings */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Company Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Company Name</label>
            <input
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              className={inputCls}
              placeholder="e.g. Long Line Builders"
            />
          </div>
          <div>
            <label className={labelCls}>Company Logo URL</label>
            <input
              value={settings.companyLogo}
              onChange={e => setSettings({ ...settings, companyLogo: e.target.value })}
              className={inputCls}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Used on PDF/Excel exports</p>
          </div>
        </div>
      </div>

      {/* Timesheet Settings */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Timesheet Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Timesheet Period</label>
            <div className="flex gap-2">
              {([1, 2] as const).map(p => (
                <button key={p} onClick={() => setSettings({ ...settings, timesheetPeriod: p })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.timesheetPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}>{p} Week{p > 1 ? 's' : ''}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Week Ending Day</label>
            <select value={settings.weekEndingDay} onChange={e => setSettings({ ...settings, weekEndingDay: e.target.value as any })} className={inputCls}>
              {['Sunday', 'Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Default Lunch</label>
            <div className="flex gap-2">
              {([30, 60] as const).map(m => (
                <button key={m} onClick={() => setSettings({ ...settings, lunchDefaultMinutes: m })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.lunchDefaultMinutes === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}>{m} min</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Rounding (minutes)</label>
          <div className="flex gap-2">
            {[5, 10, 15, 30].map(r => (
              <button key={r} onClick={() => setSettings({ ...settings, roundingMinutes: r })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.roundingMinutes === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}>{r} min</button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Features</h2>
          <span className="text-[10px] text-muted-foreground ml-2">Toggle features on/off</span>
        </div>
        <div className="space-y-3">
          {featureToggles.map(ft => {
            const Icon = ft.icon;
            const enabled = settings.features[ft.key];
            return (
              <div key={ft.key} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                enabled ? 'bg-muted border-border' : 'bg-card border-border opacity-60'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{ft.label}</h3>
                  <p className="text-xs text-muted-foreground">{ft.description}</p>
                </div>
                <button onClick={() => updateFeature(ft.key, !enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Access Info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Role Access Levels</h2>
        <p className="text-xs text-muted-foreground mb-3">Each role has different access to features:</p>
        <div className="space-y-2">
          {USER_ROLES.map(r => {
            const Icon = roleIcons[r.value] || User;
            const isCurrent = userRole === r.value;
            return (
              <div key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isCurrent ? 'bg-primary/10 border-primary/20' : 'bg-muted/20 border-border'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{r.label}</span>
                    {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Current</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;









