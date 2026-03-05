import { ThemeToggle } from '@/components/ThemeToggle';
import therIcon from '@/components/sc/therIcon';
import WeatherIcon from '@/components/sc/WeatherIcon';
import React, { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { Menu, X, LogIn, LogOut, User, ChevronDown, Shield, HardHat, AlertCircle, ArrowLeft } from 'lucide-react';
import { fetch7DayForecast, getBrowserCoords, type DailyForecast } from '@/lib/weather';
import type { PageKey, UserRole } from '@/lib/sitecommand-types';
import { ROLE_ACCESS, USER_ROLES } from '@/lib/sitecommand-types';
import { useAuth } from '@/lib/auth';
import Sidebar from './sc/Sidebar';

const DashboardPage = lazy(() => import('./sc/DashboardPage'));
const DailyLogsPage = lazy(() => import('./sc/DailyLogsPage'));
const ActionItemsPage = lazy(() => import('./sc/ActionItemsPage'));
const ProjectsPage = lazy(() => import('./sc/ProjectsPage'));
const CalendarPage = lazy(() => import('./sc/CalendarPage'));
const TimesheetPage = lazy(() => import('./sc/TimesheetPage'));
const OnsiteWalkPage = lazy(() => import('./sc/OnsiteWalkPage'));
const ReportsPage = lazy(() => import('./sc/ReportsPage'));
const JobAuditReportPage = lazy(() => import('./sc/JobAuditReportPage'));
const ArchivePage = lazy(() => import('./sc/ArchivePage'));
const SettingsPage = lazy(() => import('./sc/SettingsPage'));
import JobFormDialog from './sc/JobFormDialog';
import AuthModal from './sc/AuthModal';
import { fetchDashboardStats } from '@/lib/sitecommand-store';

const roleIcons: Record<UserRole, React.ElementType> = {
  site_manager: Shield,
  foreman: HardHat,
  safety_officer: AlertCircle,
};

const AppLayout: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [therErr, settherErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const coords = await getBrowserCoords();
        if (!coords) return;
        const data = await fetch7DayForecast(coords.lat, coords.lon);
        setForecast(data);
      } catch (e: any) {
        settherErr(e?.message ?? String(e));
      }
    })();
  }, []);
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
  const [navStack, setNavStack] = useState<Array<{ page: PageKey; data: any }>>([]);
  const [overdueBadge, setOverdueBadge] = useState(0);

  const userRole = (profile?.role as UserRole) || null;
  // Load overdue count for sidebar badge
  useEffect(() => {
    if (!user) { setOverdueBadge(0); return; }
    fetchDashboardStats()
      .then(s => setOverdueBadge(s.totalOverdue))
      .catch(() => {});
  }, [user?.id, currentPage]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);
  const handleNavigate = useCallback((page: string, data?: any) => {
    const p = page as PageKey;
    // Check role access
    if (userRole && !ROLE_ACCESS[userRole].includes(p)) return;

    setNavStack((prev) => [...prev, { page: currentPage, data: pageData }]);
    setCurrentPage(p);
    setPageData(data || null);
    setMobileMenuOpen(false);
  }, [userRole, currentPage, pageData]);

  const handleBack = useCallback(() => {
    setNavStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setCurrentPage(last.page);
      setPageData(last.data ?? null);
      setMobileMenuOpen(false);
      return prev.slice(0, -1);
    });
  }, []);

const handleJobCreated = useCallback((logId: string) => {
    setShowJobDialog(false);
    setCurrentPage('daily-logs');
    setPageData({ logId });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} onQuickAdd={() => setShowJobDialog(true)} />;
      case 'daily-logs':
        return <DailyLogsPage initialData={pageData} />;
      
      case 'action-items':
        return <ActionItemsPage initialData={pageData} />;
      case 'projects':
        return <ProjectsPage onNavigate={handleNavigate} />;
case 'calendar':
        return <CalendarPage onNavigate={handleNavigate} initialData={pageData} />;
      case 'timesheets':
        return <TimesheetPage />;
      case 'onsite-walk':
        return <OnsiteWalkPage />;
      case 'reports':
        return <ReportsPage onNavigate={handleNavigate} />;
      case 'job-audit':
        return <JobAuditReportPage />;
      case 'archive':
        return <ArchivePage />;
      case 'settings':
        return <SettingsPage userRole={userRole} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} onQuickAdd={() => setShowJobDialog(true)} />;
    }
  };

  // Get display name
  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';
  const displayEmail = user?.email || '';
  const RoleIcon = userRole ? roleIcons[userRole] : User;
  const roleLabel = userRole ? USER_ROLES.find(r => r.value === userRole)?.label || '' : '';


  



  // AUTH_GATE_ACTIVE
  if (authLoading) {
    return <div className='min-h-screen flex items-center justify-center text-foreground'>Loading...</div>;
  }

  if (!user) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center gap-4 bg-[hsl(var(--surface-0))]'>
        <div className='text-2xl font-semibold'>Long Line Diary</div>
        <button
          onClick={() => setShowAuthModal(true)}
          className='px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold'
        >
          Sign In
        </button>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))]">
      
      
      {/* Mobile overlay */}
{/* Sidebar - hidden on mobile unless menu open */}
      <div className="hidden lg:block print:hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => { handleNavigate(page); }}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onQuickAdd={() => setShowJobDialog(true)}
          stats={{ overdue: overdueBadge, highPriority: 0 }}
          userRole={userRole}
        />
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-40 transition-transform duration-300 print:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => { handleNavigate(page); }}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onQuickAdd={() => { setShowJobDialog(true); setMobileMenuOpen(false); }}
          stats={{ overdue: overdueBadge, highPriority: 0 }}
          userRole={userRole}
        />
      </div>

      <main
        className={`transition-all duration-300 min-h-screen print:ml-0 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[hsl(var(--surface-0))] backdrop-blur-xl border-b-4 border-primary px-4 lg:px-6 py-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
  type="button"
  onClick={() => handleBack()}
  disabled={navStack.length === 0}
  className={`p-2 rounded-lg border border-border transition-colors ${
    navStack.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-card'
  }`}
  aria-label="Back"
  title={navStack.length === 0 ? 'No previous page' : 'Back'}
>
  <ArrowLeft className="w-5 h-5 text-foreground" />
</button>

              

              <ThemeToggle /> {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg border border-border hover:bg-card transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
              </button>            </div>            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="text-center leading-none">
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    {now.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {forecast?.days?.[0] ? (
                  <div className="flex items-center gap-2">
                    <WeatherIcon code={forecast.days[0].weatherCode} className="h-8 w-8" />
                    <span className="text-xl font-extrabold text-foreground tabular-nums">
                      {Math.round(forecast.days[0].tempMaxC)}°
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">

              {/* Auth section */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)] animate-pulse" />
              ) : user ? (
                /* Logged in - User menu */
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)]/80 border border-border/50 hover:border-border transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
  <span className="text-xs font-extrabold text-foreground">
    {(displayName?.charAt(0) || "D").toUpperCase()}
  </span>
</div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium text-foreground dark:text-primary leading-none">{displayName}</p>
                      <p className="text-[10px] text-foreground leading-none mt-0.5">{roleLabel}</p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-foreground" />
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-64 bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)] border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-sm font-bold text-foreground">
                              {displayName.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground dark:text-primary truncate">{displayName}</p>
                            <p className="text-xs text-foreground truncate">{displayEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)]/50 w-fit">
                          <RoleIcon className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-medium text-primary">{roleLabel}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5">
                        <button
                          onClick={() => { setShowUserMenu(false); handleNavigate('settings'); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)]/50 hover:text-foreground transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile & Settings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Not logged in - Sign In button */
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-foreground font-semibold text-xs transition-all shadow-lg shadow-primary/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Suspense fallback={
  <div className="p-6 text-foreground text-sm">Loading…</div>
}>
  {renderPage()}</Suspense>
        </div>
      </main>

      {/* Job Creation Dialog */}
      <JobFormDialog
        open={showJobDialog}
        onClose={() => setShowJobDialog(false)}
        onCreated={handleJobCreated}
      />

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default AppLayout;






































































































function HeaderWeather() {
  const [coords, setCoords] = React.useState<{ lat: number; lon: number } | null>(null);
  const [forecast, setForecast] = React.useState<DailyForecast | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loc, setLoc] = React.useState<string>('');

  React.useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setErr(null);

        let c = coords;
        if (!c) {
          const got = await getBrowserCoords();
          if (!got) {
            if (!alive) return;
            setErr('Location blocked');
            setForecast(null);
            return;
          }
          c = got;
          if (!alive) return;
          setCoords(got);
        }

        const f = await fetch7DayForecast(c.lat, c.lon);
        setLoc(`${Math.round(c.lat * 100) / 100}, ${Math.round(c.lon * 100) / 100}`);
if (!alive) return;
        setForecast(f);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || 'Weather failed');
        setForecast(null);
      }
    };

    void load();
    const t = window.setInterval(() => void load(), 30 * 60 * 1000); // 30 min

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [coords]);

  const d0 = forecast?.days?.[0] ?? null;
  const todayHi = d0 ? Math.round(Number(d0.tempMaxC)) : null;
  const todayLo = d0 ? Math.round(Number(d0.tempMinC)) : null;
  const todayCode = d0 ? Number(d0.weatherCode) : null;

  return (
    <div className="hidden sm:flex items-center gap-0.5" title={err ? `Weather: ${err}` : 'Weather (7-day)'}>
      {/* Today pill (small) */}
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-border/50 bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)] text-xs">
        <span className="text-muted-foreground font-semibold">Wx</span>
        <WeatherIcon code={todayCode ?? undefined} className="h-3 w-3" />
        <span className="tabular-nums font-extrabold">
          {todayHi !== null && todayLo !== null ? `${todayHi}°/${todayLo}°` : '—'}
        </span>
      </div>

      {/* 7-day micro strip (desktop only) */}
      {forecast?.days?.length ? (
        <div className="hidden md:flex items-center gap-1">
          {forecast.days.slice(0, 7).map((d) => {
            const hi = Math.round(Number(d.tempMaxC));
            
            const wk = new Date(String(d.date) + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
return (
              <div
                key={d.date}
                className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md border border-border/40 bg-[hsl(var(--surface-1))] shadow-[var(--shadow-1)] text-[10px]"
                title={d.date}
              >
                <span className="text-muted-foreground font-semibold">{wk}</span> <WeatherIcon code={d.weatherCode} className="h-3 w-3" />
                <span className="tabular-nums font-semibold">{hi}°</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}



