import { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  Download,
  FileCheck2,
  LayoutDashboard,
  MessageSquarePlus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  CATEGORY_LIST,
  CATEGORY_META,
  DEPARTMENT_OPTIONS,
  formatInr,
  formatInrCompact,
} from '../../data/civicData';
import type {
  AuditLogEntry,
  AuthUser,
  CivicSuggestion,
  DashboardNotification,
  InfrastructureCategoryId,
  ProposalPriority,
  ProposalStatus,
} from '../../types/civic';
import {
  DashboardLayout,
  type SidebarNavItem,
} from './DashboardLayout';
import {
  ResolutionVelocityChart,
  SectorDistributionChart,
  StatusBreakdownDonut,
} from './DashboardCharts';

interface AdminDashboardProps {
  suggestions: CivicSuggestion[];
  notifications: DashboardNotification[];
  auditLogs: AuditLogEntry[];
  currentUser?: AuthUser | null;
  onUpdateStatus: (id: string, status: ProposalStatus) => void;
  onBulkUpdateStatus: (ids: string[], status: ProposalStatus) => void;
  onUpdatePriority: (id: string, priority: ProposalPriority) => void;
  onUpdateDepartment: (id: string, department: string) => void;
  onSaveAdminNote: (id: string, note: string, assignedTo: string) => void;
  onDeleteProposal: (id: string) => void;
  onLocateIn3D: (category: InfrastructureCategoryId) => void;
  onSwitchRole: (role: 'citizen' | 'admin') => void;
  onReturnToCity: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onSignOut?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

const STATUS_OPTIONS: ProposalStatus[] = [
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
];

const PRIORITY_BADGE: Record<ProposalPriority, string> = {
  High: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  Medium: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
  Standard: 'bg-[#F3F8F5] text-[#527064] border-[#DCE7E1]',
};

export function AdminDashboard({
  suggestions,
  notifications,
  auditLogs,
  currentUser,
  onUpdateStatus,
  onBulkUpdateStatus,
  onUpdatePriority,
  onUpdateDepartment,
  onSaveAdminNote,
  onDeleteProposal,
  onLocateIn3D,
  onSwitchRole,
  onReturnToCity,
  onMarkAllRead,
  onMarkRead,
  onSignOut,
  onOpenAuth,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'queue' | 'analytics' | 'audit'
  >('overview');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | InfrastructureCategoryId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProposalStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | ProposalPriority>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [draftLead, setDraftLead] = useState('');

  const pendingCount = useMemo(
    () => suggestions.filter((s) => s.status === 'Under Review').length,
    [suggestions],
  );
  const activeCount = useMemo(
    () => suggestions.filter((s) => s.status === 'In Progress').length,
    [suggestions],
  );
  const completedCount = useMemo(
    () => suggestions.filter((s) => s.status === 'Completed').length,
    [suggestions],
  );
  const totalPipelineInr = useMemo(
    () =>
      suggestions.reduce((sum, s) => sum + (s.estimatedBudgetInr || 0), 0),
    [suggestions],
  );
  const avgSlaDays = useMemo(() => {
    const withSla = suggestions.filter((s) => typeof s.slaDays === 'number');
    if (withSla.length === 0) return 6.4;
    const avg =
      withSla.reduce((sum, s) => sum + (s.slaDays ?? 0), 0) / withSla.length;
    return Number(avg.toFixed(1));
  }, [suggestions]);

  const navItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Operations Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Moderation Queue', icon: ClipboardList, badge: pendingCount },
    { id: 'analytics', label: 'District Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit & Citizens', icon: Users, badge: auditLogs.length },
  ];

  const tabTitles: Record<string, string> = {
    overview: 'Operations Overview',
    queue: 'Moderation Queue',
    analytics: 'District Analytics',
    audit: 'Audit & Citizens',
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suggestions.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        (item.department ?? '').toLowerCase().includes(q)
      );
    });
  }, [suggestions, search, categoryFilter, statusFilter, priorityFilter]);

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkStatus = (status: ProposalStatus) => {
    if (selectedIds.length === 0) return;
    onBulkUpdateStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const handleOpenNoteEditor = (item: CivicSuggestion) => {
    setEditingProposalId(item.id);
    setDraftNote(item.adminNote || '');
    setDraftLead(item.assignedTo || 'R. Kulkarni');
  };

  const handleExportCsv = () => {
    const header = [
      'ID',
      'Title',
      'Sector',
      'Status',
      'Priority',
      'Department',
      'Assignee',
      'Location',
      'Author',
      'Estimated Budget (INR)',
      'Votes',
    ];
    const lines = filteredRows.map((r) =>
      [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        CATEGORY_META[r.category].name,
        r.status,
        r.priority,
        r.department || 'Karnataka Municipal Ops',
        r.assignedTo || 'Unassigned',
        `"${r.location.replace(/"/g, '""')}"`,
        `"${r.author.replace(/"/g, '""')}"`,
        r.estimatedBudgetInr || 0,
        r.votes,
      ].join(','),
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civicvoice-proposals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editingProposal = useMemo(
    () => suggestions.find((s) => s.id === editingProposalId) ?? null,
    [suggestions, editingProposalId],
  );

  // Resident contributor summary for Audit & Citizens view
  const residentContributors = useMemo(() => {
    const map = new Map<string, { name: string; count: number; totalVotes: number }>();
    suggestions.forEach((s) => {
      const existing = map.get(s.author) ?? { name: s.author, count: 0, totalVotes: 0 };
      existing.count += 1;
      existing.totalVotes += s.votes;
      map.set(s.author, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalVotes - a.totalVotes);
  }, [suggestions]);

  return (
    <DashboardLayout
      role="admin"
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
          const target = suggestions.find((s) => s.id === n.relatedProposalId);
          if (target) handleOpenNoteEditor(target);
        }
      }}
      primaryAction={
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE7E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#065F46] shadow-xs hover:border-[#059669]/50 hover:bg-[#ECFDF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2920]">
              {tabTitles[activeTab]}
            </h1>
            <p className="mt-1 text-sm text-[#527064]">
              Triage citizen proposals, assign municipal engineering teams, and monitor citywide delivery SLAs.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1.5 text-xs font-medium text-[#065F46]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
            </span>
            <span>Triage SLA Active · {pendingCount} awaiting review</span>
          </div>
        </div>

        {/* Subtle 3D-Depth Admin KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                Pending Triage
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#0F2920] tabular-nums">
              {pendingCount}
            </div>
            <div className="mt-1.5 text-xs text-[#92400E] font-medium">
              Requires department review
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                In-Progress Delivery
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#065F46] tabular-nums">
              {activeCount}
            </div>
            <div className="mt-1.5 text-xs text-[#059669] font-medium">
              Active field execution
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                Verified Completed
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#0F2920] tabular-nums">
              {completedCount}
            </div>
            <div className="mt-1.5 text-xs text-[#527064]">
              94.2% SLA compliance rate
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_2px_4px_rgba(12,35,27,0.04),0_12px_24px_-12px_rgba(12,35,27,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#527064]">
                Pipeline Budget (INR)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-[#0F2920] tabular-nums">
              {formatInrCompact(totalPipelineInr)}
            </div>
            <div className="mt-1.5 text-xs text-[#059669] font-medium tabular-nums">
              Mean Triage Window: {avgSlaDays}d
            </div>
          </div>
        </div>

        {/* Analytics Charts (on Overview and Analytics tabs) */}
        {(activeTab === 'overview' || activeTab === 'analytics') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <ResolutionVelocityChart />
            </div>
            <div className="lg:col-span-5">
              <StatusBreakdownDonut suggestions={suggestions} />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectorDistributionChart
              suggestions={suggestions}
              activeCategory={categoryFilter}
              onSelectCategory={(cat) => {
                setCategoryFilter((prev) => (prev === cat ? 'all' : cat));
                setActiveTab('queue');
              }}
            />
            <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)]">
              <h3 className="font-display text-base font-semibold text-[#0F2920]">
                Department SLA Performance
              </h3>
              <p className="mt-0.5 text-xs text-[#527064]">
                Active workload and average turnaround per municipal unit
              </p>
              <div className="mt-4 divide-y divide-[#EEF5F1] text-xs">
                {DEPARTMENT_OPTIONS.map((dept) => {
                  const deptItems = suggestions.filter((s) => s.department === dept);
                  const openItems = deptItems.filter((s) => s.status !== 'Completed').length;
                  return (
                    <div
                      key={dept}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#0F2920]">{dept}</div>
                        <div className="text-[11px] text-[#527064]">
                          {deptItems.length} assigned proposals
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <span className="font-semibold text-[#065F46]">
                          {openItems} active
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Moderation & Triage Table (Overview & Queue tabs) */}
        {(activeTab === 'overview' || activeTab === 'queue') && (
          <div className="rounded-xl border border-[#DCE7E1] bg-white shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)] overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-[#E5EFE9] px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-[#FAFDFB]">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0F2920]">
                  Proposal Moderation & Triage Queue
                </h2>
                <p className="text-xs text-[#527064]">
                  Inline status, priority, and department controls update live across Citizen Portal and 3D City.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B877B]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search proposal, author, dept..."
                    className="w-52 sm:w-60 rounded-lg border border-[#DCE7E1] bg-white pl-8 pr-3 py-1.5 text-xs text-[#0F2920] placeholder:text-[#7E988C] focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <select
                  aria-label="Admin category filter"
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
                  aria-label="Admin status filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | ProposalStatus)
                  }
                  className="rounded-lg border border-[#DCE7E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Admin priority filter"
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as 'all' | ProposalPriority)
                  }
                  className="rounded-lg border border-[#DCE7E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="border-b border-[#A7F3D0] bg-[#ECFDF5] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#065F46] tabular-nums">
                  {selectedIds.length} proposal{selectedIds.length === 1 ? '' : 's'} selected
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('Planned')}
                    className="rounded-md bg-white border border-[#A7F3D0] px-2.5 py-1 text-xs font-medium text-[#065F46] hover:bg-[#D1FAE5] cursor-pointer"
                  >
                    Approve to Planned
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('In Progress')}
                    className="rounded-md bg-[#059669] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
                  >
                    Move to In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('Completed')}
                    className="rounded-md bg-[#065F46] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#064E3B] cursor-pointer"
                  >
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="rounded-md px-2 py-1 text-xs text-[#527064] hover:text-[#0F2920] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            {filteredRows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold text-[#0F2920]">
                  No proposals match your triage filters
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="mt-3 rounded-lg border border-[#DCE7E1] bg-white px-3.5 py-2 text-xs font-medium text-[#0F2920] hover:bg-[#F3F8F5] cursor-pointer"
                >
                  Reset Triage Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5EFE9] bg-[#F7FAF8] text-[11px] font-semibold uppercase tracking-wider text-[#527064]">
                      <th className="py-3 pl-5 pr-2 w-8">
                        <input
                          type="checkbox"
                          aria-label="Select all proposals"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-[#B7CBC0] accent-[#059669] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Proposal & Author</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3">Workflow Status</th>
                      <th className="py-3 px-3 text-right">Budget (₹)</th>
                      <th className="py-3 px-3 text-right">Votes</th>
                      <th className="py-3 pl-3 pr-5 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF5F1] text-xs">
                    {filteredRows.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F3FAF6] transition-colors"
                      >
                        <td className="py-3 pl-5 pr-2">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.title}`}
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectOne(item.id)}
                            className="h-3.5 w-3.5 rounded border-[#B7CBC0] accent-[#059669] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 max-w-[300px]">
                          <div className="font-semibold text-[#0F2920] truncate">
                            {item.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#527064] truncate">
                            {CATEGORY_META[item.category].shortLabel} · {item.author} · {item.location}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            aria-label={`Department for ${item.title}`}
                            value={item.department || DEPARTMENT_OPTIONS[0]}
                            onChange={(e) =>
                              onUpdateDepartment(item.id, e.target.value)
                            }
                            className="rounded-md border border-[#DCE7E1] bg-white px-2 py-1 text-[11px] font-medium text-[#0F2920] focus:border-[#059669] focus:outline-none cursor-pointer"
                          >
                            {DEPARTMENT_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            aria-label={`Priority for ${item.title}`}
                            value={item.priority}
                            onChange={(e) =>
                              onUpdatePriority(
                                item.id,
                                e.target.value as ProposalPriority,
                              )
                            }
                            className={`rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-none cursor-pointer ${
                              PRIORITY_BADGE[item.priority]
                            }`}
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Standard">Standard</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            aria-label={`Status for ${item.title}`}
                            value={item.status}
                            onChange={(e) =>
                              onUpdateStatus(
                                item.id,
                                e.target.value as ProposalStatus,
                              )
                            }
                            className="rounded-md border border-[#DCE7E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#065F46] focus:border-[#059669] focus:outline-none cursor-pointer"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-semibold text-[#065F46] tabular-nums">
                          {formatInr(item.estimatedBudgetInr || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#0F2920] tabular-nums">
                          {item.votes}
                        </td>
                        <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenNoteEditor(item)}
                              title="Add official response & assign lead"
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCE7E1] bg-white px-2 py-1 text-[11px] font-medium text-[#0F2920] hover:border-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                            >
                              <MessageSquarePlus className="h-3 w-3 text-[#059669]" />
                              <span>Review</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onLocateIn3D(item.category)}
                              title="Inspect in 3D Smart City"
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCE7E1] bg-white px-2 py-1 text-[11px] font-medium text-[#065F46] hover:border-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                            >
                              <Compass className="h-3 w-3" />
                              <span>3D</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProposal(item.id)}
                              title="Archive proposal"
                              aria-label={`Delete ${item.title}`}
                              className="rounded-md border border-[#DCE7E1] bg-white p-1.5 text-[#6B877B] hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Audit Log & Citizen Contributors Tab */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-xl border border-[#DCE7E1] bg-white shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)] overflow-hidden">
              <div className="border-b border-[#E5EFE9] px-5 py-4 bg-[#FAFDFB]">
                <h2 className="font-display text-base font-semibold text-[#0F2920]">
                  Administrator Audit Trail
                </h2>
                <p className="text-xs text-[#527064]">
                  Chronological log of all moderation, priority, and department changes
                </p>
              </div>
              <div className="divide-y divide-[#EEF5F1]">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="px-5 py-3.5 flex items-start justify-between gap-4 text-xs hover:bg-[#F7FAF8]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F2920]">
                        {log.actor} ·{' '}
                        <span className="text-[#059669]">{log.action}</span>
                      </div>
                      <div className="mt-0.5 text-[#527064] truncate">
                        {log.targetTitle}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#7E988C]">
                        {log.department}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[#6B877B] whitespace-nowrap">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[#DCE7E1] bg-white shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)] overflow-hidden">
              <div className="border-b border-[#E5EFE9] px-5 py-4 bg-[#FAFDFB]">
                <h2 className="font-display text-base font-semibold text-[#0F2920]">
                  Active Citizen Contributors
                </h2>
                <p className="text-xs text-[#527064]">
                  Top district submitters ranked by community endorsements
                </p>
              </div>
              <div className="divide-y divide-[#EEF5F1]">
                {residentContributors.map((person) => (
                  <div
                    key={person.name}
                    className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[#F7FAF8]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-bold text-[#065F46]">
                        {person.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#0F2920]">
                          {person.name}
                        </div>
                        <div className="text-[11px] text-[#527064]">
                          {person.count} proposal{person.count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#065F46] tabular-nums">
                      {person.totalVotes} votes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Review & Official Response Modal/Drawer */}
      {editingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#DCE7E1] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5EFE9] px-6 py-4 bg-[#FAFDFB]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#059669]">
                  Municipal Review & Response
                </div>
                <h3 className="font-display text-base font-bold text-[#0F2920] mt-0.5">
                  {editingProposal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProposalId(null)}
                aria-label="Close review modal"
                className="rounded-lg border border-[#DCE7E1] bg-white p-1.5 text-[#527064] hover:text-[#0F2920] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

              <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveAdminNote(editingProposal.id, draftNote.trim(), draftLead.trim() || 'R. Kulkarni');
                setEditingProposalId(null);
              }}
              className="p-6 space-y-4"
            >
              <div className="rounded-lg border border-[#E5EFE9] bg-[#F7FAF8] p-3 text-xs text-[#39554A]">
                {editingProposal.description}
              </div>

              <div>
                <label
                  htmlFor="admin-lead-input"
                  className="block text-xs font-semibold text-[#0F2920] mb-1.5"
                >
                  Assigned Engineering Lead
                </label>
                <input
                  id="admin-lead-input"
                  type="text"
                  value={draftLead}
                  onChange={(e) => setDraftLead(e.target.value)}
                  placeholder="e.g., R. Kulkarni"
                  className="w-full rounded-lg border border-[#DCE7E1] bg-white px-3 py-2 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-note-input"
                  className="block text-xs font-semibold text-[#0F2920] mb-1.5"
                >
                  Official Municipal Response Note (Visible to Citizens)
                </label>
                <textarea
                  id="admin-note-input"
                  rows={3}
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Provide engineering status, procurement timeline, or implementation update..."
                  className="w-full rounded-lg border border-[#DCE7E1] bg-white px-3 py-2 text-xs text-[#0F2920] focus:border-[#059669] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5EFE9]">
                <button
                  type="button"
                  onClick={() => setEditingProposalId(null)}
                  className="rounded-lg border border-[#DCE7E1] bg-white px-4 py-2 text-xs font-medium text-[#527064] hover:text-[#0F2920] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
                >
                  Save Official Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
