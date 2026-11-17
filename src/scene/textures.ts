import * as THREE from 'three';

export interface CityTextures {
  facadeLimestoneMap: THREE.CanvasTexture;
  facadeLimestoneEmissive: THREE.CanvasTexture;
  facadeGlassMap: THREE.CanvasTexture;
  facadeGlassEmissive: THREE.CanvasTexture;
  facadeTerracottaMap: THREE.CanvasTexture;
  facadeTerracottaEmissive: THREE.CanvasTexture;
  asphaltMap: THREE.CanvasTexture;
  asphaltRoughness: THREE.CanvasTexture;
  sidewalkMap: THREE.CanvasTexture;
  parkGrassMap: THREE.CanvasTexture;
  waterNormalMap: THREE.CanvasTexture;
  radialGlowMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  plinthGridMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildFacadePair(
  wallBase: string,
  wallLine: string,
  frameColor: string,
  glassDark: string,
  glassLitWarm: string,
  glassLitCool: string,
  cols: number,
  rows: number,
  seed: number,
  anisotropy: number,
): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const W = 512;
  const H = 512;
  const [albedoCanvas, aCtx] = makeCanvas(W, H);
  const [emissiveCanvas, eCtx] = makeCanvas(W, H);
  const rand = seededRand(seed);

  aCtx.fillStyle = wallBase;
  aCtx.fillRect(0, 0, W, H);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, W, H);

  const cellW = W / cols;
  const cellH = H / rows;

  // Subtle architectural stone / panel courses
  aCtx.strokeStyle = wallLine;
  aCtx.lineWidth = 2;
  for (let r = 0; r <= rows; r++) {
    const y = r * cellH;
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(W, y);
    aCtx.stroke();
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const padX = cellW * 0.16;
      const padY = cellH * 0.17;
      const x = c * cellW + padX;
      const y = r * cellH + padY;
      const w = cellW - padX * 2;
      const h = cellH - padY * 2;

      // Mullion frame
      aCtx.fillStyle = frameColor;
      aCtx.fillRect(x - 3, y - 3, w + 6, h + 6);

      const litRoll = rand();
      const isLit = litRoll > 0.42;
      const isWarm = litRoll > 0.56;

      if (isLit) {
        const litColor = isWarm ? glassLitWarm : glassLitCool;
        aCtx.fillStyle = litColor;
        aCtx.fillRect(x, y, w, h);

        const grad = eCtx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, isWarm ? '#ffdca8' : '#bceeff');
        grad.addColorStop(1, isWarm ? '#c47b35' : '#3a7899');
        eCtx.fillStyle = grad;
        eCtx.fillRect(x, y, w, h);
      } else {
        aCtx.fillStyle = glassDark;
        aCtx.fillRect(x, y, w, h);
        // Subtle sky reflection gradient on unlit window
        aCtx.fillStyle = 'rgba(148, 196, 224, 0.18)';
        aCtx.fillRect(x + 2, y + 2, w - 4, h * 0.45);
      }

      // Center vertical mullion bar
      aCtx.fillStyle = frameColor;
      aCtx.fillRect(x + w * 0.5 - 1.5, y, 3, h);
      eCtx.fillStyle = '#000000';
      eCtx.fillRect(x + w * 0.5 - 1.5, y, 3, h);
    }
  }

  return [
    finalizeTexture(albedoCanvas, anisotropy, true),
    finalizeTexture(emissiveCanvas, anisotropy, true),
  ];
}

export function createCityTextures(maxAnisotropy: number): CityTextures {
  const anisotropy = Math.min(maxAnisotropy, 8);

  const [facadeLimestoneMap, facadeLimestoneEmissive] = buildFacadePair(
    '#d6d1c7',
    '#bdb7ab',
    '#343b46',
    '#1c2a3a',
    '#f6cb87',
    '#a3d8f0',
    6,
    8,
    101,
    anisotropy,
  );

  const [facadeGlassMap, facadeGlassEmissive] = buildFacadePair(
    '#2a3648',
    '#465870',
    '#151c28',
    '#18293d',
    '#ffe0a6',
    '#7de3f7',
    8,
    10,
    202,
    anisotropy,
  );

  const [facadeTerracottaMap, facadeTerracottaEmissive] = buildFacadePair(
    '#b87b62',
    '#9a614a',
    '#2c2726',
    '#1f2833',
    '#fbd08c',
    '#9ad5e6',
    5,
    7,
    303,
    anisotropy,
  );

  // Asphalt texture + roughness
  const [asphaltCanvas, aspCtx] = makeCanvas(256, 256);
  const [aspRoughCanvas, aspRCtx] = makeCanvas(256, 256);
  const randAsp = seededRand(404);
  aspCtx.fillStyle = '#242934';
  aspCtx.fillRect(0, 0, 256, 256);
  aspRCtx.fillStyle = '#c8c8c8';
  aspRCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4800; i++) {
    const x = randAsp() * 256;
    const y = randAsp() * 256;
    const v = Math.floor(28 + randAsp() * 24);
    aspCtx.fillStyle = `rgb(${v},${v + 3},${v + 9})`;
    aspCtx.fillRect(x, y, 2, 2);
    const rv = Math.floor(170 + randAsp() * 60);
    aspRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    aspRCtx.fillRect(x, y, 2, 2);
  }
  const asphaltMap = finalizeTexture(asphaltCanvas, anisotropy, true, 4, 4);
  const asphaltRoughness = finalizeTexture(aspRoughCanvas, anisotropy, false, 4, 4);

  // Sidewalk stone pavers
  const [swCanvas, swCtx] = makeCanvas(256, 256);
  swCtx.fillStyle = '#9aa2ad';
  swCtx.fillRect(0, 0, 256, 256);
  swCtx.strokeStyle = '#7e8691';
  swCtx.lineWidth = 2;
  const tile = 32;
  for (let i = 0; i <= 256; i += tile) {
    swCtx.beginPath();
    swCtx.moveTo(i, 0);
    swCtx.lineTo(i, 256);
    swCtx.stroke();
    swCtx.beginPath();
    swCtx.moveTo(0, i);
    swCtx.lineTo(256, i);
    swCtx.stroke();
  }
  const randSw = seededRand(505);
  for (let y = 0; y < 256; y += tile) {
    for (let x = 0; x < 256; x += tile) {
      const shade = Math.floor(148 + (randSw() - 0.5) * 18);
      swCtx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 9}, 0.28)`;
      swCtx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }
  const sidewalkMap = finalizeTexture(swCanvas, anisotropy, true, 3, 3);

  // Landscaped park grass turf
  const [grassCanvas, gCtx] = makeCanvas(256, 256);
  gCtx.fillStyle = '#4c8c5a';
  gCtx.fillRect(0, 0, 256, 256);
  // Subtle manicured mow stripes
  for (let i = 0; i < 8; i++) {
    gCtx.fillStyle = i % 2 === 0 ? 'rgba(116, 178, 108, 0.14)' : 'rgba(38, 76, 46, 0.12)';
    gCtx.fillRect(i * 32, 0, 32, 256);
  }
  const randG = seededRand(606);
  for (let i = 0; i < 3200; i++) {
    const x = randG() * 256;
    const y = randG() * 256;
    gCtx.fillStyle = randG() > 0.5 ? 'rgba(130, 195, 118, 0.24)' : 'rgba(42, 88, 52, 0.24)';
    gCtx.fillRect(x, y, 2, 2);
  }
  const parkGrassMap = finalizeTexture(grassCanvas, anisotropy, true, 2, 2);

  // Water ripple normal-like bump texture
  const [waterCanvas, wCtx] = makeCanvas(256, 256);
  wCtx.fillStyle = '#8080ff';
  wCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 256; x += 2) {
      const nx = Math.sin((x / 256) * Math.PI * 8 + Math.cos((y / 256) * Math.PI * 6));
      const ny = Math.cos((y / 256) * Math.PI * 8 + Math.sin((x / 256) * Math.PI * 6));
      const r = Math.floor(128 + nx * 24);
      const g = Math.floor(128 + ny * 24);
      wCtx.fillStyle = `rgb(${r},${g},255)`;
      wCtx.fillRect(x, y, 2, 2);
    }
  }
  const waterNormalMap = finalizeTexture(waterCanvas, anisotropy, false, 3, 3);

  // Radial streetlight ground pool glow
  const [glowCanvas, glowCtx] = makeCanvas(128, 128);
  const gGrad = glowCtx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gGrad.addColorStop(0, 'rgba(255, 224, 152, 0.72)');
  gGrad.addColorStop(0.35, 'rgba(255, 205, 118, 0.32)');
  gGrad.addColorStop(0.75, 'rgba(255, 190, 96, 0.08)');
  gGrad.addColorStop(1, 'rgba(255, 190, 96, 0)');
  glowCtx.fillStyle = gGrad;
  glowCtx.fillRect(0, 0, 128, 128);
  const radialGlowMap = finalizeTexture(glowCanvas, anisotropy, true);
  radialGlowMap.wrapS = THREE.ClampToEdgeWrapping;
  radialGlowMap.wrapT = THREE.ClampToEdgeWrapping;

  // Soft radial contact shadow plane
  const [csCanvas, csCtx] = makeCanvas(128, 128);
  const csGrad = csCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
  csGrad.addColorStop(0, 'rgba(5, 8, 16, 0.65)');
  csGrad.addColorStop(0.55, 'rgba(5, 8, 16, 0.28)');
  csGrad.addColorStop(1, 'rgba(5, 8, 16, 0)');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 128, 128);
  const contactShadowMap = finalizeTexture(csCanvas, anisotropy, true);
  contactShadowMap.wrapS = THREE.ClampToEdgeWrapping;
  contactShadowMap.wrapT = THREE.ClampToEdgeWrapping;

  // Architectural plinth grid texture
  const [plinthCanvas, pCtx] = makeCanvas(512, 512);
  pCtx.fillStyle = '#151b28';
  pCtx.fillRect(0, 0, 512, 512);
  pCtx.strokeStyle = 'rgba(0, 219, 233, 0.08)';
  pCtx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    pCtx.beginPath();
    pCtx.moveTo(i, 0);
    pCtx.lineTo(i, 512);
    pCtx.stroke();
    pCtx.beginPath();
    pCtx.moveTo(0, i);
    pCtx.lineTo(512, i);
    pCtx.stroke();
  }
  const plinthGridMap = finalizeTexture(plinthCanvas, anisotropy, true, 6, 6);

  const allTextures = [
    facadeLimestoneMap,
    facadeLimestoneEmissive,
    facadeGlassMap,
    facadeGlassEmissive,
    facadeTerracottaMap,
    facadeTerracottaEmissive,
    asphaltMap,
    asphaltRoughness,
    sidewalkMap,
    parkGrassMap,
    waterNormalMap,
    radialGlowMap,
    contactShadowMap,
    plinthGridMap,
  ];

  return {
    facadeLimestoneMap,
    facadeLimestoneEmissive,
    facadeGlassMap,
    facadeGlassEmissive,
    facadeTerracottaMap,
    facadeTerracottaEmissive,
    asphaltMap,
    asphaltRoughness,
    sidewalkMap,
    parkGrassMap,
    waterNormalMap,
    radialGlowMap,
    contactShadowMap,
    plinthGridMap,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
