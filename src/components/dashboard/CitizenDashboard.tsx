import { useMemo, useState } from 'react';
import {
  ArrowUp,
  Bookmark,
  CheckCircle2,
  Compass,
  FileText,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CATEGORY_LIST,
  CATEGORY_META,
  formatInr,
  formatInrCompact,
} from '../../data/civicData';
import type {
  AuthUser,
  CivicSuggestion,
  DashboardNotification,
  InfrastructureCategoryId,
  ProposalStatus,
} from '../../types/civic';
import {
  DashboardLayout,
  type SidebarNavItem,
} from './DashboardLayout';
import {
  MomentumAreaChart,
  SectorDistributionChart,
} from './DashboardCharts';

interface CitizenDashboardProps {
  suggestions: CivicSuggestion[];
  notifications: DashboardNotification[];
  currentUser?: AuthUser | null;
  onToggleVote: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onWithdrawProposal: (id: string) => void;
  onOpenSubmitModal: (category?: InfrastructureCategoryId) => void;
  onLocateIn3D: (category: InfrastructureCategoryId) => void;
  onSwitchRole: (role: 'citizen' | 'admin') => void;
  onReturnToCity: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onSignOut?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

const STATUS_BADGE: Record<ProposalStatus, { text: string; bg: string; dot: string; animated?: boolean }> = {
  'In Progress': {
    text: 'text-[#065F46]',
    bg: 'bg-[#D1FAE5]',
    dot: 'bg-[#10B981]',
    animated: true,
  },
  Planned: {
    text: 'text-[#075985]',
    bg: 'bg-[#E0F2FE]',
    dot: 'bg-[#0284C7]',
  },
  'Under Review': {
    text: 'text-[#92400E]',
    bg: 'bg-[#FEF3C7]',
    dot: 'bg-[#D97706]',
    animated: true,
  },
  Completed: {
    text: 'text-[#064E3B]',
    bg: 'bg-[#ECFDF5]',
    dot: 'bg-[#059669]',
  },
};

export function CitizenDashboard({
  suggestions,
  notifications,
  currentUser,
  onToggleVote,
  onToggleBookmark,
  onWithdrawProposal,
  onOpenSubmitModal,
  onLocateIn3D,
  onSwitchRole,
  onReturnToCity,
  onMarkAllRead,
  onMarkRead,
  onSignOut,
  onOpenAuth,
}: CitizenDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'mine' | 'saved'>('overview');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | InfrastructureCategoryId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProposalStatus>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  const myProposals = useMemo(
    () => suggestions.filter((s) => s.isMine),
    [suggestions],
  );
  const savedProposals = useMemo(
    () => suggestions.filter((s) => s.isBookmarked),
    [suggestions],
  );
  const votedCount = useMemo(
    () => suggestions.filter((s) => s.hasVoted).length,
    [suggestions],
  );
  const totalVotes = useMemo(
    () => suggestions.reduce((sum, s) => sum + s.votes, 0),
    [suggestions],
  );
  const totalBudgetInr = useMemo(
    () =>
      suggestions.reduce((sum, s) => sum + (s.estimatedBudgetInr || 0), 0),
    [suggestions],
  );
  const activeDeliveryRate = useMemo(() => {
    if (suggestions.length === 0) return 0;
    const active = suggestions.filter(
      (s) => s.status === 'In Progress' || s.status === 'Completed',
    ).length;
    return Math.round((active / suggestions.length) * 100);
  }, [suggestions]);

  const navItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'all', label: 'All Proposals', icon: FileText, badge: suggestions.length },
    { id: 'mine', label: 'My Submissions', icon: Sparkles, badge: myProposals.length },
    { id: 'saved', label: 'Saved & Voted', icon: Bookmark, badge: savedProposals.length },
  ];

  const tabTitles: Record<string, string> = {
    overview: 'Overview',
    all: 'All Proposals',
    mine: 'My Submissions',
    saved: 'Saved & Voted',
  };

  const tableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = suggestions;
    if (activeTab === 'mine') base = myProposals;
    if (activeTab === 'saved') base = savedProposals;

    const filtered = base.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'votes') {
      return [...filtered].sort((a, b) => b.votes - a.votes);
    }
    return filtered;
  }, [
    suggestions,
    myProposals,
    savedProposals,
    activeTab,
    categoryFilter,
    statusFilter,
    search,
    sortBy,
  ]);

  const inspectedProposal = useMemo(
    () => suggestions.find((s) => s.id === inspectedId) ?? null,
    [suggestions, inspectedId],
  );

  return (
    <DashboardLayout
      role="citizen"
      activeTab={activeTab}
      activeTabLabel={tabTitles[activeTab]}
      navItems={navItems}
      onSelectTab={(id) => setActiveTab(id as typeof activeTab)}
      onSwitchRole={onSwitchRole}
      onReturnToCity={onReturnToCity}
      notifications={notifications}
      onMarkAllRead={onMarkAllRead}
      onMarkRead={onMarkRead}
      currentUser={currentUser}
      onSignOut={onSignOut}
      onOpenAuth={onOpenAuth}
      onSelectNotification={(n) => {
        if (n.relatedProposalId) {
          setInspectedId(n.relatedProposalId);
        }
      }}
      primaryAction={
        <button
          type="button"
          onClick={() =>
            onOpenSubmitModal(
              categoryFilter !== 'all' ? categoryFilter : undefined,
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(5,150,105,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#047857] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Proposal</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2920]">
              {activeTab === 'mine'
                ? 'My Civic Submissions'
                : activeTab === 'saved'
                  ? 'Bookmarked & Endorsed Proposals'
                  : 'Citizen Engagement Workspace'}
            </h1>
            <p className="mt-1 text-sm text-[#527064]">
              Track neighborhood infrastructure proposals, endorse priorities, and inspect live delivery status.
            </p>
          </div>
          <button
            type="button"
            onClick={onReturnToCity}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg border border-[#DCE7E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#065F46] shadow-xs hover:border-[#059669]/50 hover:bg-[#ECFDF5] transition-all cursor-pointer"
          >
            <Compass className="h-4 w-4 text-[#059669]" />
            <span>Explore 3D City Twin</span>
          </button>
        </div>

        {/* Subtle 3D-Depth Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                My Submitted Ideas
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#0F2920] tabular-nums">
              {myProposals.length}
            </div>
            <div className="mt-1.5 text-xs text-[#059669] font-medium">
              {myProposals.filter((m) => m.status === 'In Progress').length} currently in progress
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                Votes Endorsed
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <ArrowUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#0F2920] tabular-nums">
              {votedCount}
            </div>
            <div className="mt-1.5 text-xs text-[#527064] tabular-nums">
              Out of {suggestions.length} district proposals
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                Proposed Ward Budget
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#065F46] tabular-nums">
              {formatInrCompact(totalBudgetInr)}
            </div>
            <div className="mt-1.5 text-xs text-[#059669] font-medium tabular-nums">
              {totalVotes.toLocaleString()} community votes backed
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                Active Delivery Rate
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#0F2920] tabular-nums">
              {activeDeliveryRate}%
            </div>
            <div className="mt-1.5 text-xs text-[#527064]">
              In progress or verified complete
            </div>
          </div>
        </div>

        {/* Analytics Charts Row (shown on Overview) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <MomentumAreaChart totalVotes={totalVotes} />
            </div>
            <div className="lg:col-span-5">
              <SectorDistributionChart
                suggestions={suggestions}
                activeCategory={categoryFilter}
                onSelectCategory={(cat) =>
                  setCategoryFilter((prev) => (prev === cat ? 'all' : cat))
                }
              />
            </div>
          </div>
        )}

        {/* Proposals & Submissions Table */}
        <div className="rounded-xl border border-[#DCE7E1] bg-white shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)] overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-[#E5EFE9] px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#FAFDFB]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F2920]">
                {activeTab === 'mine'
                  ? 'Your Submitted Proposals'
                  : activeTab === 'saved'
                    ? 'Bookmarked Proposals'
                    : 'District Infrastructure Proposals'}
              </h2>
              <p className="text-xs text-[#527064]">
                Showing {tableRows.length} proposal{tableRows.length === 1 ? '' : 's'} · Click any row to inspect municipal notes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B877B]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title or street..."
                  className="w-52 sm:w-60 rounded-lg border border-[#DCE7E1] bg-white pl-8 pr-3 py-1.5 text-xs text-[#0F2920] placeholder:text-[#7E988C] focus:border-[#059669] focus:outline-none"
                />
              </div>

              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'all' | InfrastructureCategoryId)
                }
                className="rounded-lg border border-[#DCE7E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none cursor-pointer"
              >
                <option value="all">All Sectors</option>
                {CATEGORY_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | ProposalStatus)
                }
                className="rounded-lg border border-[#DCE7E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                aria-label="Sort proposals"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'votes' | 'recent')}
                className="rounded-lg border border-[#DCE7E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none cursor-pointer"
              >
                <option value="votes">Sort: Most Voted</option>
                <option value="recent">Sort: All Order</option>
              </select>
            </div>
          </div>

          {tableRows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-[#0F2920]">
                No proposals match your current filters
              </p>
              <p className="mt-1 text-xs text-[#527064]">
                Clear search or submit a new proposal for your neighborhood.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                  className="rounded-lg border border-[#DCE7E1] bg-white px-3.5 py-2 text-xs font-medium text-[#0F2920] hover:bg-[#F3F8F5] cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSubmitModal()}
                  className="rounded-lg bg-[#059669] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5EFE9] bg-[#F7FAF8] text-[11px] font-semibold uppercase tracking-wider text-[#527064]">
                    <th className="py-3 pl-5 pr-3">Proposal</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3 text-right">Budget (₹)</th>
                    <th className="py-3 px-3 text-right">Votes</th>
                    <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF5F1] text-xs">
                  {tableRows.map((item) => {
                    const st = STATUS_BADGE[item.status];
                    const cat = CATEGORY_META[item.category];
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setInspectedId(item.id)}
                        className="hover:bg-[#F3FAF6] transition-colors cursor-pointer"
                      >
                        <td className="py-3 pl-5 pr-3 max-w-[340px]">
                          <div className="font-semibold text-[#0F2920] truncate">
                            {item.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#527064] truncate">
                            {item.location} · {item.author} · {item.createdAt}
                            {item.isMine ? ' · Your submission' : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#0F2920] font-medium">
                          {cat.shortLabel}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.bg} ${st.text}`}
                          >
                            <span className="relative flex h-1.5 w-1.5">
                              {st.animated && (
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${st.dot}`}
                                />
                              )}
                              <span
                                className={`relative inline-flex rounded-full h-1.5 w-1.5 ${st.dot}`}
                              />
                            </span>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#527064]">
                          {item.department || 'Karnataka Municipal Ops'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-semibold text-[#065F46] tabular-nums">
                          {formatInr(item.estimatedBudgetInr || 0)}
                        </td>
                        <td
                          className="py-3 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleVote(item.id)}
                            aria-pressed={Boolean(item.hasVoted)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                              item.hasVoted
                                ? 'border-[#059669] bg-[#ECFDF5] text-[#065F46]'
                                : 'border-[#DCE7E1] bg-white text-[#527064] hover:border-[#059669]/50 hover:text-[#0F2920]'
                            }`}
                          >
                            <ArrowUp className="h-3 w-3" />
                            <span>{item.votes}</span>
                          </button>
                        </td>
                        <td
                          className="py-3 pl-3 pr-5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onToggleBookmark(item.id)}
                              aria-label={
                                item.isBookmarked ? 'Remove bookmark' : 'Bookmark proposal'
                              }
                              className={`rounded-md border p-1.5 transition-colors cursor-pointer ${
                                item.isBookmarked
                                  ? 'border-[#059669]/50 bg-[#ECFDF5] text-[#059669]'
                                  : 'border-[#DCE7E1] bg-white text-[#6B877B] hover:text-[#0F2920]'
                              }`}
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onLocateIn3D(item.category)}
                              title="Locate in 3D Smart City"
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCE7E1] bg-white px-2 py-1 text-[11px] font-medium text-[#065F46] hover:border-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                            >
                              <Compass className="h-3 w-3" />
                              <span>3D</span>
                            </button>

                            {item.isMine && (
                              <button
                                type="button"
                                onClick={() => onWithdrawProposal(item.id)}
                                title="Withdraw my submission"
                                aria-label="Withdraw my submission"
                                className="rounded-md border border-[#DCE7E1] bg-white p-1.5 text-[#6B877B] hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-in Proposal Detail Inspector */}
      {inspectedProposal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
          <div
            className="flex-1"
            onClick={() => setInspectedId(null)}
          />
          <div className="w-full max-w-md bg-white border-l border-[#DCE7E1] shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-[#E5EFE9] px-6 py-4 bg-[#FAFDFB]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#059669]">
                  {CATEGORY_META[inspectedProposal.category].name}
                </div>
                <h3 className="font-display text-base font-bold text-[#0F2920] mt-0.5">
                  Proposal Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedId(null)}
                aria-label="Close proposal details"
                className="rounded-lg border border-[#DCE7E1] bg-white p-1.5 text-[#527064] hover:text-[#0F2920] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${
                      STATUS_BADGE[inspectedProposal.status].bg
                    } ${STATUS_BADGE[inspectedProposal.status].text}`}
                  >
                    {inspectedProposal.status}
                  </span>
                  <span className="text-[#527064]">
                    {inspectedProposal.priority} Priority · {inspectedProposal.createdAt}
                  </span>
                </div>
                <h4 className="mt-3 font-display text-lg font-bold text-[#0F2920] leading-snug">
                  {inspectedProposal.title}
                </h4>
                <p className="mt-2 text-sm text-[#39554A] leading-relaxed">
                  {inspectedProposal.description}
                </p>
              </div>

              <div className="rounded-xl border border-[#DCE7E1] bg-[#F7FAF8] p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#527064]">Location</span>
                  <span className="font-medium text-[#0F2920] flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#059669]" />
                    {inspectedProposal.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#527064]">Department</span>
                  <span className="font-medium text-[#0F2920]">
                    {inspectedProposal.department || 'Municipal Operations'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#527064]">Assigned Lead</span>
                  <span className="font-medium text-[#0F2920]">
                    {inspectedProposal.assignedTo || 'Pending assignment'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#527064]">Estimated Budget</span>
                  <span className="font-mono font-semibold text-[#065F46]">
                    {formatInr(inspectedProposal.estimatedBudgetInr || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#527064]">Submitted By</span>
                  <span className="font-medium text-[#0F2920]">
                    {inspectedProposal.author}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] p-4">
                <div className="text-xs font-semibold text-[#065F46]">
                  Official Municipal Note
                </div>
                <p className="mt-1.5 text-xs text-[#0F2920] leading-relaxed">
                  {inspectedProposal.adminNote ||
                    'Proposal queued for department engineering review. Updates will appear here and in your notifications.'}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E5EFE9] p-4 bg-[#FAFDFB] flex items-center gap-3">
              <button
                type="button"
                onClick={() => onToggleVote(inspectedProposal.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  inspectedProposal.hasVoted
                    ? 'border-[#059669] bg-[#ECFDF5] text-[#065F46]'
                    : 'border-[#DCE7E1] bg-white text-[#0F2920] hover:bg-[#F3F8F5]'
                }`}
              >
                <ArrowUp className="h-4 w-4" />
                <span>
                  {inspectedProposal.hasVoted ? 'Endorsed' : 'Endorse'} (
                  {inspectedProposal.votes})
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLocateIn3D(inspectedProposal.category);
                  setInspectedId(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#047857] transition-colors cursor-pointer"
              >
                <Compass className="h-4 w-4" />
                <span>Inspect in 3D</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
