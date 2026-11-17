import { useMemo, useState } from 'react';
import { CATEGORY_LIST, CATEGORY_META, MONTHLY_TREND_DATA } from '../../data/civicData';
import type {
  CivicSuggestion,
  InfrastructureCategoryId,
  ProposalStatus,
} from '../../types/civic';

interface MomentumAreaChartProps {
  totalVotes: number;
}

export function MomentumAreaChart({ totalVotes }: MomentumAreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const points = useMemo(() => {
    const data = MONTHLY_TREND_DATA.map((d, i) =>
      i === MONTHLY_TREND_DATA.length - 1
        ? { ...d, votes: Math.max(d.votes, totalVotes) }
        : d,
    );
    const maxVotes = Math.max(...data.map((d) => d.votes), 1600);
    const W = 540;
    const H = 210;
    const padL = 42;
    const padR = 16;
    const padT = 18;
    const padB = 30;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const coords = data.map((d, idx) => {
      const x = padL + (idx / (data.length - 1)) * plotW;
      const y = padT + plotH - (d.votes / maxVotes) * plotH;
      return { ...d, x, y };
    });

    const linePath = coords
      .map((c, idx) => {
        if (idx === 0) return `M ${c.x} ${c.y}`;
        const prev = coords[idx - 1];
        const cx = (prev.x + c.x) / 2;
        return `C ${cx} ${prev.y}, ${cx} ${c.y}, ${c.x} ${c.y}`;
      })
      .join(' ');

    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;

    return { coords, linePath, areaPath, W, H, padL, padT, plotH, maxVotes };
  }, [totalVotes]);

  const activePoint =
    hoverIdx !== null ? points.coords[hoverIdx] : points.coords[points.coords.length - 1];

  return (
    <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-[#0F2920]">
            Civic Engagement Momentum
          </h3>
          <p className="mt-0.5 text-xs text-[#527064]">
            Monthly community endorsements and proposal activity
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-semibold text-[#065F46] tabular-nums">
            {activePoint.votes.toLocaleString()} votes
          </div>
          <div className="text-[11px] text-[#527064] tabular-nums">
            {activePoint.month} · {activePoint.proposals} proposals
          </div>
        </div>
      </div>

      <div className="mt-4 relative">
        <svg
          viewBox={`0 0 ${points.W} ${points.H}`}
          className="w-full h-52 overflow-visible"
          role="img"
          aria-label="Civic Engagement Momentum chart"
        >
          <defs>
            <linearGradient id="emeraldAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = points.padT + points.plotH * (1 - t);
            const labelVal = Math.round(points.maxVotes * t);
            return (
              <g key={t}>
                <line
                  x1={points.padL}
                  y1={y}
                  x2={points.W - 16}
                  y2={y}
                  stroke="#E5EFE9"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={points.padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#6B877B] text-[10px] font-mono"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area & Line */}
          <path d={points.areaPath} fill="url(#emeraldAreaFill)" />
          <path
            d={points.linePath}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Hover Guideline */}
          {hoverIdx !== null && (
            <line
              x1={points.coords[hoverIdx].x}
              y1={points.padT}
              x2={points.coords[hoverIdx].x}
              y2={points.padT + points.plotH}
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Nodes with subtle 3D halo */}
          {points.coords.map((c, idx) => {
            const isHovered = hoverIdx === idx;
            return (
              <g key={c.month}>
                <text
                  x={c.x}
                  y={points.H - 6}
                  textAnchor="middle"
                  className="fill-[#527064] text-[11px] font-medium"
                >
                  {c.month}
                </text>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#059669"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
                <rect
                  x={c.x - 28}
                  y={points.padT}
                  width={56}
                  height={points.plotH + 20}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface SectorDistributionChartProps {
  suggestions: CivicSuggestion[];
  activeCategory?: 'all' | InfrastructureCategoryId;
  onSelectCategory?: (cat: InfrastructureCategoryId) => void;
}

export function SectorDistributionChart({
  suggestions,
  activeCategory,
  onSelectCategory,
}: SectorDistributionChartProps) {
  const rows = useMemo(() => {
    const counts = CATEGORY_LIST.map((cat) => {
      const items = suggestions.filter((s) => s.category === cat.id);
      const votes = items.reduce((sum, s) => sum + s.votes, 0);
      return {
        id: cat.id,
        name: cat.shortLabel,
        count: items.length,
        votes,
      };
    });
    const maxVotes = Math.max(...counts.map((r) => r.votes), 1);
    return { counts, maxVotes };
  }, [suggestions]);

  return (
    <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-[#0F2920]">
            Sector Priorities
          </h3>
          <p className="mt-0.5 text-xs text-[#527064]">
            Votes & proposals across urban systems
          </p>
        </div>
        <span className="text-[11px] font-medium text-[#059669]">
          Click bar to filter
        </span>
      </div>

      <div className="mt-5 space-y-3.5">
        {rows.counts.map((row) => {
          const pct = Math.max(12, Math.round((row.votes / rows.maxVotes) * 100));
          const isSelected = activeCategory === row.id;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelectCategory?.(row.id)}
              className={`w-full text-left group rounded-lg p-1.5 -mx-1.5 transition-colors cursor-pointer ${
                isSelected ? 'bg-[#ECFDF5]' : 'hover:bg-[#F3F8F5]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-[#0F2920] group-hover:text-[#059669] transition-colors">
                  {row.name}
                </span>
                <span className="font-mono text-[11px] text-[#527064] tabular-nums">
                  {row.count} items · {row.votes} votes
                </span>
              </div>
              {/* Subtle 3D beveled emerald bar track */}
              <div className="h-3 w-full rounded-md bg-[#EBF3EE] p-0.5 shadow-inner">
                <div
                  className="h-full rounded-sm transition-all duration-300 shadow-[0_1px_2px_rgba(6,78,59,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]"
                  style={{
                    width: `${pct}%`,
                    background: isSelected
                      ? 'linear-gradient(90deg, #065F46 0%, #059669 100%)'
                      : 'linear-gradient(90deg, #047857 0%, #10B981 100%)',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ResolutionVelocityChart() {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxVal = 48;
  const W = 540;
  const H = 215;
  const padL = 34;
  const padB = 28;
  const padT = 16;
  const plotH = H - padT - padB;
  const groupW = (W - padL - 16) / MONTHLY_TREND_DATA.length;

  return (
    <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-[#0F2920]">
            Intake vs. Resolution Velocity
          </h3>
          <p className="mt-0.5 text-xs text-[#527064]">
            6-month municipal proposal throughput
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#527064]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#A7F3D0] border border-[#6EE7B7]" />
            Incoming
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#065F46]" />
            Resolved
          </span>
        </div>
      </div>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-52 overflow-visible"
          role="img"
          aria-label="Intake vs Resolution Velocity chart"
        >
          {[0, 12, 24, 36, 48].map((val) => {
            const y = padT + plotH - (val / maxVal) * plotH;
            return (
              <g key={val}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - 12}
                  y2={y}
                  stroke="#E5EFE9"
                  strokeDasharray={val === 0 ? undefined : '3 3'}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#6B877B] text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {MONTHLY_TREND_DATA.map((d, idx) => {
            const gx = padL + idx * groupW + groupW / 2;
            const barW = 16;
            const inH = (d.proposals / maxVal) * plotH;
            const resH = (d.resolved / maxVal) * plotH;
            const isHovered = hoverIdx === idx;

            return (
              <g
                key={d.month}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <rect
                    x={gx - 26}
                    y={padT}
                    width={52}
                    height={plotH}
                    rx={6}
                    fill="#ECFDF5"
                  />
                )}
                {/* Incoming bar with subtle 3D right edge */}
                <rect
                  x={gx - barW - 2}
                  y={padT + plotH - inH}
                  width={barW}
                  height={inH}
                  rx={3}
                  fill="#A7F3D0"
                />
                <rect
                  x={gx - 5}
                  y={padT + plotH - inH + 2}
                  width={3}
                  height={Math.max(0, inH - 2)}
                  rx={1}
                  fill="#6EE7B7"
                />

                {/* Resolved bar with subtle 3D highlight */}
                <rect
                  x={gx + 2}
                  y={padT + plotH - resH}
                  width={barW}
                  height={resH}
                  rx={3}
                  fill="#065F46"
                />
                <rect
                  x={gx + 2}
                  y={padT + plotH - resH}
                  width={3}
                  height={resH}
                  rx={1}
                  fill="#059669"
                />

                <text
                  x={gx}
                  y={H - 7}
                  textAnchor="middle"
                  className="fill-[#527064] text-[11px] font-medium"
                >
                  {d.month}
                </text>

                {isHovered && (
                  <g transform={`translate(${gx}, ${padT + 4})`}>
                    <rect
                      x={-36}
                      y={-14}
                      width={72}
                      height={22}
                      rx={4}
                      fill="#0C231B"
                    />
                    <text
                      x={0}
                      y={1}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-mono"
                    >
                      {d.resolved}/{d.proposals} done
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface StatusBreakdownDonutProps {
  suggestions: CivicSuggestion[];
}

const STATUS_STYLE: Record<
  ProposalStatus,
  { color: string; bg: string; label: string }
> = {
  'Under Review': { color: '#D97706', bg: '#FEF3C7', label: 'Under Review' },
  Planned: { color: '#0284C7', bg: '#E0F2FE', label: 'Planned' },
  'In Progress': { color: '#10B981', bg: '#D1FAE5', label: 'In Progress' },
  Completed: { color: '#065F46', bg: '#ECFDF5', label: 'Completed' },
};

export function StatusBreakdownDonut({ suggestions }: StatusBreakdownDonutProps) {
  const [hoveredStatus, setHoveredStatus] = useState<ProposalStatus | null>(null);

  const breakdown = useMemo(() => {
    const statuses: ProposalStatus[] = [
      'In Progress',
      'Planned',
      'Under Review',
      'Completed',
    ];
    const total = Math.max(suggestions.length, 1);
    const r = 54;
    const circ = 2 * Math.PI * r;
    let offset = 0;

    return statuses.map((st) => {
      const count = suggestions.filter((s) => s.status === st).length;
      const frac = count / total;
      const dash = frac * circ;
      const item = {
        status: st,
        count,
        pct: Math.round(frac * 100),
        dash,
        offset,
        circ,
        color: STATUS_STYLE[st].color,
      };
      offset += dash;
      return item;
    });
  }, [suggestions]);

  const centerItem = hoveredStatus
    ? breakdown.find((b) => b.status === hoveredStatus)
    : null;

  return (
    <div className="rounded-xl border border-[#DCE7E1] bg-white p-5 shadow-[0_1px_3px_rgba(12,35,27,0.04),0_10px_24px_-10px_rgba(12,35,27,0.08)]">
      <div>
        <h3 className="font-display text-base font-semibold text-[#0F2920]">
          Workflow Stage Distribution
        </h3>
        <p className="mt-0.5 text-xs text-[#527064]">
          Live proposal pipeline across departments
        </p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke="#EBF3EE"
              strokeWidth="16"
            />
            {breakdown.map((seg) => (
              <circle
                key={seg.status}
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke={seg.color}
                strokeWidth={hoveredStatus === seg.status ? 20 : 16}
                strokeDasharray={`${seg.dash} ${seg.circ}`}
                strokeDashoffset={-seg.offset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredStatus(seg.status)}
                onMouseLeave={() => setHoveredStatus(null)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-bold text-[#0F2920] tabular-nums">
              {centerItem ? centerItem.count : suggestions.length}
            </span>
            <span className="text-[11px] font-medium text-[#527064]">
              {centerItem ? centerItem.status : 'Total'}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {breakdown.map((seg) => (
            <div
              key={seg.status}
              onMouseEnter={() => setHoveredStatus(seg.status)}
              onMouseLeave={() => setHoveredStatus(null)}
              className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-[#F3F8F5] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-medium text-[#0F2920]">{seg.status}</span>
              </div>
              <div className="font-mono text-[#527064] tabular-nums">
                {seg.count} ({seg.pct}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getSectorAccent(category: InfrastructureCategoryId): string {
  return CATEGORY_META[category].accentHex;
}
