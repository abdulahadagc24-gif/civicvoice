import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import type {
  HoveredAssetInfo,
  InfrastructureCategoryId,
  LightingMode,
  SelectedAssetInfo,
} from '../types/civic';
import { CATEGORY_META } from '../data/civicData';
import { createCityTextures } from './textures';
import { createCityMaterials } from './materials';
import {
  INTERACTIVE_LAYER,
  type InteractiveAssetMeta,
} from './interactiveRegistry';
import { buildBaseAndRoads } from './builders/buildBaseAndRoads';
import { buildBuildings } from './builders/buildBuildings';
import { buildStreetlights } from './builders/buildStreetlights';
import { buildParksAndTrees } from './builders/buildParksAndTrees';
import { buildInfrastructure } from './builders/buildInfrastructure';
import { buildDynamicActors } from './builders/buildDynamicActors';

export const OVERVIEW_CAMERA_POS = new THREE.Vector3(31, 25.5, 31);
export const OVERVIEW_CAMERA_TARGET = new THREE.Vector3(0, 0.4, 0);

const DUSK_BG = new THREE.Color(0x0b111e);
const DAY_BG = new THREE.Color(0x1b2b42);

export interface TourStepInfo {
  active: boolean;
  stepIndex: number; // 0..4 for categories
  totalSteps: number;
  category: InfrastructureCategoryId | null;
  label: string;
}

const TOUR_SEQUENCE: {
  category: InfrastructureCategoryId;
  label: string;
  camPos: [number, number, number];
  camTarget: [number, number, number];
}[] = [
  {
    category: 'streetlights',
    label: 'BESCOM Smart LEDs · Indiranagar & MG Rd',
    camPos: [13.5, 9.8, 15.5],
    camTarget: [3.2, 1.0, 6.2],
  },
  {
    category: 'roads',
    label: 'Koramangala 80ft Rd & BMTC EV Corridor',
    camPos: [17.0, 12.0, 17.5],
    camTarget: [0.0, 0.4, 7.2],
  },
  {
    category: 'parks',
    label: 'Cubbon Civic Eco-Park & Jayanagar Greens',
    camPos: [-12.5, 10.5, 11.5],
    camTarget: [-2.6, 0.6, 0.0],
  },
  {
    category: 'water',
    label: 'Yelahanka Water Complex & Ulsoor Canal',
    camPos: [11.5, 11.8, -2.0],
    camTarget: [0.2, 1.2, -13.0],
  },
  {
    category: 'waste',
    label: 'Whitefield Swachh Eco-Sorting Hub',
    camPos: [22.0, 10.8, 22.0],
    camTarget: [13.8, 0.8, 13.8],
  },
];

const TOUR_STOP_DURATION_SEC = 4.6;

interface CitySceneCallbacks {
  onHoverAsset: (info: HoveredAssetInfo | null) => void;
  onSelectAsset: (info: SelectedAssetInfo) => void;
  onTourStateChange?: (tour: TourStepInfo) => void;
  onContextLost?: (lost: boolean) => void;
}

export class CitySceneController {
  private container: HTMLElement;
  private callbacks: CitySceneCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer | null = null;
  private gtaoPass: GTAOPass | null = null;
  private envMap: THREE.Texture | null = null;

  private textures: ReturnType<typeof createCityTextures>;
  private materials: ReturnType<typeof createCityMaterials>;
  private disposables: THREE.BufferGeometry[] = [];
  private registry: InteractiveAssetMeta[] = [];

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private streetPointLights: THREE.PointLight[] = [];
  private signalMeshes: { red: THREE.Mesh[]; amber: THREE.Mesh[]; green: THREE.Mesh[] } = {
    red: [],
    amber: [],
    green: [],
  };
  private buildingFans: THREE.Group[] = [];
  private clarifierBridges: THREE.Mesh[] = [];
  private fireflyPoints: THREE.Points | null = null;
  private fireflyMat: THREE.PointsMaterial | null = null;
  private fireflyBasePositions: Float32Array | null = null;
  private parksAnim: ReturnType<typeof buildParksAndTrees>;
  private actors: ReturnType<typeof buildDynamicActors>;

  // Hover & Selection visuals
  private hoverReticle: THREE.Group;
  private selectReticle: THREE.Group;
  private hoverMatOverrides = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private selectMatOverrides = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private clonedHighlightMats: THREE.Material[] = [];
  private hoveredIndex: number | null = null;
  private selectedIndex: number | null = null;

  // Camera glide state
  private cameraAnimating = false;
  private desiredCamPos = OVERVIEW_CAMERA_POS.clone();
  private desiredCamTarget = OVERVIEW_CAMERA_TARGET.clone();

  // Guided Tour state
  private tourActive = false;
  private tourStepIndex = 0;
  private tourStepElapsed = 0;

  // Lighting mode state
  private targetLighting: LightingMode = 'dusk';
  private duskFactor = 1.0; // 1 = dusk, 0 = day

  // Raycasting & pointer tracking
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private pointerDownPos = new THREE.Vector2();
  private lastHoverCheckMs = 0;

  // Loop & lifecycle
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private resizeObserver: ResizeObserver;

  // Pre-allocated scratch math helpers (zero GC inside render loop)
  private _projVec = new THREE.Vector3();
  private _bgColor = new THREE.Color();
  private _hemiSky = new THREE.Color();
  private _hemiGround = new THREE.Color();
  private _keyColor = new THREE.Color();
  private _tourOffset = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: CitySceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = CitySceneController.detectSoftwareGl();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.outline = 'none';
    container.appendChild(canvas);

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = DUSK_BG.clone();
    this.scene.fog = new THREE.FogExp2(DUSK_BG.getHex(), 0.0075);

    // Mandatory studio environment reflection map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 0.85;
    pmremGenerator.dispose();

    // 3. Isometric-style Architectural Camera
    this.camera = new THREE.PerspectiveCamera(26, width / height, 0.5, 220);
    this.camera.position.copy(OVERVIEW_CAMERA_POS);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(OVERVIEW_CAMERA_TARGET);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 68;
    this.controls.minPolarAngle = 0.3;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.14;
    this.controls.panSpeed = 0.75;
    this.controls.rotateSpeed = 0.7;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      // Immediately cancel scripted camera glide / tour if user manually interacts
      this.cameraAnimating = false;
      if (this.tourActive) {
        this.stopTour(false);
      }
    });

    // 5. Three-Point Architectural Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x9ac3f2, 0x202a3f, 0.95);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffe5c2, 2.45);
    this.keyLight.position.set(22, 32, 16);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 4;
    this.keyLight.shadow.camera.far = 90;
    const d = 24;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.025;
    this.keyLight.shadow.radius = 2.5;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x5ec2ff, 0.85);
    this.rimLight.position.set(-22, 16, -24);
    this.scene.add(this.rimLight);

    // 6. Procedural Textures & Materials
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createCityTextures(maxAniso);
    this.materials = createCityMaterials(this.textures);

    // 7. Build Miniature Smart City Geometry
    const roadsResult = buildBaseAndRoads(
      this.scene,
      this.materials,
      this.registry,
      this.disposables,
    );
    this.signalMeshes = roadsResult.signalMeshes;

    const buildingsResult = buildBuildings(
      this.scene,
      this.materials,
      this.disposables,
    );
    this.buildingFans = buildingsResult.fanRotors;

    const lampsResult = buildStreetlights(
      this.scene,
      this.materials,
      this.registry,
      this.disposables,
    );
    this.streetPointLights = lampsResult.pointLights;

    this.parksAnim = buildParksAndTrees(
      this.scene,
      this.materials,
      this.registry,
      this.disposables,
    );

    const infraResult = buildInfrastructure(
      this.scene,
      this.materials,
      this.registry,
      this.disposables,
    );
    this.clarifierBridges = infraResult.clarifierBridges;

    this.actors = buildDynamicActors(
      this.scene,
      this.materials,
      this.registry,
      this.disposables,
    );

    // Subtle dusk fireflies over Cubbon Eco-Park & Ulsoor Canal
    const fireflyCount = 36;
    const basePos = new Float32Array(fireflyCount * 3);
    const livePos = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      const inCanal = i >= 22;
      const cx = inCanal ? -2.5 + ((i * 1.37) % 10) - 5 : -2.8 + ((i * 0.91) % 4.2) - 2.1;
      const cz = inCanal ? 13.1 + ((i * 0.73) % 2.4) - 1.2 : ((i * 1.13) % 8.4) - 4.2;
      const cy = 0.72 + ((i * 0.37) % 0.85);
      basePos[i * 3] = cx;
      basePos[i * 3 + 1] = cy;
      basePos[i * 3 + 2] = cz;
      livePos[i * 3] = cx;
      livePos[i * 3 + 1] = cy;
      livePos[i * 3 + 2] = cz;
    }
    this.fireflyBasePositions = basePos;
    const fireflyGeo = new THREE.BufferGeometry();
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(livePos, 3));
    this.disposables.push(fireflyGeo);
    this.fireflyMat = new THREE.PointsMaterial({
      color: 0xbef264,
      size: 0.14,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.fireflyPoints = new THREE.Points(fireflyGeo, this.fireflyMat);
    this.scene.add(this.fireflyPoints);

    // 8. Hover & Selection Architectural Reticle Rings
    this.hoverReticle = this.createReticleGroup(0x00dbe9, 0.95);
    this.hoverReticle.visible = false;
    this.scene.add(this.hoverReticle);

    this.selectReticle = this.createReticleGroup(0x65f2b5, 1.35);
    this.selectReticle.visible = false;
    this.scene.add(this.selectReticle);

    // 9. Post-Processing Ambient Occlusion (GTAO.OUTPUT.Default composites scene + AO)
    if (!this.isSoftwareGl) {
      try {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const gtaoPass = new GTAOPass(this.scene, this.camera, width, height);
        gtaoPass.output = GTAOPass.OUTPUT.Default;
        gtaoPass.blendIntensity = 0.5;
        gtaoPass.updateGtaoMaterial({
          radius: 0.55,
          distanceExponent: 1.5,
          thickness: 1.0,
          samples: 12,
        });
        this.composer.addPass(gtaoPass);
        this.gtaoPass = gtaoPass;

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        this.renderer.compile(this.scene, this.camera);
      } catch {
        this.composer?.dispose();
        this.composer = null;
        this.gtaoPass = null;
      }
    }

    // 10. Raycasting setup (only layer 1 interactive targets)
    this.raycaster.layers.set(INTERACTIVE_LAYER);

    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    // Ensure initial frame renders cleanly
    this.handleResize();
    this.tick();
  }

  private static detectSoftwareGl(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  }

  private createReticleGroup(hex: number, radius: number): THREE.Group {
    const grp = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(radius * 0.84, radius, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: hex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    this.disposables.push(ringGeo);
    this.clonedHighlightMats.push(ringMat);

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    grp.add(ring);

    const outerGeo = new THREE.RingGeometry(radius * 1.12, radius * 1.18, 4);
    const outerMat = new THREE.MeshBasicMaterial({
      color: hex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    this.disposables.push(outerGeo);
    this.clonedHighlightMats.push(outerMat);

    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.x = -Math.PI / 2;
    outer.rotation.z = Math.PI / 4;
    grp.add(outer);

    return grp;
  }

  public setLightingMode(mode: LightingMode): void {
    this.targetLighting = mode;
  }

  public focusOverview(): void {
    this.stopTour(false);
    this.desiredCamPos.copy(OVERVIEW_CAMERA_POS);
    this.desiredCamTarget.copy(OVERVIEW_CAMERA_TARGET);
    this.cameraAnimating = true;
    this.selectedIndex = null;
    this.selectReticle.visible = false;
    this.clearSelectHighlight();
  }

  public focusCategory(category: InfrastructureCategoryId): void {
    const meta = CATEGORY_META[category];
    this.desiredCamPos.set(...meta.cameraPosition);
    this.desiredCamTarget.set(...meta.cameraTarget);
    this.cameraAnimating = true;
    this.highlightCategoryAssets(category);
  }

  // =========================================================================
  // GUIDED CITY TOUR CONTROLS
  // =========================================================================
  public startTour(): void {
    this.tourActive = true;
    this.tourStepIndex = 0;
    this.tourStepElapsed = 0;
    this.applyTourStep(0);
  }

  public nextTourStep(): void {
    if (!this.tourActive) return;
    const next = this.tourStepIndex + 1;
    if (next >= TOUR_SEQUENCE.length) {
      this.stopTour(true);
    } else {
      this.tourStepIndex = next;
      this.tourStepElapsed = 0;
      this.applyTourStep(next);
    }
  }

  public stopTour(returnToOverview = true): void {
    if (!this.tourActive) return;
    this.tourActive = false;
    this.callbacks.onTourStateChange?.({
      active: false,
      stepIndex: 0,
      totalSteps: TOUR_SEQUENCE.length,
      category: null,
      label: '',
    });
    if (returnToOverview) {
      this.desiredCamPos.copy(OVERVIEW_CAMERA_POS);
      this.desiredCamTarget.copy(OVERVIEW_CAMERA_TARGET);
      this.cameraAnimating = true;
      this.selectedIndex = null;
      this.selectReticle.visible = false;
      this.clearSelectHighlight();
    }
  }

  private applyTourStep(idx: number): void {
    const stop = TOUR_SEQUENCE[idx];
    this.desiredCamPos.set(...stop.camPos);
    this.desiredCamTarget.set(...stop.camTarget);
    this.cameraAnimating = true;
    this.highlightCategoryAssets(stop.category);

    this.callbacks.onTourStateChange?.({
      active: true,
      stepIndex: idx,
      totalSteps: TOUR_SEQUENCE.length,
      category: stop.category,
      label: stop.label,
    });
  }

  private highlightCategoryAssets(category: InfrastructureCategoryId): void {
    this.clearSelectHighlight();
    const matchIdx = this.registry.findIndex((item) => item.category === category);
    if (matchIdx >= 0) {
      this.selectedIndex = matchIdx;
      const item = this.registry[matchIdx];
      this.selectReticle.position.set(item.anchorWorld.x, 0.14, item.anchorWorld.z);
      this.selectReticle.visible = true;
      this.applySelectionHighlight(category);
    }
  }

  private applySelectionHighlight(category: InfrastructureCategoryId): void {
    const tint = new THREE.Color(CATEGORY_META[category].accentHex);
    const matches = this.registry.filter((r) => r.category === category);
    // Highlight up to first 6 representative assets for clean visual emphasis
    matches.slice(0, 6).forEach((asset) => {
      asset.highlightMeshes.forEach((mesh) => {
        if (this.selectMatOverrides.has(mesh)) return;
        this.selectMatOverrides.set(mesh, mesh.material);
        if (!Array.isArray(mesh.material) && 'emissive' in mesh.material) {
          const cloned = mesh.material.clone() as THREE.MeshStandardMaterial;
          cloned.emissive.copy(tint);
          cloned.emissiveIntensity = 0.55;
          this.clonedHighlightMats.push(cloned);
          mesh.material = cloned;
        }
      });
    });
  }

  private clearSelectHighlight(): void {
    this.selectMatOverrides.forEach((origMat, mesh) => {
      mesh.material = origMat;
    });
    this.selectMatOverrides.clear();
  }

  private updatePointerNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handlePointerMove = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastHoverCheckMs < 28) return;
    this.lastHoverCheckMs = now;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);

    let hitIdx: number | null = null;
    for (let i = 0; i < hits.length; i++) {
      const idx = hits[i].object.userData.interactiveIndex;
      if (typeof idx === 'number') {
        hitIdx = idx;
        break;
      }
    }

    if (hitIdx !== this.hoveredIndex) {
      this.clearHoverHighlight();
      this.hoveredIndex = hitIdx;

      if (hitIdx !== null) {
        const asset = this.registry[hitIdx];
        this.applyHoverHighlight(asset);
        this.renderer.domElement.style.cursor = 'pointer';

        this.hoverReticle.position.set(
          asset.anchorWorld.x,
          0.145,
          asset.anchorWorld.z,
        );
        this.hoverReticle.visible = true;
      } else {
        this.renderer.domElement.style.cursor = 'grab';
        this.hoverReticle.visible = false;
        this.callbacks.onHoverAsset(null);
      }
    }

    if (hitIdx !== null) {
      const asset = this.registry[hitIdx];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this._projVec.copy(asset.anchorWorld).project(this.camera);
      const sx = ((this._projVec.x + 1) / 2) * rect.width;
      const sy = ((-this._projVec.y + 1) / 2) * rect.height;

      this.callbacks.onHoverAsset({
        category: asset.category,
        assetName: asset.assetName,
        district: asset.district,
        screenX: sx,
        screenY: sy,
      });
    }
  };

  private handlePointerDown = (e: PointerEvent): void => {
    this.pointerDownPos.set(e.clientX, e.clientY);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const dist = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y,
    );
    if (dist > 6) return;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);

    for (let i = 0; i < hits.length; i++) {
      const idx = hits[i].object.userData.interactiveIndex;
      if (typeof idx === 'number') {
        if (this.tourActive) {
          this.stopTour(false);
        }
        const asset = this.registry[idx];
        this.clearSelectHighlight();
        this.selectedIndex = idx;
        this.selectReticle.position.set(
          asset.anchorWorld.x,
          0.14,
          asset.anchorWorld.z,
        );
        this.selectReticle.visible = true;
        this.applySelectionHighlight(asset.category);

        this.desiredCamPos.copy(asset.cameraPosition);
        this.desiredCamTarget.copy(asset.cameraTarget);
        this.cameraAnimating = true;

        this.callbacks.onSelectAsset({
          category: asset.category,
          assetName: asset.assetName,
          district: asset.district,
        });
        break;
      }
    }
  };

  private handlePointerLeave = (): void => {
    this.clearHoverHighlight();
    this.hoveredIndex = null;
    this.hoverReticle.visible = false;
    this.renderer.domElement.style.cursor = 'grab';
    this.callbacks.onHoverAsset(null);
  };

  private applyHoverHighlight(asset: InteractiveAssetMeta): void {
    const accentHex = CATEGORY_META[asset.category].accentHex;
    const tint = new THREE.Color(accentHex);

    asset.highlightMeshes.forEach((mesh) => {
      if (this.hoverMatOverrides.has(mesh)) return;
      this.hoverMatOverrides.set(mesh, mesh.material);

      if (!Array.isArray(mesh.material) && 'emissive' in mesh.material) {
        const cloned = mesh.material.clone() as THREE.MeshStandardMaterial;
        cloned.emissive.copy(tint);
        cloned.emissiveIntensity = 0.45;
        this.clonedHighlightMats.push(cloned);
        mesh.material = cloned;
      }
    });
  }

  private clearHoverHighlight(): void {
    this.hoverMatOverrides.forEach((origMat, mesh) => {
      mesh.material = origMat;
    });
    this.hoverMatOverrides.clear();
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.callbacks.onContextLost?.(true);
  };

  private handleContextRestored = (): void => {
    this.callbacks.onContextLost?.(false);
    this.tick();
  };

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 320);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.gtaoPass) {
      this.gtaoPass.setSize(width, height);
    }
  }

  private updateLighting(delta: number): void {
    const targetDusk = this.targetLighting === 'dusk' ? 1 : 0;
    this.duskFactor = THREE.MathUtils.damp(this.duskFactor, targetDusk, 4.5, delta);

    this._bgColor.copy(DAY_BG).lerp(DUSK_BG, this.duskFactor);
    (this.scene.background as THREE.Color).copy(this._bgColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this._bgColor);
    }

    this._keyColor.setHex(0xfff4e2).lerp(new THREE.Color(0xffdba8), this.duskFactor);
    this.keyLight.color.copy(this._keyColor);
    this.keyLight.intensity = THREE.MathUtils.lerp(2.9, 2.25, this.duskFactor);

    this._hemiSky.setHex(0xc4e5ff).lerp(new THREE.Color(0x7ea6db), this.duskFactor);
    this._hemiGround.setHex(0x414c5e).lerp(new THREE.Color(0x1b2538), this.duskFactor);
    this.hemiLight.color.copy(this._hemiSky);
    this.hemiLight.groundColor.copy(this._hemiGround);
    this.hemiLight.intensity = THREE.MathUtils.lerp(1.2, 0.92, this.duskFactor);

    this.rimLight.intensity = THREE.MathUtils.lerp(0.55, 0.9, this.duskFactor);
    this.scene.environmentIntensity = THREE.MathUtils.lerp(1.0, 0.82, this.duskFactor);

    const lampStrength = THREE.MathUtils.lerp(0.45, 4.2, this.duskFactor);
    for (let i = 0; i < this.streetPointLights.length; i++) {
      this.streetPointLights[i].intensity = lampStrength;
    }

    const poolOpacity = THREE.MathUtils.lerp(0.08, 0.58, this.duskFactor);
    this.materials.streetlampPool.opacity = poolOpacity;
    this.materials.streetlampGlow.emissiveIntensity = THREE.MathUtils.lerp(
      0.75,
      2.4,
      this.duskFactor,
    );

    const winGlow = THREE.MathUtils.lerp(0.22, 0.92, this.duskFactor);
    this.materials.facadeLimestone.emissiveIntensity = winGlow;
    this.materials.facadeGlassTower.emissiveIntensity = winGlow * 1.1;
    this.materials.facadeTerracotta.emissiveIntensity = winGlow;

    if (this.fireflyMat) {
      this.fireflyMat.opacity = THREE.MathUtils.lerp(0.0, 0.78, this.duskFactor);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;

    // 1. 3-phase Traffic signal cycle (12s loop: Green 4.6s -> Amber 1.1s -> All-Red 0.3s clearance)
    const cycleT = elapsed % 12;
    const nsGreen = cycleT < 4.6;
    const nsAmber = cycleT >= 4.6 && cycleT < 5.7;
    const ewGreen = cycleT >= 6.0 && cycleT < 10.6;
    const ewAmber = cycleT >= 10.6 && cycleT < 11.7;

    for (let i = 0; i < this.signalMeshes.green.length; i++) {
      const mG = this.signalMeshes.green[i].material as THREE.MeshStandardMaterial;
      const mA = this.signalMeshes.amber[i].material as THREE.MeshStandardMaterial;
      const mR = this.signalMeshes.red[i].material as THREE.MeshStandardMaterial;
      const isNsAxis = this.signalMeshes.green[i].userData.axis === 'ns';
      const gActive = isNsAxis ? nsGreen : ewGreen;
      const aActive = isNsAxis ? nsAmber : ewAmber;
      const rActive = !gActive && !aActive;
      mG.emissiveIntensity = gActive ? 2.2 : 0.1;
      mA.emissiveIntensity = aActive ? 2.3 : 0.1;
      mR.emissiveIntensity = rActive ? 2.2 : 0.1;
    }

    // 2. Dynamic actors (vehicles & pedestrians yielding to live traffic signals + headway)
    this.actors.update(delta, elapsed, { nsGreen, nsAmber, ewGreen, ewAmber });

    // 3. Parks fountain droplets & breeze + rotating water clarifiers + rooftop HVAC rotors
    this.parksAnim.update(elapsed);
    for (let i = 0; i < this.clarifierBridges.length; i++) {
      this.clarifierBridges[i].rotation.y = elapsed * (i === 0 ? 0.16 : -0.14);
    }
    for (let i = 0; i < this.buildingFans.length; i++) {
      this.buildingFans[i].rotation.y = elapsed * (4.8 + (i % 3) * 0.9);
    }

    // 4. Subtle water surface shimmer & dusk firefly drift
    this.textures.waterNormalMap.offset.x = (elapsed * 0.03) % 1;
    this.textures.waterNormalMap.offset.y = (elapsed * 0.02) % 1;

    if (this.fireflyPoints && this.fireflyBasePositions && this.duskFactor > 0.05) {
      const posAttr = this.fireflyPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const base = this.fireflyBasePositions;
      for (let i = 0; i < arr.length; i += 3) {
        const seed = i * 0.37;
        arr[i] = base[i] + Math.sin(elapsed * 0.85 + seed) * 0.28;
        arr[i + 1] = base[i + 1] + Math.sin(elapsed * 1.45 + seed * 1.7) * 0.16;
        arr[i + 2] = base[i + 2] + Math.cos(elapsed * 0.78 + seed * 1.3) * 0.28;
      }
      posAttr.needsUpdate = true;
    }

    // 4. Reticle subtle breathing & rotation
    if (this.hoverReticle.visible) {
      this.hoverReticle.rotation.y = elapsed * 0.85;
      const pulse = 1 + Math.sin(elapsed * 4.5) * 0.06;
      this.hoverReticle.scale.set(pulse, 1, pulse);
    }
    if (this.selectReticle.visible) {
      this.selectReticle.rotation.y = -elapsed * 0.55;
      if (this.selectedIndex !== null) {
        const sel = this.registry[this.selectedIndex];
        this.selectReticle.position.x = sel.anchorWorld.x;
        this.selectReticle.position.z = sel.anchorWorld.z;
      }
    }

    // 5. Guided City Tour automated flyover progression
    if (this.tourActive) {
      this.tourStepElapsed += Math.min(delta, 0.1);
      const stop = TOUR_SEQUENCE[this.tourStepIndex];

      // Subtle slow cinematic orbit arc around each stop
      const arcAngle = (this.tourStepElapsed / TOUR_STOP_DURATION_SEC) * 0.35 - 0.175;
      this._tourOffset
        .set(
          stop.camPos[0] - stop.camTarget[0],
          stop.camPos[1] - stop.camTarget[1],
          stop.camPos[2] - stop.camTarget[2],
        )
        .applyAxisAngle(THREE.Object3D.DEFAULT_UP, arcAngle);

      this.desiredCamTarget.set(...stop.camTarget);
      this.desiredCamPos.copy(this.desiredCamTarget).add(this._tourOffset);
      this.cameraAnimating = true;

      if (this.tourStepElapsed >= TOUR_STOP_DURATION_SEC) {
        const nextIdx = this.tourStepIndex + 1;
        if (nextIdx >= TOUR_SEQUENCE.length) {
          this.stopTour(true);
        } else {
          this.tourStepIndex = nextIdx;
          this.tourStepElapsed = 0;
          this.applyTourStep(nextIdx);
        }
      }
    }

    // 6. Smooth camera glide via frame-rate independent damping
    if (this.cameraAnimating) {
      const lambda = this.tourActive ? 2.6 : 4.2;
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        this.desiredCamPos.x,
        lambda,
        delta,
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        this.desiredCamPos.y,
        lambda,
        delta,
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        this.desiredCamPos.z,
        lambda,
        delta,
      );

      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        this.desiredCamTarget.x,
        lambda,
        delta,
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        this.desiredCamTarget.y,
        lambda,
        delta,
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        this.desiredCamTarget.z,
        lambda,
        delta,
      );

      if (
        !this.tourActive &&
        this.camera.position.distanceTo(this.desiredCamPos) < 0.08 &&
        this.controls.target.distanceTo(this.desiredCamTarget) < 0.08
      ) {
        this.cameraAnimating = false;
      }
    }

    // 7. Lighting interpolation & OrbitControls update
    this.updateLighting(delta);
    this.controls.update();

    // 8. Render with safe fallback
    if (this.composer && !this.isSoftwareGl) {
      try {
        this.composer.render();
      } catch {
        this.composer = null;
        this.renderer.render(this.scene, this.camera);
      }
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.clearHoverHighlight();
    this.clearSelectHighlight();
    this.clonedHighlightMats.forEach((m) => m.dispose());
    this.fireflyMat?.dispose();
    this.disposables.forEach((g) => g.dispose());
    this.textures.dispose();
    this.materials.dispose();
    this.envMap?.dispose();
    this.composer?.dispose();
    this.controls.dispose();
    this.renderer.dispose();

    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
