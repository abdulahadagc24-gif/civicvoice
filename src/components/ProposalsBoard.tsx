import { useMemo, useState } from 'react';
import { ArrowUp, Compass, Search } from 'lucide-react';
import {
  CATEGORY_LIST,
  CATEGORY_META,
  formatInr,
  formatInrCompact,
} from '../data/civicData';
import type {
  CivicSuggestion,
  InfrastructureCategoryId,
} from '../types/civic';

interface ProposalsBoardProps {
  suggestions: CivicSuggestion[];
  onToggleVote: (id: string) => void;
  onLocateCategory: (category: InfrastructureCategoryId) => void;
  onOpenSubmitModal: () => void;
}

export function ProposalsBoard({
  suggestions,
  onToggleVote,
  onLocateCategory,
  onOpenSubmitModal,
}: ProposalsBoardProps) {
  const [activeCategory, setActiveCategory] = useState<
    'all' | InfrastructureCategoryId
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  const totalVotes = useMemo(
    () => suggestions.reduce((sum, s) => sum + s.votes, 0),
    [suggestions],
  );
  const totalBudgetInr = useMemo(
    () =>
      suggestions.reduce((sum, s) => sum + (s.estimatedBudgetInr || 0), 0),
    [suggestions],
  );
  const implementedCount = useMemo(
    () =>
      suggestions.filter(
        (s) => s.status === 'Completed' || s.status === 'In Progress',
      ).length,
    [suggestions],
  );

  const visibleProposals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = suggestions.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'votes') {
      return [...list].sort((a, b) => b.votes - a.votes);
    }
    return list;
  }, [suggestions, activeCategory, searchQuery, sortBy]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 space-y-16">
      {/* Municipal Impact Summary Strip */}
      <section id="impact" aria-label="Civic Impact Overview">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#252a36] pb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#dee2f3]">
              District Infrastructure Snapshot
            </h2>
            <p className="mt-1.5 text-sm text-[#b9cacb]">
              Live citizen participation metrics synchronized with the 3D smart city model.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSubmitModal}
            className="self-start md:self-auto rounded-md bg-[#00dbe9] px-4 py-2 text-xs font-semibold text-[#002022] hover:bg-[#7df4ff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Submit New Proposal
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#252a36] bg-[#171b27] p-5">
            <div className="text-xs text-[#b9cacb]">Active Proposals</div>
            <div className="mt-2 font-display text-3xl font-bold text-[#dee2f3] tabular-nums">
              {suggestions.length}
            </div>
            <div className="mt-1 text-xs text-[#849495]">Across 5 city sectors</div>
          </div>

          <div className="rounded-lg border border-[#252a36] bg-[#171b27] p-5">
            <div className="text-xs text-[#b9cacb]">Total Citizen Votes</div>
            <div className="mt-2 font-display text-3xl font-bold text-[#00dbe9] tabular-nums">
              {totalVotes.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-[#849495]">Community endorsements</div>
          </div>

          <div className="rounded-lg border border-[#252a36] bg-[#171b27] p-5">
            <div className="text-xs text-[#b9cacb]">Active & Completed</div>
            <div className="mt-2 font-display text-3xl font-bold text-[#65f2b5] tabular-nums">
              {implementedCount}
            </div>
            <div className="mt-1 text-xs text-[#849495]">In delivery pipeline</div>
          </div>

          <div className="rounded-lg border border-[#252a36] bg-[#171b27] p-5">
            <div className="text-xs text-[#b9cacb]">Proposed Budget (INR)</div>
            <div className="mt-2 font-display text-3xl font-bold text-[#dee2f3] tabular-nums">
              {formatInrCompact(totalBudgetInr)}
            </div>
            <div className="mt-1 text-xs text-[#849495]">Across Karnataka wards</div>
          </div>
        </div>
      </section>

      {/* Community Proposals Explorer */}
      <section id="proposals" aria-label="Community Proposals">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#dee2f3]">
              Community Proposals Board
            </h2>
            <p className="mt-1 text-sm text-[#b9cacb]">
              Filter proposals by infrastructure category, vote on priorities, or fly the 3D camera directly to a district.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#849495]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search proposals or streets..."
                className="w-64 rounded-md border border-[#3b494b] bg-[#171b27] pl-9 pr-3 py-2 text-xs text-[#dee2f3] placeholder:text-[#849495] focus:border-[#00dbe9] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-md border border-[#252a36] bg-[#171b27] p-1">
              <button
                type="button"
                onClick={() => setSortBy('votes')}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  sortBy === 'votes'
                    ? 'bg-[#252a36] text-[#dee2f3]'
                    : 'text-[#b9cacb] hover:text-[#dee2f3]'
                }`}
              >
                Most Voted
              </button>
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-[#252a36] text-[#dee2f3]'
                    : 'text-[#b9cacb] hover:text-[#dee2f3]'
                }`}
              >
                All Entries
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 border-b border-[#252a36] pb-4">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#00dbe9] text-[#002022] font-semibold'
                : 'bg-[#171b27] text-[#b9cacb] hover:text-[#dee2f3] border border-[#252a36]'
            }`}
          >
            All Categories ({suggestions.length})
          </button>

          {CATEGORY_LIST.map((cat) => {
            const count = suggestions.filter((s) => s.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#252a36] text-[#dee2f3] border border-[#00dbe9]/60'
                    : 'bg-[#171b27] text-[#b9cacb] hover:text-[#dee2f3] border border-[#252a36]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Proposals Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleProposals.map((item) => {
            const catMeta = CATEGORY_META[item.category];
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-[#252a36] bg-[#171b27] p-5 hover:border-[#3b494b] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#b9cacb]">
                    <span
                      className="font-medium"
                      style={{ color: catMeta.accentHex }}
                    >
                      {catMeta.name}
                    </span>
                    <span className="text-[#849495]">
                      {item.status} · {item.createdAt}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-base font-semibold text-[#dee2f3] leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#b9cacb]">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#849495]">
                    <span className="truncate">{item.location}</span>
                    <span className="shrink-0 font-mono font-semibold text-[#65f2b5]">
                      {formatInr(item.estimatedBudgetInr || 0)}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-[#849495]">
                    Proposed by {item.author}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#252a36] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onLocateCategory(item.category)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00dbe9] hover:text-[#7df4ff] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Locate in 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleVote(item.id)}
                    aria-pressed={Boolean(item.hasVoted)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      item.hasVoted
                        ? 'border-[#00dbe9] bg-[#00dbe9]/15 text-[#dbfcff]'
                        : 'border-[#3b494b] bg-[#0e131f] text-[#b9cacb] hover:border-[#00dbe9]/60 hover:text-[#dee2f3]'
                    }`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span className="font-mono tabular-nums">{item.votes}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {visibleProposals.length === 0 && (
          <div className="mt-6 rounded-lg border border-[#252a36] bg-[#171b27] p-8 text-center">
            <p className="text-sm font-medium text-[#dee2f3]">
              No proposals match "{searchQuery}"
            </p>
            <p className="mt-1 text-xs text-[#b9cacb]">
              Clear your search filter or submit a new civic improvement idea.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
