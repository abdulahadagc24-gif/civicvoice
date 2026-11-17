import { useEffect, useState } from 'react';
import {
  Droplets,
  Lightbulb,
  Route,
  Trash2,
  Trees,
} from 'lucide-react';
import {
  CATEGORY_LIST,
  CATEGORY_META,
  DEPARTMENT_OPTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUGGESTIONS,
} from './data/civicData';
import type {
  AppView,
  AuditLogEntry,
  AuthUser,
  CivicSuggestion,
  DashboardNotification,
  InfrastructureCategoryId,
  LightingMode,
  ProposalPriority,
  ProposalStatus,
  SelectedAssetInfo,
} from './types/civic';
import { CityViewport } from './components/CityViewport';
import { CategoryPanel } from './components/CategoryPanel';
import { ProposalsBoard } from './components/ProposalsBoard';
import { SuggestionModal } from './components/SuggestionModal';
import { CitizenDashboard } from './components/dashboard/CitizenDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AuthPages } from './components/auth/AuthPages';

const STORAGE_KEY = 'civicvoice_suggestions_ka_v1';
const NOTIF_STORAGE_KEY = 'civicvoice_notifications_ka_v1';
const AUDIT_STORAGE_KEY = 'civicvoice_audit_ka_v1';
const AUTH_STORAGE_KEY = 'civicvoice_auth_user_ka_v1';

const SECTOR_ICONS: Record<InfrastructureCategoryId, typeof Lightbulb> = {
  streetlights: Lightbulb,
  roads: Route,
  parks: Trees,
  water: Droplets,
  waste: Trash2,
};

const DEPARTMENT_BY_CATEGORY: Record<InfrastructureCategoryId, string> = {
  streetlights: DEPARTMENT_OPTIONS[0],
  roads: DEPARTMENT_OPTIONS[1],
  parks: DEPARTMENT_OPTIONS[2],
  water: DEPARTMENT_OPTIONS[3],
  waste: DEPARTMENT_OPTIONS[4],
};

export default function App() {
  const [view, setView] = useState<AppView>('city');

  const [suggestions, setSuggestions] = useState<CivicSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fall back to initial seed data
    }
    return INITIAL_SUGGESTIONS;
  });

  const [notifications, setNotifications] = useState<DashboardNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as AuthUser;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [selectedCategory, setSelectedCategory] =
    useState<InfrastructureCategoryId | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SelectedAssetInfo | null>(
    null,
  );
  const [lightingMode, setLightingMode] = useState<LightingMode>('dusk');
  const [focusTrigger, setFocusTrigger] = useState<{
    category: InfrastructureCategoryId | null;
    seq: number;
  }>({ category: null, seq: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultCategory, setModalDefaultCategory] =
    useState<InfrastructureCategoryId>('streetlights');
  const [modalDefaultLocation, setModalDefaultLocation] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
      if (authUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [suggestions, notifications, auditLogs, authUser]);

  const pushNotification = (
    payload: Omit<DashboardNotification, 'id' | 'timestamp' | 'read'>,
  ) => {
    setNotifications((prev) => [
      {
        ...payload,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const pushAudit = (
    action: string,
    targetTitle: string,
    department: string,
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        actor: `${authUser?.role === 'admin' ? authUser.name : 'R. Kulkarni'} (Admin)`,
        action,
        targetTitle,
        timestamp: `Today, ${timeStr}`,
        department,
      },
      ...prev,
    ]);
  };

  const handleSelectAssetFrom3D = (asset: SelectedAssetInfo) => {
    setSelectedAsset(asset);
    setSelectedCategory(asset.category);
  };

  const handleFocusFromDock = (category: InfrastructureCategoryId | null) => {
    setSelectedCategory(category);
    setSelectedAsset(null);
  };

  const handleClosePanel = () => {
    setSelectedCategory(null);
    setSelectedAsset(null);
    setFocusTrigger((prev) => ({ category: null, seq: prev.seq + 1 }));
  };

  const handleLocateCategoryIn3D = (category: InfrastructureCategoryId) => {
    setView('city');
    setSelectedCategory(category);
    setSelectedAsset(null);
    setFocusTrigger((prev) => ({ category, seq: prev.seq + 1 }));
    requestAnimationFrame(() => {
      const el = document.getElementById('city-explorer');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleToggleVote = (id: string) => {
    setSuggestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextVoted = !item.hasVoted;
        return {
          ...item,
          hasVoted: nextVoted,
          votes: nextVoted ? item.votes + 1 : Math.max(0, item.votes - 1),
        };
      }),
    );
  };

  const handleToggleBookmark = (id: string) => {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item,
      ),
    );
  };

  const handleWithdrawProposal = (id: string) => {
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOpenSubmitModal = (
    category?: InfrastructureCategoryId,
    defaultLoc?: string,
  ) => {
    setModalDefaultCategory(category ?? selectedCategory ?? 'streetlights');
    setModalDefaultLocation(defaultLoc);
    setModalOpen(true);
  };

  const handleCreateSuggestion = (
    payload: Omit<CivicSuggestion, 'id' | 'createdAt' | 'status' | 'votes'>,
  ) => {
    const newId = `cv-${Date.now()}`;
    const newItem: CivicSuggestion = {
      ...payload,
      author: authUser?.name ?? payload.author,
      id: newId,
      createdAt: 'Just now',
      status: 'Under Review',
      votes: 1,
      hasVoted: true,
      isMine: true,
      department: DEPARTMENT_BY_CATEGORY[payload.category],
      assignedTo: 'Pending triage',
      slaDays: 1,
    };
    setSuggestions((prev) => [newItem, ...prev]);

    pushNotification({
      title: 'New citizen proposal submitted',
      message: `${payload.title} (${CATEGORY_META[payload.category].name}) entered the triage queue.`,
      type: 'action',
      audience: 'both',
      relatedProposalId: newId,
      category: payload.category,
    });

    if (view === 'city') {
      setSelectedCategory(payload.category);
      setFocusTrigger((prev) => ({
        category: payload.category,
        seq: prev.seq + 1,
      }));
    }
  };

  // Admin handlers
  const handleAdminUpdateStatus = (id: string, status: ProposalStatus) => {
    const target = suggestions.find((s) => s.id === id);
    if (!target || target.status === status) return;

    setSuggestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    pushAudit(
      `Changed status to ${status}`,
      target.title,
      target.department || DEPARTMENT_BY_CATEGORY[target.category],
    );
    pushNotification({
      title: `Proposal updated to ${status}`,
      message: `${target.title} is now marked as ${status}.`,
      type: 'status',
      audience: 'citizen',
      relatedProposalId: id,
      category: target.category,
    });
  };

  const handleAdminBulkUpdateStatus = (
    ids: string[],
    status: ProposalStatus,
  ) => {
    setSuggestions((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, status } : item)),
    );
    pushAudit(
      `Bulk updated ${ids.length} proposals to ${status}`,
      `${ids.length} selected items`,
      'Municipal Operations',
    );
    pushNotification({
      title: `${ids.length} proposals moved to ${status}`,
      message: `Batch triage update completed across selected district items.`,
      type: 'status',
      audience: 'both',
    });
  };

  const handleAdminUpdatePriority = (
    id: string,
    priority: ProposalPriority,
  ) => {
    const target = suggestions.find((s) => s.id === id);
    if (!target || target.priority === priority) return;

    setSuggestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, priority } : item)),
    );
    pushAudit(
      `Set priority to ${priority}`,
      target.title,
      target.department || DEPARTMENT_BY_CATEGORY[target.category],
    );
  };

  const handleAdminUpdateDepartment = (id: string, department: string) => {
    const target = suggestions.find((s) => s.id === id);
    if (!target || target.department === department) return;

    setSuggestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, department } : item)),
    );
    pushAudit(`Reassigned to ${department}`, target.title, department);
  };

  const handleAdminSaveNote = (
    id: string,
    adminNote: string,
    assignedTo: string,
  ) => {
    const target = suggestions.find((s) => s.id === id);
    if (!target) return;

    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, adminNote, assignedTo } : item,
      ),
    );
    pushAudit(
      'Published official municipal response',
      target.title,
      target.department || DEPARTMENT_BY_CATEGORY[target.category],
    );
    pushNotification({
      title: 'Official response posted',
      message: `Engineering lead ${assignedTo} added an update to "${target.title}".`,
      type: 'status',
      audience: 'citizen',
      relatedProposalId: id,
      category: target.category,
    });
  };

  const handleAdminDeleteProposal = (id: string) => {
    const target = suggestions.find((s) => s.id === id);
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
    if (target) {
      pushAudit(
        'Archived proposal from queue',
        target.title,
        target.department || DEPARTMENT_BY_CATEGORY[target.category],
      );
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleAuthenticate = (user: AuthUser) => {
    setAuthUser(user);
    setView(user.role === 'admin' ? 'admin' : 'citizen');
  };

  const handleSignOut = () => {
    setAuthUser(null);
    setView('city');
  };

  return (
    <>
      {(view === 'login' || view === 'signup') && (
        <AuthPages
          mode={view}
          onSwitchMode={(mode) => setView(mode)}
          onAuthenticate={handleAuthenticate}
          onBackToCity={() => setView('city')}
        />
      )}

      {view === 'citizen' && (
        <CitizenDashboard
          suggestions={suggestions}
          notifications={notifications}
          currentUser={authUser}
          onToggleVote={handleToggleVote}
          onToggleBookmark={handleToggleBookmark}
          onWithdrawProposal={handleWithdrawProposal}
          onOpenSubmitModal={(cat) => handleOpenSubmitModal(cat)}
          onLocateIn3D={handleLocateCategoryIn3D}
          onSwitchRole={(role) => setView(role)}
          onReturnToCity={() => setView('city')}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onSignOut={handleSignOut}
          onOpenAuth={(mode) => setView(mode)}
        />
      )}

      {view === 'admin' && (
        <AdminDashboard
          suggestions={suggestions}
          notifications={notifications}
          auditLogs={auditLogs}
          currentUser={authUser}
          onUpdateStatus={handleAdminUpdateStatus}
          onBulkUpdateStatus={handleAdminBulkUpdateStatus}
          onUpdatePriority={handleAdminUpdatePriority}
          onUpdateDepartment={handleAdminUpdateDepartment}
          onSaveAdminNote={handleAdminSaveNote}
          onDeleteProposal={handleAdminDeleteProposal}
          onLocateIn3D={handleLocateCategoryIn3D}
          onSwitchRole={(role) => setView(role)}
          onReturnToCity={() => setView('city')}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onSignOut={handleSignOut}
          onOpenAuth={(mode) => setView(mode)}
        />
      )}

      {view === 'city' && (
        <div className="min-h-screen bg-[#0e131f] text-[#dee2f3] flex flex-col">
          {/* Top Bar Contract: Brand Wordmark — Nav Links — Auth & Primary Action */}
          <header className="sticky top-0 z-40 h-16 border-b border-[#252a36] bg-[#0e131f]">
            <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-6 px-6">
              <a
                href="#city-explorer"
                className="font-display text-lg font-bold tracking-tight text-[#dee2f3] whitespace-nowrap shrink-0"
              >
                CivicVoice
              </a>

              <nav
                aria-label="Primary Navigation"
                className="hidden md:flex items-center gap-6 text-sm font-medium text-[#b9cacb]"
              >
                <a
                  href="#city-explorer"
                  className="hover:text-[#dee2f3] transition-colors whitespace-nowrap shrink-0"
                >
                  City Twin
                </a>
                <a
                  href="#proposals"
                  className="hover:text-[#dee2f3] transition-colors whitespace-nowrap shrink-0"
                >
                  Proposals
                </a>
                <button
                  type="button"
                  onClick={() => setView('citizen')}
                  className="hover:text-[#65f2b5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Citizen Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setView('admin')}
                  className="hover:text-[#65f2b5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Admin Console
                </button>
              </nav>

              <div className="flex items-center gap-2.5 shrink-0">
                {authUser ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setView(authUser.role === 'admin' ? 'admin' : 'citizen')
                      }
                      className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-1.5 text-xs font-medium text-[#dee2f3] hover:border-[#10B981]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      <span>{authUser.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-md px-2.5 py-2 text-xs font-medium text-[#b9cacb] hover:text-[#dee2f3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="rounded-md px-3 py-2 text-xs font-medium text-[#b9cacb] hover:text-[#dee2f3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('signup')}
                      className="hidden sm:inline-flex rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs font-medium text-[#dee2f3] hover:border-[#10B981]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenSubmitModal()}
                  className="rounded-md bg-[#00dbe9] px-4 py-2 text-xs font-semibold text-[#002022] hover:bg-[#7df4ff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  New Suggestion
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <CityViewport
              selectedCategory={selectedCategory}
              selectedAsset={selectedAsset}
              lightingMode={lightingMode}
              onChangeLighting={setLightingMode}
              onSelectAsset={handleSelectAssetFrom3D}
              onFocusCategory={handleFocusFromDock}
              externalFocusTrigger={focusTrigger}
            />

            <CategoryPanel
              category={selectedCategory}
              selectedAsset={selectedAsset}
              suggestions={suggestions}
              onClose={handleClosePanel}
              onToggleVote={handleToggleVote}
              onAddSuggestionForCategory={(cat, loc) =>
                handleOpenSubmitModal(cat, loc)
              }
            />

            {/* Infrastructure Sectors Directory */}
            <section
              id="sectors"
              aria-label="Infrastructure Sectors"
              className="border-b border-[#252a36] bg-[#090e19]"
            >
              <div className="mx-auto max-w-[1200px] px-6 py-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#dee2f3]">
                      Explore Urban Infrastructure Sectors
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#b9cacb]">
                      Select any category below to focus the 3D miniature city camera or open the Citizen & Admin dashboards.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setView('citizen')}
                      className="rounded-md border border-[#10B981]/40 bg-[#064E3B]/40 px-3 py-1.5 text-xs font-medium text-[#65f2b5] hover:bg-[#065F46]/60 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Open Citizen Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('admin')}
                      className="rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-1.5 text-xs font-medium text-[#dee2f3] hover:border-[#00dbe9]/50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Admin Console
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {CATEGORY_LIST.map((cat) => {
                    const Icon = SECTOR_ICONS[cat.id];
                    const count = suggestions.filter(
                      (s) => s.category === cat.id,
                    ).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleLocateCategoryIn3D(cat.id)}
                        className="group text-left rounded-lg border border-[#252a36] bg-[#171b27] p-4 hover:border-[#00dbe9]/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <Icon
                            className="h-5 w-5"
                            style={{ color: cat.accentHex }}
                          />
                          <span className="font-mono text-xs text-[#849495] tabular-nums">
                            {count} ideas
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-sm font-semibold text-[#dee2f3] group-hover:text-[#00dbe9] transition-colors">
                          {cat.name}
                        </h3>
                        <p className="mt-1 text-xs text-[#b9cacb] leading-relaxed">
                          {cat.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <ProposalsBoard
              suggestions={suggestions}
              onToggleVote={handleToggleVote}
              onLocateCategory={handleLocateCategoryIn3D}
              onOpenSubmitModal={() => handleOpenSubmitModal()}
            />
          </main>

          <footer className="border-t border-[#252a36] bg-[#090e19] py-8">
            <div className="mx-auto max-w-[1200px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#849495]">
              <span>CivicVoice Karnataka · Participatory Urban Infrastructure Platform</span>
              <span>
                Interactive 3D Smart City Model · Citizen Portal · Municipal Admin Console
              </span>
            </div>
          </footer>
        </div>
      )}

      <SuggestionModal
        open={modalOpen}
        defaultCategory={modalDefaultCategory}
        defaultLocation={modalDefaultLocation}
        defaultAuthor={authUser?.name}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateSuggestion}
      />
    </>
  );
}
