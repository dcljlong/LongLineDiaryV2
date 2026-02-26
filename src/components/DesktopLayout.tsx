import { ThemeToggle } from '@/components/ThemeToggle';
import React, { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { Menu, X, LogIn, LogOut, User, ChevronDown, Shield, HardHat, AlertCircle } from 'lucide-react';
import type { PageKey, UserRole } from '@/lib/sitecommand-types';
import { ROLE_ACCESS, USER_ROLES } from '@/lib/sitecommand-types';
import { useAuth } from '@/lib/auth';
import Sidebar from './sc/Sidebar';

const DashboardPage = lazy(() => import('./sc/DashboardPage'));
const DailyLogsPage = lazy(() => import('./sc/DailyLogsPage'));
const CalendarPage = lazy(() => import('./sc/CalendarPage'));
const TimesheetPage = lazy(() => import('./sc/TimesheetPage'));
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
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
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
    setCurrentPage(p);
    setPageData(data || null);
    setMobileMenuOpen(false);
  }, [userRole]);

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
      case 'calendar':
        return <CalendarPage onNavigate={handleNavigate} initialData={pageData} />;
      case 'timesheets':
        return <TimesheetPage />;
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
      <div className='min-h-screen flex flex-col items-center justify-center gap-6 bg-background'>
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
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

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
        className={`transition-all duration-300 min-h-screen print:ml-0 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-6 py-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThemeToggle />
{/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-card text-foreground"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-sm font-bold text-foreground dark:text-primary capitalize">
                {currentPage.replace('-', ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-3"><span className="text-xs text-foreground hidden sm:inline">
                {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>

              {/* Auth section */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
              ) : user ? (
                /* Logged in - User menu */
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-card/80 border border-border/50 hover:border-border transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground">
                        {displayName.charAt(0).toUpperCase() || 'U'}
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
                      className="absolute right-0 top-full mt-2 w-64 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-sm font-bold text-foreground">
                              {displayName.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground dark:text-primary truncate">{displayName}</p>
                            <p className="text-xs text-foreground truncate">{displayEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-card/50 w-fit">
                          <RoleIcon className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-medium text-primary">{roleLabel}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5">
                        <button
                          onClick={() => { setShowUserMenu(false); handleNavigate('settings'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-card/50 hover:text-foreground transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile & Settings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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











































