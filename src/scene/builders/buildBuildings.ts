import * as THREE from 'three';
import type { CityMaterials } from '../materials';
import { SIDEWALK_TOP_Y } from './buildBaseAndRoads';

interface BuildingSpec {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  style: 'limestone' | 'glass' | 'terracotta';
  balconySides: ('N' | 'S' | 'E' | 'W')[];
  hasPenthouse?: boolean;
  hasSolarRoof?: boolean;
  hasCantileverUpper?: boolean;
  hasGreenRoof?: boolean;
  rotationY?: number;
}

export function buildBuildings(
  scene: THREE.Scene,
  mats: CityMaterials,
  disposables: THREE.BufferGeometry[],
): { fanRotors: THREE.Group[] } {
  const group = new THREE.Group();
  group.name = 'ModernBuildings';
  const fanRotors: THREE.Group[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  const specs: BuildingSpec[] = [
    // Center Block East Half: Civic Glass Hall & Terraced Mixed-Use Landmark
    {
      x: 3.0,
      z: -1.8,
      w: 4.2,
      d: 3.4,
      h: 5.8,
      style: 'glass',
      balconySides: ['S', 'W'],
      hasSolarRoof: true,
      hasCantileverUpper: true,
    },
    {
      x: 3.2,
      z: 2.8,
      w: 3.6,
      d: 3.2,
      h: 3.8,
      style: 'limestone',
      balconySides: ['W', 'N'],
      hasGreenRoof: true,
    },

    // North-West Block (-13.2, -13.2): Residential & Commercial Mid-Rises
    {
      x: -14.4,
      z: -14.2,
      w: 3.6,
      d: 3.4,
      h: 4.6,
      style: 'terracotta',
      balconySides: ['E', 'S'],
      hasPenthouse: true,
    },
    {
      x: -11.2,
      z: -11.4,
      w: 2.8,
      d: 2.8,
      h: 3.4,
      style: 'limestone',
      balconySides: ['N', 'W'],
      hasGreenRoof: true,
    },

    // North-East Block (+13.2, -13.2): Innovation & Eco-Office Campus
    {
      x: 13.8,
      z: -13.8,
      w: 4.2,
      d: 3.6,
      h: 6.4,
      style: 'glass',
      balconySides: ['W', 'S'],
      hasSolarRoof: true,
      hasCantileverUpper: true,
    },
    {
      x: 10.9,
      z: -10.8,
      w: 2.4,
      d: 2.2,
      h: 2.6,
      style: 'limestone',
      balconySides: ['E'],
      hasGreenRoof: true,
    },

    // West Center Block (south corner next to Pocket Park): Boutique Corner Studio
    {
      x: -13.6,
      z: 3.2,
      w: 4.2,
      d: 3.4,
      h: 3.2,
      style: 'terracotta',
      balconySides: ['N', 'E'],
      hasGreenRoof: true,
    },

    // East Center Block (+13.2, 0): High-Density Residential Towers
    {
      x: 13.4,
      z: -2.6,
      w: 4.4,
      d: 3.8,
      h: 6.9,
      style: 'limestone',
      balconySides: ['W', 'S', 'E'],
      hasPenthouse: true,
    },
    {
      x: 13.2,
      z: 2.6,
      w: 4.2,
      d: 3.4,
      h: 4.9,
      style: 'terracotta',
      balconySides: ['W', 'N'],
      hasSolarRoof: true,
    },

    // South-West Block (-13.2, +13.2): Mixed-Use Courtyard Buildings
    {
      x: -14.2,
      z: 13.8,
      w: 3.8,
      d: 3.6,
      h: 5.2,
      style: 'limestone',
      balconySides: ['E', 'N'],
      hasSolarRoof: true,
    },
    {
      x: -10.9,
      z: 10.9,
      w: 2.4,
      d: 2.4,
      h: 3.1,
      style: 'glass',
      balconySides: ['S'],
      hasPenthouse: true,
    },

    // South Center Block (east flank next to Civic Canal): Municipal Library & Cultural Center
    {
      x: 3.0,
      z: 13.4,
      w: 4.2,
      d: 4.4,
      h: 2.9,
      style: 'limestone',
      balconySides: ['W', 'N'],
      hasGreenRoof: true,
    },

    // South-East Block (north-west corner behind Eco-Sorting Hub): Residential Lofts
    {
      x: 11.4,
      z: 11.1,
      w: 3.0,
      d: 2.5,
      h: 4.2,
      style: 'terracotta',
      balconySides: ['S', 'E'],
      hasPenthouse: true,
    },
  ];

  specs.forEach((spec) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(spec.x, SIDEWALK_TOP_Y, spec.z);
    if (spec.rotationY) bGroup.rotation.y = spec.rotationY;

    const facadeMat =
      spec.style === 'glass'
        ? mats.facadeGlassTower
        : spec.style === 'terracotta'
          ? mats.facadeTerracotta
          : mats.facadeLimestone;

    const podiumH = 0.72;
    const upperH = spec.h - podiumH;

    // Soft contact shadow plane directly at sidewalk level
    const contactPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(spec.w * 1.28, spec.d * 1.28)),
      mats.contactShadow,
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.008;
    bGroup.add(contactPlane);

    // 1. Ground-floor retail/civic podium with recessed glazing & stone frame
    const podiumCore = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(spec.w - 0.16, podiumH, spec.d - 0.16)),
      mats.architecturalGlass,
    );
    podiumCore.position.y = podiumH / 2;
    bGroup.add(podiumCore);

    const podiumSlabTop = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(spec.w + 0.14, 0.12, spec.d + 0.14)),
      mats.concreteDark,
    );
    podiumSlabTop.position.y = podiumH;
    podiumSlabTop.castShadow = true;
    podiumSlabTop.receiveShadow = true;
    bGroup.add(podiumSlabTop);

    // Corner structural columns for ground floor arcade
    const colGeo = trackGeo(new THREE.BoxGeometry(0.18, podiumH, 0.18));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const col = new THREE.Mesh(colGeo, mats.concreteWarm);
        col.position.set(
          sx * (spec.w / 2 - 0.08),
          podiumH / 2,
          sz * (spec.d / 2 - 0.08),
        );
        col.castShadow = true;
        bGroup.add(col);
      }
    }

    // 2. Main Architectural Tower Body with procedural window facade
    const mainBodyH = spec.hasCantileverUpper ? upperH * 0.68 : upperH;
    const bodyMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(spec.w, mainBodyH, spec.d)),
      facadeMat,
    );
    bodyMesh.position.y = podiumH + mainBodyH / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bGroup.add(bodyMesh);

    // Architectural vertical fin louvers on corners
    const finGeo = trackGeo(new THREE.BoxGeometry(0.08, mainBodyH, 0.14));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const fin = new THREE.Mesh(finGeo, mats.balconyMetal);
        fin.position.set(
          sx * (spec.w / 2 + 0.01),
          podiumH + mainBodyH / 2,
          sz * (spec.d / 2 + 0.01),
        );
        bGroup.add(fin);
      }
    }

    // Optional cantilevered upper volume
    let roofBaseY = podiumH + mainBodyH;
    let roofW = spec.w;
    let roofD = spec.d;
    if (spec.hasCantileverUpper) {
      const upperStepH = upperH * 0.34;
      const stepW = spec.w * 0.86;
      const stepD = spec.d * 0.92;
      const stepMesh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(stepW, upperStepH, stepD)),
        facadeMat,
      );
      stepMesh.position.set(0.18, roofBaseY + upperStepH / 2, 0);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      bGroup.add(stepMesh);
      roofBaseY += upperStepH;
      roofW = stepW;
      roofD = stepD;
    }

    // 3. Protruding 3D Balconies with Glass Balustrades & Planter Boxes
    const storyStep = 0.92;
    const floors = Math.max(2, Math.floor((mainBodyH - 0.5) / storyStep));

    for (let f = 1; f <= floors; f++) {
      const fy = podiumH + f * storyStep - 0.15;
      for (const side of spec.balconySides) {
        const isNS = side === 'N' || side === 'S';
        const span = (isNS ? spec.w : spec.d) * 0.56;
        const depth = 0.36;

        const balGroup = new THREE.Group();
        if (side === 'N') {
          balGroup.position.set(0, fy, -spec.d / 2 - depth / 2);
        } else if (side === 'S') {
          balGroup.position.set(0, fy, spec.d / 2 + depth / 2);
          balGroup.rotation.y = Math.PI;
        } else if (side === 'E') {
          balGroup.position.set(spec.w / 2 + depth / 2, fy, 0);
          balGroup.rotation.y = Math.PI / 2;
        } else {
          balGroup.position.set(-spec.w / 2 - depth / 2, fy, 0);
          balGroup.rotation.y = -Math.PI / 2;
        }

        // Balcony deck slab
        const slab = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(span, 0.06, depth)),
          mats.concreteWarm,
        );
        slab.castShadow = true;
        slab.receiveShadow = true;
        balGroup.add(slab);

        // Glass railing front + sides
        const railFront = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(span, 0.2, 0.03)),
          mats.architecturalGlass,
        );
        railFront.position.set(0, 0.13, -depth / 2 + 0.02);
        balGroup.add(railFront);

        // Top metal handrail
        const handrail = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(span + 0.02, 0.025, 0.04)),
          mats.balconyMetal,
        );
        handrail.position.set(0, 0.24, -depth / 2 + 0.02);
        balGroup.add(handrail);

        // Mini balcony greenery on alternating floors
        if ((f + span) % 2 > 0.5) {
          const planter = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(span * 0.35, 0.1, 0.12)),
            mats.bushFoliage,
          );
          planter.position.set(span * 0.22, 0.08, -0.02);
          balGroup.add(planter);
        }

        bGroup.add(balGroup);
      }
    }

    // 4. Parapet Roof & Rooftop Architectural Details
    const parapetOffset = spec.hasCantileverUpper ? 0.18 : 0;
    const roofParapet = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(roofW + 0.14, 0.14, roofD + 0.14)),
      mats.concreteDark,
    );
    roofParapet.position.set(parapetOffset, roofBaseY + 0.07, 0);
    roofParapet.castShadow = true;
    roofParapet.receiveShadow = true;
    bGroup.add(roofParapet);

    if (spec.hasSolarRoof) {
      for (let i = -1; i <= 1; i += 2) {
        const panel = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(roofW * 0.34, 0.05, roofD * 0.52)),
          mats.solarPanel,
        );
        panel.position.set(parapetOffset + i * (roofW * 0.22), roofBaseY + 0.24, 0);
        panel.rotation.x = 0.22;
        panel.castShadow = true;
        bGroup.add(panel);
      }
    } else if (spec.hasGreenRoof) {
      const turf = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(roofW * 0.78, 0.08, roofD * 0.78)),
        mats.parkGrass,
      );
      turf.position.set(parapetOffset, roofBaseY + 0.16, 0);
      turf.receiveShadow = true;
      bGroup.add(turf);

      const skylight = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(roofW * 0.32, 0.2, roofD * 0.32)),
        mats.architecturalGlass,
      );
      skylight.position.set(parapetOffset, roofBaseY + 0.26, 0);
      bGroup.add(skylight);
    } else if (spec.hasPenthouse) {
      const pent = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(roofW * 0.45, 0.55, roofD * 0.45)),
        mats.concreteWarm,
      );
      pent.position.set(parapetOffset - 0.2, roofBaseY + 0.38, -0.15);
      pent.castShadow = true;
      bGroup.add(pent);

      const hvac = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.55, 0.28, 0.42)),
        mats.brushedAluminum,
      );
      hvac.position.set(parapetOffset + roofW * 0.22, roofBaseY + 0.28, 0.3);
      hvac.castShadow = true;
      bGroup.add(hvac);

      // Animated ventilation fan rotor atop HVAC unit
      const rotor = new THREE.Group();
      rotor.position.set(parapetOffset + roofW * 0.22, roofBaseY + 0.44, 0.3);
      const bladeGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.02, 0.06));
      const b1 = new THREE.Mesh(bladeGeo, mats.darkSteel);
      const b2 = new THREE.Mesh(bladeGeo, mats.darkSteel);
      b2.rotation.y = Math.PI / 2;
      rotor.add(b1, b2);
      bGroup.add(rotor);
      fanRotors.push(rotor);
    }

    group.add(bGroup);
  });

  scene.add(group);
  return { fanRotors };
}
