import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Droplets,
  Lightbulb,
  Moon,
  Play,
  Route,
  Square,
  Sun,
  Trash2,
  Trees,
} from 'lucide-react';
import { CATEGORY_LIST, CATEGORY_META } from '../data/civicData';
import {
  CitySceneController,
  type TourStepInfo,
} from '../scene/CitySceneController';
import type {
  HoveredAssetInfo,
  InfrastructureCategoryId,
  LightingMode,
  SelectedAssetInfo,
} from '../types/civic';

interface CityViewportProps {
  selectedCategory: InfrastructureCategoryId | null;
  selectedAsset: SelectedAssetInfo | null;
  lightingMode: LightingMode;
  onChangeLighting: (mode: LightingMode) => void;
  onSelectAsset: (asset: SelectedAssetInfo) => void;
  onFocusCategory: (category: InfrastructureCategoryId | null) => void;
  externalFocusTrigger: { category: InfrastructureCategoryId | null; seq: number };
}

const CATEGORY_ICONS: Record<InfrastructureCategoryId, typeof Lightbulb> = {
  streetlights: Lightbulb,
  roads: Route,
  parks: Trees,
  water: Droplets,
  waste: Trash2,
};

const INITIAL_TOUR_STATE: TourStepInfo = {
  active: false,
  stepIndex: 0,
  totalSteps: 5,
  category: null,
  label: '',
};

export function CityViewport({
  selectedCategory,
  lightingMode,
  onChangeLighting,
  onSelectAsset,
  onFocusCategory,
  externalFocusTrigger,
}: CityViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<CitySceneController | null>(null);
  const callbacksRef = useRef({ onSelectAsset });
  callbacksRef.current = { onSelectAsset };

  const [hovered, setHovered] = useState<HoveredAssetInfo | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [tourState, setTourState] = useState<TourStepInfo>(INITIAL_TOUR_STATE);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const controller = new CitySceneController(el, {
      onHoverAsset: (info) => setHovered(info),
      onSelectAsset: (info) => callbacksRef.current.onSelectAsset(info),
      onTourStateChange: (tour) => setTourState(tour),
      onContextLost: (lost) => setContextLost(lost),
    });

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setLightingMode(lightingMode);
  }, [lightingMode]);

  useEffect(() => {
    if (externalFocusTrigger.seq === 0) return;
    if (externalFocusTrigger.category) {
      controllerRef.current?.stopTour(false);
      controllerRef.current?.focusCategory(externalFocusTrigger.category);
    } else {
      controllerRef.current?.focusOverview();
    }
  }, [externalFocusTrigger]);

  const handleDockCategoryClick = (cat: InfrastructureCategoryId | null) => {
    controllerRef.current?.stopTour(false);
    if (cat) {
      controllerRef.current?.focusCategory(cat);
      onFocusCategory(cat);
    } else {
      controllerRef.current?.focusOverview();
      onFocusCategory(null);
    }
  };

  const handleToggleTour = () => {
    if (tourState.active) {
      controllerRef.current?.stopTour(true);
    } else {
      onFocusCategory(null);
      controllerRef.current?.startTour();
    }
  };

  const highlightedCategory = tourState.active
    ? tourState.category
    : selectedCategory;

  return (
    <section
      id="city-explorer"
      aria-label="Interactive Miniature Smart City"
      className="relative w-full h-[calc(100vh-64px)] min-h-[580px] max-h-[900px] overflow-hidden bg-[#0b111e] border-b border-[#252a36]"
    >
      {/* Dedicated isolated WebGL mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Context loss graceful fallback */}
      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0e131f] p-6">
          <div className="max-w-md rounded-lg border border-[#3b494b] bg-[#171b27] p-6 text-center">
            <h2 className="font-display text-lg font-semibold text-[#dee2f3]">
              3D Viewport Paused
            </h2>
            <p className="mt-2 text-sm text-[#b9cacb]">
              Graphics context was suspended by the browser. Reload or switch tabs back to restore the interactive miniature city.
            </p>
          </div>
        </div>
      )}

      {/* Top-Left Compact Title & Guidance */}
      <div className="pointer-events-none absolute top-5 left-5 z-10 max-w-md">
        <div className="pointer-events-auto rounded-lg border border-[#3b494b]/80 bg-[#0e131f]/92 px-4 py-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <h1
              className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#dee2f3]"
              style={{ textWrap: 'balance' }}
            >
              Interactive Smart City Twin
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            Click any streetlight, road, park, water facility, or waste station to inspect community proposals. Drag to orbit and scroll to zoom.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTour}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                tourState.active
                  ? 'bg-[#f5b942] text-[#1a1302] hover:bg-[#ffd06b]'
                  : 'bg-[#10B981] text-[#052016] hover:bg-[#34D399]'
              }`}
            >
              {tourState.active ? (
                <>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop Tour</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Guided City Tour</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Guided City Tour Live Flyover HUD */}
      {tourState.active && tourState.category && (
        <div className="pointer-events-none fixed sm:absolute top-20 sm:top-5 inset-x-0 sm:left-auto sm:right-5 z-20 flex justify-center sm:justify-end px-4 sm:px-0">
          <div className="pointer-events-auto w-full max-w-md rounded-lg border border-[#10B981]/60 bg-[#0e131f]/95 px-4 py-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#65f2b5]">
                  Guided Tour · Stop {tourState.stepIndex + 1} of{' '}
                  {tourState.totalSteps}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {Array.from({ length: tourState.totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tourState.stepIndex
                        ? 'w-4 bg-[#10B981]'
                        : i < tourState.stepIndex
                          ? 'w-1.5 bg-[#059669]'
                          : 'w-1.5 bg-[#252a36]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-1.5 font-display text-sm sm:text-base font-semibold text-[#dee2f3]">
              {tourState.label}
            </div>
            <p className="mt-0.5 text-xs text-[#b9cacb]">
              {CATEGORY_META[tourState.category].tagline}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const cat = tourState.category;
                  controllerRef.current?.stopTour(false);
                  if (cat) onFocusCategory(cat);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-[#00dbe9] px-2.5 py-1.5 text-xs font-semibold text-[#002022] hover:bg-[#7df4ff] transition-colors cursor-pointer"
              >
                <span>Open Suggestions</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => controllerRef.current?.nextTourStep()}
                className="inline-flex items-center gap-1 rounded-md border border-[#3b494b] bg-[#171b27] px-2.5 py-1.5 text-xs font-medium text-[#dee2f3] hover:border-[#00dbe9]/50 transition-colors cursor-pointer"
              >
                <span>
                  {tourState.stepIndex + 1 >= tourState.totalSteps
                    ? 'Finish Tour'
                    : 'Next Stop'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => controllerRef.current?.stopTour(true)}
                className="ml-auto rounded-md px-2 py-1.5 text-xs text-[#b9cacb] hover:text-[#dee2f3] cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen-Space Hover Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75"
          style={{
            left: `${Math.min(Math.max(hovered.screenX, 130), (mountRef.current?.clientWidth ?? 1200) - 130)}px`,
            top: `${Math.max(hovered.screenY, 84)}px`,
          }}
        >
          <div className="rounded-md border border-[#00dbe9]/50 bg-[#090e19]/95 px-3 py-2 shadow-xl">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-xs shrink-0"
                style={{ backgroundColor: CATEGORY_META[hovered.category].accentHex }}
              />
              <span className="text-xs font-semibold text-[#dee2f3] whitespace-nowrap">
                {hovered.assetName}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-[#b9cacb] whitespace-nowrap">
              {CATEGORY_META[hovered.category].name} · Click for suggestions
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center px-3">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto mb-2 inline-flex items-center gap-1.5 rounded-md border border-[#3b494b] bg-[#0e131f]/95 px-3 py-1.5 text-xs font-medium text-[#b9cacb] hover:text-[#dee2f3] hover:border-[#00dbe9]/50 transition-colors cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-[#3b494b] bg-[#0e131f]/95 p-1.5 shadow-2xl max-w-[min(1060px,96vw)]">
            <button
              type="button"
              onClick={() => handleDockCategoryClick(null)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                highlightedCategory === null
                  ? 'bg-[#00dbe9] text-[#002022] font-semibold'
                  : 'text-[#b9cacb] hover:bg-[#1b1f2b] hover:text-[#dee2f3]'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <div className="hidden sm:block h-5 w-px bg-[#252a36]" aria-hidden="true" />

            {CATEGORY_LIST.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id];
              const isActive = highlightedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleDockCategoryClick(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#252a36] text-[#dee2f3] border border-[#00dbe9]/60'
                      : 'text-[#b9cacb] hover:bg-[#1b1f2b] hover:text-[#dee2f3] border border-transparent'
                  }`}
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: cat.accentHex }}
                  />
                  <span>{cat.shortLabel}</span>
                </button>
              );
            })}

            <div className="hidden sm:block h-5 w-px bg-[#252a36]" aria-hidden="true" />

            <button
              type="button"
              onClick={handleToggleTour}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tourState.active
                  ? 'border-[#f5b942] bg-[#f5b942]/15 text-[#ffd06b]'
                  : 'border-[#10B981]/60 bg-[#059669]/20 text-[#65f2b5] hover:bg-[#059669]/35'
              }`}
            >
              {tourState.active ? (
                <>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop Tour</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Guided City Tour</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onChangeLighting(lightingMode === 'dusk' ? 'day' : 'dusk')
              }
              aria-label={`Switch to ${lightingMode === 'dusk' ? 'Daylight' : 'Golden Dusk'} lighting`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs font-medium text-[#dee2f3] hover:border-[#00dbe9]/50 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {lightingMode === 'dusk' ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#f5b942]" />
                  <span>Golden Dusk</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#f5b942]" />
                  <span>Daylight</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
