import { useMemo, useState } from 'react';
import {
  ArrowUp,
  Droplets,
  Lightbulb,
  MapPin,
  Plus,
  Route,
  Trash2,
  Trees,
  X,
} from 'lucide-react';
import { CATEGORY_META, formatInr, formatInrCompact } from '../data/civicData';
import type {
  CivicSuggestion,
  InfrastructureCategoryId,
  ProposalStatus,
  SelectedAssetInfo,
} from '../types/civic';

interface CategoryPanelProps {
  category: InfrastructureCategoryId | null;
  selectedAsset: SelectedAssetInfo | null;
  suggestions: CivicSuggestion[];
  onClose: () => void;
  onToggleVote: (id: string) => void;
  onAddSuggestionForCategory: (
    category: InfrastructureCategoryId,
    defaultLocation?: string,
  ) => void;
}

const CATEGORY_ICONS: Record<InfrastructureCategoryId, typeof Lightbulb> = {
  streetlights: Lightbulb,
  roads: Route,
  parks: Trees,
  water: Droplets,
  waste: Trash2,
};

const STATUS_FILTERS: ('All' | ProposalStatus)[] = [
  'All',
  'In Progress',
  'Planned',
  'Under Review',
  'Completed',
];

export function CategoryPanel({
  category,
  selectedAsset,
  suggestions,
  onClose,
  onToggleVote,
  onAddSuggestionForCategory,
}: CategoryPanelProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | ProposalStatus>('All');

  const filteredSuggestions = useMemo(() => {
    if (!category) return [];
    return suggestions
      .filter((s) => s.category === category)
      .filter((s) => (statusFilter === 'All' ? true : s.status === statusFilter))
      .sort((a, b) => b.votes - a.votes);
  }, [category, suggestions, statusFilter]);

  const sectorBudgetInr = useMemo(
    () =>
      filteredSuggestions.reduce(
        (sum, s) => sum + (s.estimatedBudgetInr || 0),
        0,
      ),
    [filteredSuggestions],
  );

  if (!category) return null;

  const meta = CATEGORY_META[category];
  const Icon = CATEGORY_ICONS[category];

  return (
    <aside
      aria-label={`${meta.name} suggestions`}
      className="fixed top-16 right-0 bottom-0 z-30 w-full max-w-[430px] border-l border-[#3b494b] bg-[#0e131f] shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#252a36] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3b494b] bg-[#171b27]"
            >
              <Icon className="h-4 w-4" style={{ color: meta.accentHex }} />
            </div>
            <h2 className="font-display text-lg font-semibold text-[#dee2f3] truncate">
              {meta.name}
            </h2>
          </div>
          <p className="mt-1.5 text-xs text-[#b9cacb]">
            {meta.assetSummary}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close category panel"
          className="rounded-md border border-[#3b494b] bg-[#171b27] p-2 text-[#b9cacb] hover:text-[#dee2f3] hover:border-[#00dbe9]/50 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Selected 3D Asset Context & Description */}
      <div className="border-b border-[#252a36] bg-[#171b27]/60 px-5 py-3.5 space-y-2">
        {selectedAsset && selectedAsset.category === category && (
          <div className="flex items-center gap-2 text-xs text-[#dee2f3]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00dbe9]" />
            <span className="font-medium truncate">
              {selectedAsset.assetName}
            </span>
            <span aria-hidden="true" className="text-[#849495]">·</span>
            <span className="text-[#b9cacb] truncate">{selectedAsset.district}</span>
          </div>
        )}
        <p className="text-xs leading-relaxed text-[#b9cacb]">
          {meta.description}
        </p>
        <p className="text-xs font-medium text-[#65f2b5]">
          {meta.efficiencyMetric} · Sector allocation: {formatInrCompact(sectorBudgetInr)}
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-[#252a36] px-5 py-2.5 flex items-center gap-1 overflow-x-auto">
        {STATUS_FILTERS.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-[#252a36] text-[#dee2f3] border border-[#00dbe9]/50'
                : 'text-[#b9cacb] hover:text-[#dee2f3] hover:bg-[#171b27] border border-transparent'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Scrollable Suggestions List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="rounded-lg border border-[#252a36] bg-[#171b27] p-5 text-center">
            <p className="text-sm font-medium text-[#dee2f3]">
              No matching proposals
            </p>
            <p className="mt-1 text-xs text-[#b9cacb]">
              Try switching status filters or submit a new suggestion for {meta.name}.
            </p>
          </div>
        ) : (
          filteredSuggestions.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-[#252a36] bg-[#171b27] p-4 hover:border-[#3b494b] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#b9cacb]">
                    <span className="font-medium text-[#00dbe9]">{item.status}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.priority} Priority</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.createdAt}</span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-[#dee2f3] leading-snug">
                    {item.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleVote(item.id)}
                  aria-pressed={Boolean(item.hasVoted)}
                  className={`flex flex-col items-center justify-center rounded-md border px-2.5 py-1.5 min-w-[52px] shrink-0 transition-colors cursor-pointer ${
                    item.hasVoted
                      ? 'border-[#00dbe9] bg-[#00dbe9]/15 text-[#dbfcff]'
                      : 'border-[#3b494b] bg-[#0e131f] text-[#b9cacb] hover:border-[#00dbe9]/60 hover:text-[#dee2f3]'
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
                    {item.votes}
                  </span>
                </button>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[#b9cacb]">
                {item.description}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#849495]">
                <span className="truncate">{item.location}</span>
                <span className="shrink-0 font-mono font-semibold text-[#65f2b5]">
                  {formatInr(item.estimatedBudgetInr || 0)} · {item.author}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-[#252a36] bg-[#090e19] px-5 py-3.5">
        <button
          type="button"
          onClick={() =>
            onAddSuggestionForCategory(
              category,
              selectedAsset?.category === category ? selectedAsset.assetName : undefined,
            )
          }
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#00dbe9] px-4 py-2.5 text-xs font-semibold text-[#002022] hover:bg-[#7df4ff] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Suggestion to {meta.shortLabel}</span>
        </button>
      </div>
    </aside>
  );
}
