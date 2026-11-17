import * as THREE from 'three';
import type { CityMaterials } from '../materials';
import { SIDEWALK_TOP_Y } from './buildBaseAndRoads';
import { registerInteractiveObject, type InteractiveAssetMeta } from '../interactiveRegistry';

export interface ParksAnimationController {
  update: (elapsed: number) => void;
}

export function buildParksAndTrees(
  scene: THREE.Scene,
  mats: CityMaterials,
  registry: InteractiveAssetMeta[],
  disposables: THREE.BufferGeometry[],
): ParksAnimationController {
  const group = new THREE.Group();
  group.name = 'ParksAndTrees';
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  // =========================================================================
  // 1. CUBBON CIVIC ECO-PARK (Center Block West Half: x -5.4..-0.2, z -5.4..5.4)
  // =========================================================================
  const centralParkGroup = new THREE.Group();
  centralParkGroup.position.set(-2.8, SIDEWALK_TOP_Y, 0);

  const centralLawn = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.1, 0.06, 10.6)),
    mats.parkGrass,
  );
  centralLawn.position.y = 0.03;
  centralLawn.receiveShadow = true;
  centralParkGroup.add(centralLawn);

  const terraceLawn = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.2, 0.1, 4.4)),
    mats.parkGrass,
  );
  terraceLawn.position.set(-0.3, 0.08, -2.1);
  terraceLawn.receiveShadow = true;
  centralParkGroup.add(terraceLawn);

  const pathNS = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.95, 0.03, 10.2)),
    mats.gravelPath,
  );
  pathNS.position.set(0.35, 0.065, 0);
  pathNS.receiveShadow = true;
  centralParkGroup.add(pathNS);

  const pathEW = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.8, 0.03, 0.9)),
    mats.gravelPath,
  );
  pathEW.position.set(0, 0.065, 0.3);
  pathEW.receiveShadow = true;
  centralParkGroup.add(pathEW);

  // Ornamental Park Pond & Animated Fountain Jet
  const pondRim = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.15, 1.25, 0.14, 24)),
    mats.curbStone,
  );
  pondRim.position.set(-0.9, 0.09, 2.7);
  pondRim.receiveShadow = true;
  centralParkGroup.add(pondRim);

  const pondWater = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.98, 0.98, 0.12, 24)),
    mats.waterSurface,
  );
  pondWater.position.set(-0.9, 0.12, 2.7);
  centralParkGroup.add(pondWater);

  // Fountain nozzle, 12 parabolic water droplets, and 3 expanding concentric ripples
  const fountainNozzle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.08, 0.12, 0.18, 12)),
    mats.darkSteel,
  );
  fountainNozzle.position.set(-0.9, 0.22, 2.7);
  centralParkGroup.add(fountainNozzle);

  const dropletGeo = trackGeo(new THREE.SphereGeometry(0.032, 6, 6));
  const dropletMat = new THREE.MeshStandardMaterial({
    color: 0xbef2ff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
  });
  const droplets: { mesh: THREE.Mesh; angle: number; radius: number; offset: number }[] = [];
  for (let d = 0; d < 12; d++) {
    const drop = new THREE.Mesh(dropletGeo, dropletMat);
    centralParkGroup.add(drop);
    droplets.push({
      mesh: drop,
      angle: (d / 12) * Math.PI * 2,
      radius: 0.22 + (d % 3) * 0.11,
      offset: (d * 0.27) % 1,
    });
  }

  const rippleRingGeo = trackGeo(new THREE.RingGeometry(0.18, 0.22, 24));
  const rippleRings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; offset: number }[] = [];
  for (let r = 0; r < 3; r++) {
    const rMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rMesh = new THREE.Mesh(rippleRingGeo, rMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(-0.9, 0.19, 2.7);
    centralParkGroup.add(rMesh);
    rippleRings.push({ mesh: rMesh, mat: rMat, offset: r / 3 });
  }

  // Sculptural Timber & Steel Pergola Pavilion
  const pergolaGroup = new THREE.Group();
  pergolaGroup.position.set(-0.6, 0.12, -2.2);
  const postGeo = trackGeo(new THREE.BoxGeometry(0.1, 1.05, 0.1));
  for (const px of [-0.95, 0.95]) {
    for (const pz of [-1.25, 1.25]) {
      const post = new THREE.Mesh(postGeo, mats.darkSteel);
      post.position.set(px, 0.525, pz);
      post.castShadow = true;
      pergolaGroup.add(post);
    }
  }
  const beamGeo = trackGeo(new THREE.BoxGeometry(2.2, 0.08, 0.1));
  for (let b = -1.2; b <= 1.21; b += 0.4) {
    const beam = new THREE.Mesh(beamGeo, mats.cedarWood);
    beam.position.set(0, 1.08, b);
    beam.castShadow = true;
    pergolaGroup.add(beam);
  }
  centralParkGroup.add(pergolaGroup);

  group.add(centralParkGroup);

  registerInteractiveObject(
    centralParkGroup,
    {
      category: 'parks',
      assetName: 'Cubbon Civic Eco-Park',
      district: 'Bengaluru Central · Kasturba Rd',
      anchorWorld: new THREE.Vector3(-2.8, 0.9, 0),
      cameraPosition: new THREE.Vector3(-12.5, 11.5, 12.5),
      cameraTarget: new THREE.Vector3(-2.4, 0.5, 0.2),
      highlightMeshes: [centralLawn, terraceLawn],
    },
    registry,
  );

  // =========================================================================
  // 2. JAYANAGAR POCKET PARK (West Center Block North: x -16.6..-9.8, z -5.2..0.6)
  // =========================================================================
  const pocketParkGroup = new THREE.Group();
  pocketParkGroup.position.set(-13.2, SIDEWALK_TOP_Y, -2.3);

  const pocketLawn = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(6.6, 0.06, 5.6)),
    mats.parkGrass,
  );
  pocketLawn.position.y = 0.03;
  pocketLawn.receiveShadow = true;
  pocketParkGroup.add(pocketLawn);

  const pocketPath = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.8, 0.03, 0.85)),
    mats.gravelPath,
  );
  pocketPath.position.set(0, 0.062, 0);
  pocketPath.rotation.y = 0.28;
  pocketPath.receiveShadow = true;
  pocketParkGroup.add(pocketPath);

  const bedFrameGeo = trackGeo(new THREE.BoxGeometry(1.4, 0.14, 0.65));
  const flowerClusterGeo = trackGeo(new THREE.SphereGeometry(0.11, 6, 6));
  for (const [fx, fz, isRed] of [
    [-1.8, -1.6, true],
    [1.8, 1.5, false],
  ] as [number, number, boolean][]) {
    const bed = new THREE.Mesh(bedFrameGeo, mats.curbStone);
    bed.position.set(fx, 0.09, fz);
    bed.castShadow = true;
    pocketParkGroup.add(bed);

    for (let k = -0.45; k <= 0.45; k += 0.3) {
      const fl = new THREE.Mesh(flowerClusterGeo, isRed ? mats.flowerRed : mats.flowerGold);
      fl.position.set(fx + k, 0.2, fz);
      pocketParkGroup.add(fl);
    }
  }

  group.add(pocketParkGroup);

  registerInteractiveObject(
    pocketParkGroup,
    {
      category: 'parks',
      assetName: 'Jayanagar 4th Block Pocket Park',
      district: 'Bengaluru South · Jayanagar',
      anchorWorld: new THREE.Vector3(-13.2, 0.8, -2.3),
      cameraPosition: new THREE.Vector3(-21.5, 11.0, 7.5),
      cameraTarget: new THREE.Vector3(-13.2, 0.4, -2.0),
      highlightMeshes: [pocketLawn],
    },
    registry,
  );

  // =========================================================================
  // 3. COMPOSITE 4-PART PUBLIC BENCHES
  // =========================================================================
  const benchSeatGeo = trackGeo(new THREE.BoxGeometry(0.72, 0.05, 0.26));
  const benchBackGeo = trackGeo(new THREE.BoxGeometry(0.72, 0.22, 0.045));
  const benchLegGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.2, 0.28));
  const benchArmGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.14, 0.24));

  const benchSpecs: { x: number; z: number; rotY: number; park: string }[] = [
    { x: -1.9, z: -3.2, rotY: Math.PI / 2, park: 'Cubbon Civic Eco-Park, Bengaluru' },
    { x: -1.9, z: -1.2, rotY: Math.PI / 2, park: 'Cubbon Civic Eco-Park, Bengaluru' },
    { x: -1.9, z: 1.5, rotY: Math.PI / 2, park: 'Cubbon Civic Eco-Park, Bengaluru' },
    { x: -4.2, z: -0.6, rotY: 0, park: 'Cubbon Civic Eco-Park, Bengaluru' },
    { x: -3.5, z: 3.9, rotY: Math.PI, park: 'Cubbon Civic Eco-Park, Bengaluru' },
    { x: -0.9, z: 4.1, rotY: -Math.PI / 2, park: 'Cubbon Civic Eco-Park, Bengaluru' },
    { x: -14.2, z: -3.0, rotY: 0.28, park: 'Jayanagar 4th Block, Bengaluru' },
    { x: -12.0, z: -1.4, rotY: Math.PI + 0.28, park: 'Jayanagar 4th Block, Bengaluru' },
    { x: -10.5, z: -3.6, rotY: -Math.PI / 2, park: 'Jayanagar 4th Block, Bengaluru' },
    { x: 0.8, z: 4.4, rotY: Math.PI, park: 'MG Road Terrace, Bengaluru' },
    { x: 1.8, z: 4.4, rotY: Math.PI, park: 'MG Road Terrace, Bengaluru' },
    { x: -0.4, z: 11.4, rotY: -Math.PI / 2, park: 'Ulsoor Lake Walk, Bengaluru' },
    { x: -0.4, z: 14.2, rotY: -Math.PI / 2, park: 'Ulsoor Lake Walk, Bengaluru' },
    { x: -10.3, z: -14.4, rotY: -Math.PI / 2, park: 'Kukkarahalli Garden, Mysuru' },
  ];

  benchSpecs.forEach((b, idx) => {
    const bench = new THREE.Group();
    bench.position.set(b.x, SIDEWALK_TOP_Y + 0.06, b.z);
    bench.rotation.y = b.rotY;

    const seat = new THREE.Mesh(benchSeatGeo, mats.cedarWood);
    seat.position.set(0, 0.17, 0);
    seat.castShadow = true;
    bench.add(seat);

    const backrest = new THREE.Mesh(benchBackGeo, mats.cedarWood);
    backrest.position.set(0, 0.3, -0.11);
    backrest.rotation.x = -0.15;
    backrest.castShadow = true;
    bench.add(backrest);

    for (const lx of [-0.28, 0.28]) {
      const leg = new THREE.Mesh(benchLegGeo, mats.darkSteel);
      leg.position.set(lx, 0.1, 0);
      leg.castShadow = true;
      bench.add(leg);

      const arm = new THREE.Mesh(benchArmGeo, mats.darkSteel);
      arm.position.set(lx, 0.25, 0);
      bench.add(arm);
    }

    registerInteractiveObject(
      bench,
      {
        category: 'parks',
        assetName: `Teak Public Bench #${idx + 1}`,
        district: b.park,
        anchorWorld: new THREE.Vector3(b.x, SIDEWALK_TOP_Y + 0.5, b.z),
        cameraPosition: new THREE.Vector3(b.x + 6.5, 6.2, b.z + 6.5),
        cameraTarget: new THREE.Vector3(b.x, 0.35, b.z),
        highlightMeshes: [seat, backrest],
      },
      registry,
    );

    group.add(bench);
  });

  // =========================================================================
  // 4. INSTANCED MULTI-PART TREES & SCULPTED BUSHES (With Subtle Breeze)
  // =========================================================================
  const treeCoords: [number, number, number][] = [
    [-4.8, -4.5, 1.05], [-3.8, -4.6, 0.92], [-1.2, -4.4, 1.1],
    [-4.7, -2.5, 1.15], [-4.8, -0.8, 0.88], [-4.6, 1.4, 1.08],
    [-4.8, 3.6, 0.96], [-4.5, 4.7, 1.12], [-2.5, 4.6, 0.9],
    [-1.1, 1.1, 1.02], [-3.5, 1.2, 0.95], [-1.4, -0.8, 0.85],
    [-4.2, -3.5, 1.0], [-0.8, -3.4, 0.94], [-3.1, -0.5, 1.04],
    [-2.4, 1.8, 0.86], [-0.7, 3.2, 0.92], [-4.0, 2.5, 1.06],
    [-16.0, -4.4, 1.08], [-14.2, -4.5, 0.95], [-11.4, -4.5, 1.02],
    [-16.1, -2.2, 1.12], [-15.8, -0.2, 0.9], [-13.6, -0.4, 0.98],
    [-10.6, -0.4, 1.05], [-12.5, -4.2, 0.88], [-10.4, -2.3, 0.92],
    [-14.9, -1.3, 1.0],
    [-16.0, -10.2, 0.95], [-10.3, -15.9, 1.02], [-15.9, -16.0, 1.08],
    [10.2, -14.2, 0.94], [15.9, -10.4, 1.0], [16.0, -16.0, 1.1],
    [-10.2, 14.8, 0.96], [-16.0, 10.4, 1.04], [-16.0, 16.0, 0.92],
    [10.2, -4.8, 0.9], [10.2, 0.2, 0.95], [16.1, 4.6, 1.05],
    [16.1, -4.6, 1.0], [0.5, 4.7, 0.88], [4.9, 4.8, 0.96],
    [4.9, -4.8, 1.02], [-4.8, 10.4, 0.94], [-4.8, 15.8, 1.04],
    [4.8, 10.4, 0.92], [15.8, 10.4, 0.98], [10.4, 16.0, 0.9],
    [-10.3, 4.8, 0.95],
  ];

  const count = treeCoords.length;
  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.095, 0.65, 7));
  const crownLowGeo = trackGeo(new THREE.IcosahedronGeometry(0.42, 1));
  const crownTopGeo = trackGeo(new THREE.IcosahedronGeometry(0.32, 1));

  const trunkInst = new THREE.InstancedMesh(trunkGeo, mats.treeTrunk, count);
  const crownLowInst = new THREE.InstancedMesh(crownLowGeo, mats.foliageBase, count);
  const crownTopInst = new THREE.InstancedMesh(crownTopGeo, mats.foliageBase, count);

  trunkInst.castShadow = true;
  crownLowInst.castShadow = true;
  crownLowInst.receiveShadow = true;
  crownTopInst.castShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const foliageHues = [0x3c8a4f, 0x4ca15a, 0x2f7545, 0x58ab5d, 0x42915b];

  const treeBaseTransforms: {
    tx: number;
    tz: number;
    groundY: number;
    s: number;
  }[] = [];

  treeCoords.forEach(([tx, tz, baseScale], i) => {
    const jitter = 0.88 + ((i * 37) % 100) / 360;
    const s = baseScale * jitter;
    const groundY = SIDEWALK_TOP_Y + (Math.abs(tx) < 5.6 && Math.abs(tz) < 5.6 ? 0.05 : 0.01);
    treeBaseTransforms.push({ tx, tz, groundY, s });

    dummy.position.set(tx, groundY + 0.32 * s, tz);
    dummy.rotation.set(0, i * 1.1, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, groundY + 0.78 * s, tz);
    dummy.rotation.set(0.1 * (i % 3), i * 0.9, 0.08);
    dummy.scale.set(s * 1.05, s * 0.92, s);
    dummy.updateMatrix();
    crownLowInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx + 0.08 * s, groundY + 1.08 * s, tz - 0.06 * s);
    dummy.rotation.set(0, i * 1.7, 0);
    dummy.scale.set(s * 0.92, s * 0.95, s * 0.92);
    dummy.updateMatrix();
    crownTopInst.setMatrixAt(i, dummy.matrix);

    const baseHex = foliageHues[i % foliageHues.length];
    color.setHex(baseHex);
    crownLowInst.setColorAt(i, color);
    color.offsetHSL(0.01, 0.03, 0.05);
    crownTopInst.setColorAt(i, color);
  });

  trunkInst.instanceMatrix.needsUpdate = true;
  crownLowInst.instanceMatrix.needsUpdate = true;
  crownTopInst.instanceMatrix.needsUpdate = true;
  if (crownLowInst.instanceColor) crownLowInst.instanceColor.needsUpdate = true;
  if (crownTopInst.instanceColor) crownTopInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownLowInst.computeBoundingSphere();
  crownTopInst.computeBoundingSphere();

  group.add(trunkInst, crownLowInst, crownTopInst);

  // Sculpted Ornamental Bushes
  const bushCoords: [number, number, number][] = [
    [-3.6, -3.5, 1.0], [-3.8, -1.8, 0.85], [-1.4, 3.8, 1.1],
    [-4.3, 0.5, 0.9], [-14.8, -3.7, 1.05], [-11.4, -3.5, 0.92],
    [-12.5, -0.5, 1.0], [1.2, 4.9, 0.85], [4.4, 0.4, 0.9],
    [-0.5, 10.6, 0.95], [-0.5, 15.2, 1.0], [10.4, 15.1, 0.9],
    [-15.1, 10.4, 0.95], [10.4, -10.3, 0.92],
  ];
  const bushGeo = trackGeo(new THREE.DodecahedronGeometry(0.24, 1));
  const bushInst = new THREE.InstancedMesh(bushGeo, mats.foliageBase, bushCoords.length);
  bushInst.castShadow = true;
  bushInst.receiveShadow = true;

  const bushBaseTransforms: { bx: number; bz: number; bs: number }[] = [];
  bushCoords.forEach(([bx, bz, bs], i) => {
    bushBaseTransforms.push({ bx, bz, bs });
    dummy.position.set(bx, SIDEWALK_TOP_Y + 0.16 * bs, bz);
    dummy.rotation.set(0, i * 0.8, 0);
    dummy.scale.set(bs * 1.2, bs * 0.82, bs);
    dummy.updateMatrix();
    bushInst.setMatrixAt(i, dummy.matrix);
    color.setHex(i % 2 === 0 ? 0x3b844c : 0x4c9a58);
    bushInst.setColorAt(i, color);
  });
  bushInst.instanceMatrix.needsUpdate = true;
  if (bushInst.instanceColor) bushInst.instanceColor.needsUpdate = true;
  bushInst.computeBoundingSphere();
  group.add(bushInst);

  scene.add(group);

  return {
    update: (elapsed: number) => {
      // 1. Parabolic fountain water droplets arcing into the pond
      for (let d = 0; d < droplets.length; d++) {
        const drop = droplets[d];
        const t = (elapsed * 0.95 + drop.offset) % 1;
        const r = t * drop.radius;
        const arcY = 0.28 + 4 * 0.42 * t * (1 - t);
        drop.mesh.position.set(
          -0.9 + Math.cos(drop.angle) * r,
          arcY,
          2.7 + Math.sin(drop.angle) * r,
        );
        const dropScale = 0.65 + (1 - Math.abs(t - 0.5) * 2) * 0.55;
        drop.mesh.scale.setScalar(dropScale);
      }

      // 2. Three staggered concentric pond ripples
      for (let r = 0; r < rippleRings.length; r++) {
        const ring = rippleRings[r];
        const phase = (elapsed * 0.55 + ring.offset) % 1;
        const scale = 0.55 + phase * 3.15;
        ring.mesh.scale.set(scale, scale, 1);
        ring.mat.opacity = (1 - phase) * 0.45;
      }

      // 3. Traveling wind gust wave across lower/upper tree canopies
      for (let i = 0; i < count; i++) {
        const t = treeBaseTransforms[i];
        const gust =
          Math.sin(elapsed * 1.55 - t.tx * 0.24 + t.tz * 0.2) +
          0.4 * Math.sin(elapsed * 3.1 + t.tx * 0.42);
        const sway = gust * 0.028;

        dummy.position.set(
          t.tx + sway * 0.45 * t.s,
          t.groundY + 0.78 * t.s,
          t.tz + sway * 0.28 * t.s,
        );
        dummy.rotation.set(0.1 * (i % 3) + sway * 0.4, i * 0.9, 0.08 - sway * 0.45);
        dummy.scale.set(t.s * 1.05, t.s * 0.92, t.s);
        dummy.updateMatrix();
        crownLowInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(
          t.tx + (0.08 + sway) * t.s,
          t.groundY + 1.08 * t.s,
          t.tz - (0.06 - sway * 0.6) * t.s,
        );
        dummy.rotation.set(sway * 0.75, i * 1.7, -sway * 0.85);
        dummy.scale.set(t.s * 0.92, t.s * 0.95, t.s * 0.92);
        dummy.updateMatrix();
        crownTopInst.setMatrixAt(i, dummy.matrix);
      }
      crownLowInst.instanceMatrix.needsUpdate = true;
      crownTopInst.instanceMatrix.needsUpdate = true;

      // 4. Subtle breeze flutter on ornamental bushes
      for (let i = 0; i < bushBaseTransforms.length; i++) {
        const b = bushBaseTransforms[i];
        const bSway =
          Math.sin(elapsed * 1.85 - b.bx * 0.28 + b.bz * 0.24) * 0.04;
        dummy.position.set(b.bx, SIDEWALK_TOP_Y + 0.16 * b.bs, b.bz);
        dummy.rotation.set(bSway * 0.6, i * 0.8, -bSway * 0.7);
        dummy.scale.set(b.bs * 1.2, b.bs * 0.82, b.bs);
        dummy.updateMatrix();
        bushInst.setMatrixAt(i, dummy.matrix);
      }
      bushInst.instanceMatrix.needsUpdate = true;
    },
  };
}
