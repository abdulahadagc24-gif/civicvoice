import * as THREE from 'three';
import type { CityTextures } from './textures';

export interface CityMaterials {
  plinthBase: THREE.MeshStandardMaterial;
  plinthTrim: THREE.MeshStandardMaterial;
  studioFloor: THREE.MeshStandardMaterial;
  asphalt: THREE.MeshStandardMaterial;
  roadMarkingWhite: THREE.MeshStandardMaterial;
  roadMarkingYellow: THREE.MeshStandardMaterial;
  sidewalk: THREE.MeshStandardMaterial;
  curbStone: THREE.MeshStandardMaterial;
  facadeLimestone: THREE.MeshStandardMaterial;
  facadeGlassTower: THREE.MeshStandardMaterial;
  facadeTerracotta: THREE.MeshStandardMaterial;
  concreteWarm: THREE.MeshStandardMaterial;
  concreteDark: THREE.MeshStandardMaterial;
  architecturalGlass: THREE.MeshPhysicalMaterial;
  balconyMetal: THREE.MeshStandardMaterial;
  cedarWood: THREE.MeshStandardMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  brushedAluminum: THREE.MeshStandardMaterial;
  parkGrass: THREE.MeshStandardMaterial;
  gravelPath: THREE.MeshStandardMaterial;
  treeTrunk: THREE.MeshStandardMaterial;
  foliageBase: THREE.MeshStandardMaterial;
  bushFoliage: THREE.MeshStandardMaterial;
  flowerRed: THREE.MeshStandardMaterial;
  flowerGold: THREE.MeshStandardMaterial;
  waterSurface: THREE.MeshPhysicalMaterial;
  pipeBlue: THREE.MeshStandardMaterial;
  pipeTeal: THREE.MeshStandardMaterial;
  streetlampGlow: THREE.MeshStandardMaterial;
  streetlampPool: THREE.MeshBasicMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  wasteBlue: THREE.MeshStandardMaterial;
  wasteGreen: THREE.MeshStandardMaterial;
  wasteCharcoal: THREE.MeshStandardMaterial;
  solarPanel: THREE.MeshPhysicalMaterial;
  carBodyColors: THREE.MeshPhysicalMaterial[];
  busBody: THREE.MeshPhysicalMaterial;
  carGlass: THREE.MeshPhysicalMaterial;
  headlightGlow: THREE.MeshStandardMaterial;
  taillightGlow: THREE.MeshStandardMaterial;
  signalRed: THREE.MeshStandardMaterial;
  signalAmber: THREE.MeshStandardMaterial;
  signalGreen: THREE.MeshStandardMaterial;
  pedestrianSkin: THREE.MeshStandardMaterial;
  pedestrianCoats: THREE.MeshStandardMaterial[];
  dispose: () => void;
}

export function createCityMaterials(textures: CityTextures): CityMaterials {
  const created: THREE.Material[] = [];
  const track = <T extends THREE.Material>(mat: T): T => {
    created.push(mat);
    return mat;
  };

  const plinthBase = track(
    new THREE.MeshStandardMaterial({
      color: 0x161c29,
      roughness: 0.72,
      metalness: 0.18,
    }),
  );

  const plinthTrim = track(
    new THREE.MeshStandardMaterial({
      color: 0x3b485e,
      roughness: 0.34,
      metalness: 0.82,
    }),
  );

  const studioFloor = track(
    new THREE.MeshStandardMaterial({
      map: textures.plinthGridMap,
      color: 0x182030,
      roughness: 0.85,
      metalness: 0.1,
    }),
  );

  const asphalt = track(
    new THREE.MeshStandardMaterial({
      map: textures.asphaltMap,
      roughnessMap: textures.asphaltRoughness,
      roughness: 0.88,
      metalness: 0.04,
    }),
  );

  const roadMarkingWhite = track(
    new THREE.MeshStandardMaterial({
      color: 0xe9edf5,
      roughness: 0.65,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );

  const roadMarkingYellow = track(
    new THREE.MeshStandardMaterial({
      color: 0xf0b43a,
      roughness: 0.65,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );

  const sidewalk = track(
    new THREE.MeshStandardMaterial({
      map: textures.sidewalkMap,
      color: 0xb7c0cc,
      roughness: 0.82,
      metalness: 0.04,
    }),
  );

  const curbStone = track(
    new THREE.MeshStandardMaterial({
      color: 0x808996,
      roughness: 0.76,
      metalness: 0.08,
    }),
  );

  const facadeLimestone = track(
    new THREE.MeshStandardMaterial({
      map: textures.facadeLimestoneMap,
      emissiveMap: textures.facadeLimestoneEmissive,
      emissive: new THREE.Color(0xffdfa8),
      emissiveIntensity: 0.75,
      roughness: 0.62,
      metalness: 0.12,
    }),
  );

  const facadeGlassTower = track(
    new THREE.MeshStandardMaterial({
      map: textures.facadeGlassMap,
      emissiveMap: textures.facadeGlassEmissive,
      emissive: new THREE.Color(0xbce8ff),
      emissiveIntensity: 0.85,
      roughness: 0.24,
      metalness: 0.68,
    }),
  );

  const facadeTerracotta = track(
    new THREE.MeshStandardMaterial({
      map: textures.facadeTerracottaMap,
      emissiveMap: textures.facadeTerracottaEmissive,
      emissive: new THREE.Color(0xffcf88),
      emissiveIntensity: 0.75,
      roughness: 0.72,
      metalness: 0.08,
    }),
  );

  const concreteWarm = track(
    new THREE.MeshStandardMaterial({
      color: 0xd9d4ca,
      roughness: 0.84,
      metalness: 0.04,
    }),
  );

  const concreteDark = track(
    new THREE.MeshStandardMaterial({
      color: 0x4b5362,
      roughness: 0.78,
      metalness: 0.12,
    }),
  );

  const architecturalGlass = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x9bd3eb,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );

  const balconyMetal = track(
    new THREE.MeshStandardMaterial({
      color: 0x2c3442,
      roughness: 0.35,
      metalness: 0.8,
    }),
  );

  const cedarWood = track(
    new THREE.MeshStandardMaterial({
      color: 0xa66e46,
      roughness: 0.78,
      metalness: 0.02,
    }),
  );

  const darkSteel = track(
    new THREE.MeshStandardMaterial({
      color: 0x242b38,
      roughness: 0.42,
      metalness: 0.78,
    }),
  );

  const brushedAluminum = track(
    new THREE.MeshStandardMaterial({
      color: 0xc2cad6,
      roughness: 0.28,
      metalness: 0.88,
    }),
  );

  const parkGrass = track(
    new THREE.MeshStandardMaterial({
      map: textures.parkGrassMap,
      color: 0x62a86f,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );

  const gravelPath = track(
    new THREE.MeshStandardMaterial({
      color: 0xc9bfa9,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );

  const treeTrunk = track(
    new THREE.MeshStandardMaterial({
      color: 0x6e4f3a,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );

  const foliageBase = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff, // tinted via InstancedMesh.setColorAt
      roughness: 0.82,
      metalness: 0.0,
    }),
  );

  const bushFoliage = track(
    new THREE.MeshStandardMaterial({
      color: 0x3f824e,
      roughness: 0.85,
      metalness: 0.0,
    }),
  );

  const flowerRed = track(
    new THREE.MeshStandardMaterial({
      color: 0xe36678,
      roughness: 0.75,
      metalness: 0.0,
    }),
  );

  const flowerGold = track(
    new THREE.MeshStandardMaterial({
      color: 0xf2bf4b,
      roughness: 0.75,
      metalness: 0.0,
    }),
  );

  const waterSurface = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1688a8,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      normalMap: textures.waterNormalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      transparent: true,
      opacity: 0.88,
    }),
  );

  const pipeBlue = track(
    new THREE.MeshStandardMaterial({
      color: 0x2293cc,
      roughness: 0.32,
      metalness: 0.72,
    }),
  );

  const pipeTeal = track(
    new THREE.MeshStandardMaterial({
      color: 0x18b3a8,
      roughness: 0.35,
      metalness: 0.68,
    }),
  );

  const streetlampGlow = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff3d4,
      emissive: new THREE.Color(0xffd27d),
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.0,
    }),
  );

  const streetlampPool = track(
    new THREE.MeshBasicMaterial({
      map: textures.radialGlowMap,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  const contactShadow = track(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );

  const wasteBlue = track(
    new THREE.MeshStandardMaterial({
      color: 0x2574d9,
      roughness: 0.42,
      metalness: 0.22,
    }),
  );

  const wasteGreen = track(
    new THREE.MeshStandardMaterial({
      color: 0x1e9b68,
      roughness: 0.42,
      metalness: 0.22,
    }),
  );

  const wasteCharcoal = track(
    new THREE.MeshStandardMaterial({
      color: 0x3b4252,
      roughness: 0.48,
      metalness: 0.35,
    }),
  );

  const solarPanel = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x14274a,
      roughness: 0.16,
      metalness: 0.65,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    }),
  );

  const carColors = [0xdce3ed, 0x2b6cb0, 0xd97736, 0x2d8a6e, 0x7b889c];
  const carBodyColors = carColors.map((hex) =>
    track(
      new THREE.MeshPhysicalMaterial({
        color: hex,
        roughness: 0.22,
        metalness: 0.55,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08,
      }),
    ),
  );

  const busBody = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x17a298,
      roughness: 0.25,
      metalness: 0.45,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
    }),
  );

  const carGlass = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1b2b3d,
      roughness: 0.06,
      metalness: 0.2,
      clearcoat: 1.0,
    }),
  );

  const headlightGlow = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff8e0,
      emissive: new THREE.Color(0xffeab8),
      emissiveIntensity: 1.8,
      roughness: 0.2,
    }),
  );

  const taillightGlow = track(
    new THREE.MeshStandardMaterial({
      color: 0xff3b3b,
      emissive: new THREE.Color(0xff2828),
      emissiveIntensity: 1.5,
      roughness: 0.25,
    }),
  );

  const signalRed = track(
    new THREE.MeshStandardMaterial({
      color: 0xff3e3e,
      emissive: new THREE.Color(0xff3e3e),
      emissiveIntensity: 1.6,
    }),
  );

  const signalAmber = track(
    new THREE.MeshStandardMaterial({
      color: 0xffb830,
      emissive: new THREE.Color(0xffa818),
      emissiveIntensity: 0.15,
    }),
  );

  const signalGreen = track(
    new THREE.MeshStandardMaterial({
      color: 0x22e388,
      emissive: new THREE.Color(0x22e388),
      emissiveIntensity: 1.6,
    }),
  );

  const pedestrianSkin = track(
    new THREE.MeshStandardMaterial({
      color: 0xe6b89c,
      roughness: 0.8,
      metalness: 0.0,
    }),
  );

  const coatPalette = [0x38598b, 0xc75c5c, 0xd49b38, 0x3b7a62, 0x675b8c, 0xb8c0cc];
  const pedestrianCoats = coatPalette.map((hex) =>
    track(
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.78,
        metalness: 0.04,
      }),
    ),
  );

  return {
    plinthBase,
    plinthTrim,
    studioFloor,
    asphalt,
    roadMarkingWhite,
    roadMarkingYellow,
    sidewalk,
    curbStone,
    facadeLimestone,
    facadeGlassTower,
    facadeTerracotta,
    concreteWarm,
    concreteDark,
    architecturalGlass,
    balconyMetal,
    cedarWood,
    darkSteel,
    brushedAluminum,
    parkGrass,
    gravelPath,
    treeTrunk,
    foliageBase,
    bushFoliage,
    flowerRed,
    flowerGold,
    waterSurface,
    pipeBlue,
    pipeTeal,
    streetlampGlow,
    streetlampPool,
    contactShadow,
    wasteBlue,
    wasteGreen,
    wasteCharcoal,
    solarPanel,
    carBodyColors,
    busBody,
    carGlass,
    headlightGlow,
    taillightGlow,
    signalRed,
    signalAmber,
    signalGreen,
    pedestrianSkin,
    pedestrianCoats,
    dispose: () => {
      created.forEach((m) => m.dispose());
    },
  };
}
