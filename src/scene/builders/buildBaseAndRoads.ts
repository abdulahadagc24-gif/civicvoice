import * as THREE from 'three';
import type { CityMaterials } from '../materials';
import { registerInteractiveObject, type InteractiveAssetMeta } from '../interactiveRegistry';

export interface BlockRect {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cx: number;
  cz: number;
  w: number;
  d: number;
}

export const CITY_BLOCKS: BlockRect[] = (() => {
  const cols: [string, number, number][] = [
    ['W', -17.2, -9.2],
    ['C', -5.8, 5.8],
    ['E', 9.2, 17.2],
  ];
  const rows: [string, number, number][] = [
    ['N', -17.2, -9.2],
    ['M', -5.8, 5.8],
    ['S', 9.2, 17.2],
  ];
  const blocks: BlockRect[] = [];
  for (const [rName, minZ, maxZ] of rows) {
    for (const [cName, minX, maxX] of cols) {
      blocks.push({
        id: `${rName}${cName}`,
        minX,
        maxX,
        minZ,
        maxZ,
        cx: (minX + maxX) / 2,
        cz: (minZ + maxZ) / 2,
        w: maxX - minX,
        d: maxZ - minZ,
      });
    }
  }
  return blocks;
})();

export const SIDEWALK_TOP_Y = 0.1;
export const ROAD_TOP_Y = 0.02;

export function buildBaseAndRoads(
  scene: THREE.Scene,
  mats: CityMaterials,
  registry: InteractiveAssetMeta[],
  disposables: THREE.BufferGeometry[],
): { signalMeshes: { red: THREE.Mesh[]; amber: THREE.Mesh[]; green: THREE.Mesh[] } } {
  const group = new THREE.Group();
  group.name = 'BaseAndRoads';
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  // Studio environment table plane beneath plinth
  const studioPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(220, 220)),
    mats.studioFloor,
  );
  studioPlane.rotation.x = -Math.PI / 2;
  studioPlane.position.y = -1.25;
  studioPlane.receiveShadow = true;
  group.add(studioPlane);

  // Architectural Scale Model Plinth (chamfered layered base)
  const plinthCore = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(36.2, 1.15, 36.2)),
    mats.plinthBase,
  );
  plinthCore.position.y = -0.62;
  plinthCore.receiveShadow = true;
  group.add(plinthCore);

  const plinthTopLip = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(36.6, 0.14, 36.6)),
    mats.plinthTrim,
  );
  plinthTopLip.position.y = -0.07;
  plinthTopLip.receiveShadow = true;
  group.add(plinthTopLip);

  const plinthBottomFoot = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(35.0, 0.22, 35.0)),
    mats.darkSteel,
  );
  plinthBottomFoot.position.y = -1.16;
  group.add(plinthBottomFoot);

  // Asphalt Roadway Deck (sits at y = 0.02)
  const roadBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(35.4, 0.04, 35.4)),
    mats.asphalt,
  );
  roadBase.position.y = 0.0;
  roadBase.receiveShadow = true;
  group.add(roadBase);

  // Sidewalk Block Pads (raised granite curb + paved sidewalk top at y = 0.10)
  for (const b of CITY_BLOCKS) {
    const curb = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(b.w, 0.1, b.d)),
      mats.curbStone,
    );
    curb.position.set(b.cx, 0.05, b.cz);
    curb.receiveShadow = true;
    curb.castShadow = true;
    group.add(curb);

    const pad = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(b.w - 0.18, 0.02, b.d - 0.18)),
      mats.sidewalk,
    );
    pad.position.set(b.cx, 0.095, b.cz);
    pad.receiveShadow = true;
    group.add(pad);
  }

  // Road Markings (centerlines, zebra crossings, stop bars)
  const markingY = 0.024;
  const roadCenters = [-7.5, 7.5];

  // Centerline segments (between intersections)
  const segRanges: [number, number][] = [
    [-17.2, -10.1],
    [-4.9, 4.9],
    [10.1, 17.2],
  ];

  const yellowLineGeo = trackGeo(new THREE.PlaneGeometry(0.08, 1));
  for (const rc of roadCenters) {
    for (const [start, end] of segRanges) {
      const len = end - start;
      const mid = (start + end) / 2;

      // North-South double yellow centerline
      for (const offset of [-0.07, 0.07]) {
        const lineNS = new THREE.Mesh(yellowLineGeo, mats.roadMarkingYellow);
        lineNS.rotation.x = -Math.PI / 2;
        lineNS.scale.set(1, len, 1);
        lineNS.position.set(rc + offset, markingY, mid);
        group.add(lineNS);

        // East-West double yellow centerline
        const lineEW = new THREE.Mesh(yellowLineGeo, mats.roadMarkingYellow);
        lineEW.rotation.x = -Math.PI / 2;
        lineEW.rotation.z = Math.PI / 2;
        lineEW.scale.set(1, len, 1);
        lineEW.position.set(mid, markingY, rc + offset);
        group.add(lineEW);
      }
    }
  }

  // Zebra Crossings & Stop Bars at the 4 major intersections
  const stripeGeo = trackGeo(new THREE.PlaneGeometry(0.24, 1.05));
  const stopBarGeo = trackGeo(new THREE.PlaneGeometry(1.45, 0.14));

  for (const ix of roadCenters) {
    for (const iz of roadCenters) {
      // 4 crosswalks around each intersection
      const armOffset = 2.25;
      // North & South crosswalks (stripes oriented along Z)
      for (const side of [-1, 1]) {
        const cz = iz + side * armOffset;
        for (let s = -2.5; s <= 2.5; s += 1) {
          const stripe = new THREE.Mesh(stripeGeo, mats.roadMarkingWhite);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(ix + s * 0.48, markingY, cz);
          group.add(stripe);
        }
        // Stop bar for approaching lane
        const stopBar = new THREE.Mesh(stopBarGeo, mats.roadMarkingWhite);
        stopBar.rotation.x = -Math.PI / 2;
        stopBar.position.set(ix + side * 0.85, markingY, iz + side * 3.05);
        group.add(stopBar);
      }

      // East & West crosswalks (stripes oriented along X)
      for (const side of [-1, 1]) {
        const cx = ix + side * armOffset;
        for (let s = -2.5; s <= 2.5; s += 1) {
          const stripe = new THREE.Mesh(stripeGeo, mats.roadMarkingWhite);
          stripe.rotation.x = -Math.PI / 2;
          stripe.rotation.z = Math.PI / 2;
          stripe.position.set(cx, markingY, iz + s * 0.48);
          group.add(stripe);
        }
        // Stop bar for approaching lane
        const stopBar = new THREE.Mesh(stopBarGeo, mats.roadMarkingWhite);
        stopBar.rotation.x = -Math.PI / 2;
        stopBar.rotation.z = Math.PI / 2;
        stopBar.position.set(ix + side * 3.05, markingY, iz - side * 0.85);
        group.add(stopBar);
      }
    }
  }

  // Intersection Smart Traffic Signals (4 intersections x 2 diagonal posts)
  const signalMeshes: { red: THREE.Mesh[]; amber: THREE.Mesh[]; green: THREE.Mesh[] } = {
    red: [],
    amber: [],
    green: [],
  };
  const poleGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.055, 1.35, 8));
  const armGeo = trackGeo(new THREE.BoxGeometry(0.65, 0.05, 0.05));
  const headGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.34, 0.1));
  const bulbGeo = trackGeo(new THREE.SphereGeometry(0.03, 8, 8));

  for (const ix of roadCenters) {
    for (const iz of roadCenters) {
      const corners: [number, number, number][] = [
        [ix - 1.9, iz - 1.9, Math.PI / 4],
        [ix + 1.9, iz + 1.9, -Math.PI * 0.75],
      ];
      corners.forEach(([px, pz, rot], idx) => {
        const sigGroup = new THREE.Group();
        sigGroup.position.set(px, SIDEWALK_TOP_Y, pz);
        sigGroup.rotation.y = rot;

        const pole = new THREE.Mesh(poleGeo, mats.darkSteel);
        pole.position.y = 0.675;
        pole.castShadow = true;
        sigGroup.add(pole);

        const arm = new THREE.Mesh(armGeo, mats.darkSteel);
        arm.position.set(0.3, 1.28, 0);
        sigGroup.add(arm);

        const head = new THREE.Mesh(headGeo, mats.concreteDark);
        head.position.set(0.55, 1.245, 0);
        sigGroup.add(head);

        const redBulb = new THREE.Mesh(bulbGeo, mats.signalRed.clone());
        redBulb.position.set(0.55, 1.34, 0.055);
        sigGroup.add(redBulb);

        const amberBulb = new THREE.Mesh(bulbGeo, mats.signalAmber.clone());
        amberBulb.position.set(0.55, 1.245, 0.055);
        sigGroup.add(amberBulb);

        const greenBulb = new THREE.Mesh(bulbGeo, mats.signalGreen.clone());
        greenBulb.position.set(0.55, 1.15, 0.055);
        sigGroup.add(greenBulb);

        redBulb.userData.axis = idx % 2 === 0 ? 'ns' : 'ew';
        amberBulb.userData.axis = idx % 2 === 0 ? 'ns' : 'ew';
        greenBulb.userData.axis = idx % 2 === 0 ? 'ns' : 'ew';

        signalMeshes.green.push(greenBulb);
        signalMeshes.amber.push(amberBulb);
        signalMeshes.red.push(redBulb);

        group.add(sigGroup);
      });
    }
  }

  // Interactive Road Corridor Hit Zones (4 avenues + 4 intersections)
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const roadCorridors: {
    name: string;
    district: string;
    pos: [number, number, number];
    size: [number, number, number];
    camPos: [number, number, number];
    camTarget: [number, number, number];
  }[] = [
    {
      name: 'Koramangala 80 Feet Road',
      district: 'Bengaluru South · TenderSURE Corridor',
      pos: [0, 0.08, 7.5],
      size: [34, 0.25, 3.4],
      camPos: [14.5, 11.5, 18.0],
      camTarget: [0, 0.2, 7.5],
    },
    {
      name: 'MG Road & Brigade Boulevard',
      district: 'Bengaluru Central · Heritage Transit',
      pos: [0, 0.08, -7.5],
      size: [34, 0.25, 3.4],
      camPos: [14.5, 11.5, 4.5],
      camTarget: [0, 0.2, -7.5],
    },
    {
      name: 'Sayyaji Rao Road',
      district: 'Mysuru · Dedicated Cycle Lane',
      pos: [-7.5, 0.08, 0],
      size: [3.4, 0.25, 34],
      camPos: [4.5, 11.5, 14.5],
      camTarget: [-7.5, 0.2, 0],
    },
    {
      name: 'Indiranagar 100 Feet Road',
      district: 'Bengaluru East · EV Feeder Corridor',
      pos: [7.5, 0.08, 0],
      size: [3.4, 0.25, 34],
      camPos: [19.5, 11.5, 14.5],
      camTarget: [7.5, 0.2, 0],
    },
  ];

  roadCorridors.forEach((rc) => {
    const hitMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(...rc.size)),
      hitMat,
    );
    hitMesh.position.set(...rc.pos);
    group.add(hitMesh);

    registerInteractiveObject(
      hitMesh,
      {
        category: 'roads',
        assetName: rc.name,
        district: rc.district,
        anchorWorld: new THREE.Vector3(rc.pos[0], 0.5, rc.pos[2]),
        cameraPosition: new THREE.Vector3(...rc.camPos),
        cameraTarget: new THREE.Vector3(...rc.camTarget),
        highlightMeshes: [roadBase],
      },
      registry,
    );
  });

  scene.add(group);
  return { signalMeshes };
}
