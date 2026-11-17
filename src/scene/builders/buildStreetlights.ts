import * as THREE from 'three';
import type { CityMaterials } from '../materials';
import { SIDEWALK_TOP_Y } from './buildBaseAndRoads';
import { registerInteractiveObject, type InteractiveAssetMeta } from '../interactiveRegistry';

export interface StreetlightsResult {
  pointLights: THREE.PointLight[];
  poolMeshes: THREE.Mesh[];
}

export function buildStreetlights(
  scene: THREE.Scene,
  mats: CityMaterials,
  registry: InteractiveAssetMeta[],
  disposables: THREE.BufferGeometry[],
): StreetlightsResult {
  const group = new THREE.Group();
  group.name = 'Streetlights';
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  // Shared geometries for sleek 5-part smart streetlights
  const baseFlangeGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 10));
  const mastGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.048, 1.55, 10));
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.58, 0),
    new THREE.Vector3(0.1, 1.72, 0),
    new THREE.Vector3(0.36, 1.74, 0),
  ]);
  const armGeo = trackGeo(new THREE.TubeGeometry(armCurve, 10, 0.024, 8, false));
  const housingGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.055, 0.11));
  const lensGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.025, 0.085));
  const poolGeo = trackGeo(new THREE.PlaneGeometry(2.3, 2.3));
  const hitGeo = trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 8));
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  // Place 24 streetlights neatly along sidewalk edges facing inward toward roadways
  const placements: {
    x: number;
    z: number;
    rotY: number;
    label: string;
    district: string;
  }[] = [
    // Along Koramangala 80ft Road (z = 7.5)
    { x: -13.0, z: 5.6, rotY: -Math.PI / 2, label: 'BESCOM Smart Pole JN-01', district: 'Jayanagar 4th Block, Bengaluru' },
    { x: -13.0, z: 9.4, rotY: Math.PI / 2, label: 'BESCOM Smart Pole JP-02', district: 'JP Nagar Residential, Bengaluru' },
    { x: -3.2, z: 5.6, rotY: -Math.PI / 2, label: 'Cubbon Park Luminaire CB-03', district: 'Cubbon Park South, Bengaluru' },
    { x: 3.2, z: 5.6, rotY: -Math.PI / 2, label: 'Vidhana Plaza Pole MG-04', district: 'MG Road Boulevard, Bengaluru' },
    { x: -3.2, z: 9.4, rotY: Math.PI / 2, label: 'Ulsoor Promenade Pole UL-05', district: 'Ulsoor Lake Canal, Bengaluru' },
    { x: 3.2, z: 9.4, rotY: Math.PI / 2, label: 'Koramangala Library Pole KM-06', district: 'Koramangala 4th Block, Bengaluru' },
    { x: 13.0, z: 5.6, rotY: -Math.PI / 2, label: 'Indiranagar Pole IN-07', district: 'Indiranagar 12th Main, Bengaluru' },
    { x: 13.0, z: 9.4, rotY: Math.PI / 2, label: 'Whitefield Hub Pole WF-08', district: 'Whitefield Eco-Hub, Bengaluru' },

    // Along MG Road & Brigade Boulevard (z = -7.5)
    { x: -13.0, z: -9.4, rotY: -Math.PI / 2, label: 'Malleswaram Pole ML-09', district: 'Malleswaram 8th Cross, Bengaluru' },
    { x: -13.0, z: -5.6, rotY: Math.PI / 2, label: 'Sadashivanagar Pole SN-10', district: 'Sadashivanagar Park, Bengaluru' },
    { x: -3.2, z: -9.4, rotY: -Math.PI / 2, label: 'Yelahanka Plant Pole YL-11', district: 'Yelahanka Water Complex, Bengaluru' },
    { x: 3.2, z: -9.4, rotY: -Math.PI / 2, label: 'Hebbal Reservoir Pole HB-12', district: 'Hebbal Water Avenue, Bengaluru' },
    { x: -3.2, z: -5.6, rotY: Math.PI / 2, label: 'Kasturba Road Pole KB-13', district: 'Cubbon Park North, Bengaluru' },
    { x: 3.2, z: -5.6, rotY: Math.PI / 2, label: 'Brigade Junction Pole BG-14', district: 'MG Road & Brigade, Bengaluru' },
    { x: 13.0, z: -9.4, rotY: -Math.PI / 2, label: 'Hampankatta Solar Pole HK-15', district: 'Hampankatta Circle, Mangaluru' },
    { x: 13.0, z: -5.6, rotY: Math.PI / 2, label: 'Vidyanagar Avenue Pole VN-16', district: 'Vidyanagar, Hubballi' },

    // Along Sayyaji Rao & Indiranagar 100ft Corridors (x = ±7.5)
    { x: -9.4, z: -2.6, rotY: 0, label: 'Kukkarahalli Pole KK-17', district: 'Kukkarahalli Walk, Mysuru' },
    { x: -5.6, z: -2.6, rotY: Math.PI, label: 'Cubbon West Gate Pole CB-18', district: 'Cubbon Eco-Park, Bengaluru' },
    { x: -9.4, z: 2.6, rotY: 0, label: 'Sayyaji Rao Pole SR-19', district: 'Sayyaji Rao Road, Mysuru' },
    { x: -5.6, z: 2.6, rotY: Math.PI, label: 'Lalbagh Link Pole LB-20', district: 'Cubbon East Gate, Bengaluru' },
    { x: 5.6, z: -2.6, rotY: 0, label: 'MG Plaza East Pole MG-21', district: 'MG Road Central, Bengaluru' },
    { x: 9.4, z: -2.6, rotY: Math.PI, label: 'Indiranagar 100ft Pole IN-22', district: 'Indiranagar, Bengaluru' },
    { x: 5.6, z: 2.6, rotY: 0, label: 'Brigade South Pole BG-23', district: 'Brigade Road, Bengaluru' },
    { x: 9.4, z: 2.6, rotY: Math.PI, label: 'Domlur Corridor Pole DM-24', district: 'Indiranagar-Domlur, Bengaluru' },
  ];

  const poolMeshes: THREE.Mesh[] = [];

  placements.forEach((p) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(p.x, SIDEWALK_TOP_Y, p.z);
    lampGroup.rotation.y = p.rotY;

    const base = new THREE.Mesh(baseFlangeGeo, mats.darkSteel);
    base.position.y = 0.06;
    base.castShadow = true;
    lampGroup.add(base);

    const mast = new THREE.Mesh(mastGeo, mats.darkSteel);
    mast.position.y = 0.84;
    mast.castShadow = true;
    lampGroup.add(mast);

    const arm = new THREE.Mesh(armGeo, mats.brushedAluminum);
    lampGroup.add(arm);

    const housing = new THREE.Mesh(housingGeo, mats.darkSteel);
    housing.position.set(0.42, 1.74, 0);
    housing.castShadow = true;
    lampGroup.add(housing);

    const lens = new THREE.Mesh(lensGeo, mats.streetlampGlow);
    lens.position.set(0.42, 1.705, 0);
    lampGroup.add(lens);

    // Subtle ground illumination pool projected on road edge
    const pool = new THREE.Mesh(poolGeo, mats.streetlampPool);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0.42, -SIDEWALK_TOP_Y + 0.032, 0);
    lampGroup.add(pool);
    poolMeshes.push(pool);

    // Invisible simplified hit cylinder for crisp raycasting
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.set(0.18, 1.0, 0);
    lampGroup.add(hitMesh);

    const worldAnchor = new THREE.Vector3(p.x, SIDEWALK_TOP_Y + 1.5, p.z);
    const camTarget = new THREE.Vector3(p.x, SIDEWALK_TOP_Y + 0.8, p.z);
    const camPos = new THREE.Vector3(
      p.x + (p.x >= 0 ? 7.5 : -7.5),
      7.2,
      p.z + (p.z >= 0 ? 7.5 : -7.5),
    );

    registerInteractiveObject(
      hitMesh,
      {
        category: 'streetlights',
        assetName: p.label,
        district: p.district,
        anchorWorld: worldAnchor,
        cameraPosition: camPos,
        cameraTarget: camTarget,
        highlightMeshes: [mast, housing, lens],
      },
      registry,
    );

    group.add(lampGroup);
  });

  // Add 4 strategic warm PointLights over key intersections for genuine local streetlight illumination
  const pointLights: THREE.PointLight[] = [];
  const intersectionCoords: [number, number][] = [
    [-7.5, -7.5],
    [7.5, -7.5],
    [-7.5, 7.5],
    [7.5, 7.5],
  ];
  for (const [ix, iz] of intersectionCoords) {
    const pl = new THREE.PointLight(0xffcf82, 3.8, 13, 1.7);
    pl.position.set(ix, 2.2, iz);
    pl.castShadow = false; // keep shadow casters <= 3 for fast frame times
    group.add(pl);
    pointLights.push(pl);
  }

  scene.add(group);
  return { pointLights, poolMeshes };
}
