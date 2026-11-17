import * as THREE from 'three';
import type { CityMaterials } from '../materials';
import { SIDEWALK_TOP_Y } from './buildBaseAndRoads';
import { registerInteractiveObject, type InteractiveAssetMeta } from '../interactiveRegistry';

export interface InfrastructureResult {
  waterMeshes: THREE.Mesh[];
  clarifierBridges: THREE.Mesh[];
}

export function buildInfrastructure(
  scene: THREE.Scene,
  mats: CityMaterials,
  registry: InteractiveAssetMeta[],
  disposables: THREE.BufferGeometry[],
): InfrastructureResult {
  const group = new THREE.Group();
  group.name = 'CivicInfrastructure';
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  const waterMeshes: THREE.Mesh[] = [];
  const clarifierBridges: THREE.Mesh[] = [];

  // =========================================================================
  // 1. WATER INFRASTRUCTURE: North Smart Water Treatment & Reservoir Complex
  //    (Block NC: x -5.4..5.4, z -16.8..-9.6)
  // =========================================================================
  const waterComplex = new THREE.Group();
  waterComplex.position.set(0, SIDEWALK_TOP_Y, -13.2);

  // Facility apron pad
  const waterPad = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(10.6, 0.05, 6.8)),
    mats.concreteDark,
  );
  waterPad.position.y = 0.025;
  waterPad.receiveShadow = true;
  waterComplex.add(waterPad);

  // Two cylindrical clarifier treatment basins
  const basinWallGeo = trackGeo(new THREE.CylinderGeometry(1.55, 1.62, 0.68, 28, 1, true));
  const basinFloorGeo = trackGeo(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 24));
  const basinRimGeo = trackGeo(new THREE.TorusGeometry(1.55, 0.08, 10, 28));
  const basinWaterGeo = trackGeo(new THREE.CylinderGeometry(1.46, 1.46, 0.08, 24));
  const bridgeGeo = trackGeo(new THREE.BoxGeometry(3.0, 0.08, 0.28));

  for (const bx of [-2.8, 0.65]) {
    const tank = new THREE.Group();
    tank.position.set(bx, 0.05, -0.55);

    const wall = new THREE.Mesh(basinWallGeo, mats.concreteWarm);
    wall.position.y = 0.34;
    wall.castShadow = true;
    wall.receiveShadow = true;
    tank.add(wall);

    const floor = new THREE.Mesh(basinFloorGeo, mats.concreteDark);
    floor.position.y = 0.05;
    tank.add(floor);

    const rim = new THREE.Mesh(basinRimGeo, mats.brushedAluminum);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.68;
    tank.add(rim);

    const water = new THREE.Mesh(basinWaterGeo, mats.waterSurface);
    water.position.y = 0.56;
    tank.add(water);
    waterMeshes.push(water);

    // Clarifier rotating skimmer bridge
    const bridge = new THREE.Mesh(bridgeGeo, mats.brushedAluminum);
    bridge.position.y = 0.74;
    bridge.rotation.y = bx < 0 ? 0.35 : -0.45;
    bridge.castShadow = true;
    tank.add(bridge);
    clarifierBridges.push(bridge);

    const centerHub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.24, 0.26, 0.42, 14)),
      mats.pipeBlue,
    );
    centerHub.position.y = 0.58;
    tank.add(centerHub);

    waterComplex.add(tank);
  }

  // Modern Filtration Pump House
  const pumpHouse = new THREE.Group();
  pumpHouse.position.set(3.4, 0.05, -1.45);

  const pumpBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.6, 1.45, 2.2)),
    mats.concreteWarm,
  );
  pumpBody.position.y = 0.725;
  pumpBody.castShadow = true;
  pumpBody.receiveShadow = true;
  pumpHouse.add(pumpBody);

  const pumpWindow = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.9, 0.55, 0.08)),
    mats.architecturalGlass,
  );
  pumpWindow.position.set(0, 0.85, 1.1);
  pumpHouse.add(pumpWindow);

  const pumpRoof = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.8, 0.14, 2.4)),
    mats.darkSteel,
  );
  pumpRoof.position.y = 1.5;
  pumpRoof.castShadow = true;
  pumpHouse.add(pumpRoof);

  // Solar panels on pump house roof
  const pumpSolar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.1, 0.05, 1.4)),
    mats.solarPanel,
  );
  pumpSolar.position.set(0, 1.63, 0);
  pumpSolar.rotation.x = 0.16;
  pumpHouse.add(pumpSolar);

  waterComplex.add(pumpHouse);

  // Elevated Sculptural Smart Water Tower
  const towerGroup = new THREE.Group();
  towerGroup.position.set(3.55, 0.05, 1.65);

  const legGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.075, 2.25, 8));
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leg = new THREE.Mesh(legGeo, mats.darkSteel);
    leg.position.set(Math.cos(ang) * 0.7, 1.1, Math.sin(ang) * 0.7);
    leg.rotation.z = Math.cos(ang) * 0.12;
    leg.rotation.x = -Math.sin(ang) * 0.12;
    leg.castShadow = true;
    towerGroup.add(leg);
  }

  const tankRing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.95, 0.85, 0.14, 20)),
    mats.brushedAluminum,
  );
  tankRing.position.y = 2.22;
  towerGroup.add(tankRing);

  const tankDrum = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.88, 0.88, 1.15, 24)),
    mats.concreteWarm,
  );
  tankDrum.position.y = 2.84;
  tankDrum.castShadow = true;
  towerGroup.add(tankDrum);

  const tankBand = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.9, 0.9, 0.22, 24)),
    mats.pipeTeal,
  );
  tankBand.position.y = 2.88;
  towerGroup.add(tankBand);

  const tankCap = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.92, 0.36, 24)),
    mats.darkSteel,
  );
  tankCap.position.y = 3.58;
  tankCap.castShadow = true;
  towerGroup.add(tankCap);

  waterComplex.add(towerGroup);

  // Color-coded Pipe Manifolds connecting Clarifiers, Pump House, and Tower
  const pipeCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.8, 0.55, 1.3),
    new THREE.Vector3(-1.0, 0.55, 1.8),
    new THREE.Vector3(2.2, 0.55, 1.8),
    new THREE.Vector3(2.2, 0.55, -0.5),
  ]);
  const pipe1 = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(pipeCurve1, 24, 0.09, 8, false)),
    mats.pipeBlue,
  );
  pipe1.castShadow = true;
  waterComplex.add(pipe1);

  const pipeCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.65, 0.55, 1.25),
    new THREE.Vector3(1.6, 0.55, 1.25),
    new THREE.Vector3(3.55, 0.55, 1.65),
    new THREE.Vector3(3.55, 2.25, 1.65),
  ]);
  const pipe2 = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(pipeCurve2, 24, 0.08, 8, false)),
    mats.pipeTeal,
  );
  pipe2.castShadow = true;
  waterComplex.add(pipe2);

  group.add(waterComplex);

  registerInteractiveObject(
    waterComplex,
    {
      category: 'water',
      assetName: 'Yelahanka Water Treatment Complex',
      district: 'Bengaluru North · BWSSB Grid',
      anchorWorld: new THREE.Vector3(0.4, 2.2, -13.2),
      cameraPosition: new THREE.Vector3(11.5, 12.0, -2.5),
      cameraTarget: new THREE.Vector3(0.4, 1.0, -13.2),
      highlightMeshes: [pumpBody, tankDrum],
    },
    registry,
  );

  // =========================================================================
  // 2. SOUTH CIVIC CANAL & STORMWATER RETENTION BASIN (Block SC West: x -5.2..0.2, z 9.8..16.4)
  // =========================================================================
  const canalGroup = new THREE.Group();
  canalGroup.position.set(-2.5, SIDEWALK_TOP_Y, 13.1);

  const canalWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.8, 0.14, 6.2)),
    mats.curbStone,
  );
  canalWall.position.y = 0.04;
  canalWall.receiveShadow = true;
  canalGroup.add(canalWall);

  const canalWater = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.8, 0.1, 5.4)),
    mats.waterSurface,
  );
  canalWater.position.y = 0.08;
  canalGroup.add(canalWater);
  waterMeshes.push(canalWater);

  // Pedestrian cedar footbridge spanning the canal
  const footBridgeDeck = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.5, 0.1, 1.05)),
    mats.cedarWood,
  );
  footBridgeDeck.position.y = 0.28;
  footBridgeDeck.castShadow = true;
  footBridgeDeck.receiveShadow = true;
  canalGroup.add(footBridgeDeck);

  for (const bz of [-0.48, 0.48]) {
    const bridgeRail = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(4.5, 0.18, 0.05)),
      mats.darkSteel,
    );
    bridgeRail.position.set(0, 0.4, bz);
    canalGroup.add(bridgeRail);
  }

  group.add(canalGroup);

  registerInteractiveObject(
    canalGroup,
    {
      category: 'water',
      assetName: 'Ulsoor & Unkal Stormwater Canal',
      district: 'Karnataka Lake Retention Network',
      anchorWorld: new THREE.Vector3(-2.5, 0.65, 13.1),
      cameraPosition: new THREE.Vector3(7.5, 10.5, 22.0),
      cameraTarget: new THREE.Vector3(-2.5, 0.3, 13.1),
      highlightMeshes: [canalWall, footBridgeDeck],
    },
    registry,
  );

  // =========================================================================
  // 3. WASTE COLLECTION POINTS & ECO-SORTING HUB (`category: 'waste'`)
  // =========================================================================
  const buildSmartWasteStation = (
    x: number,
    z: number,
    rotY: number,
    name: string,
    district: string,
  ) => {
    const station = new THREE.Group();
    station.position.set(x, SIDEWALK_TOP_Y, z);
    station.rotation.y = rotY;

    const pad = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.75, 0.05, 0.95)),
      mats.concreteDark,
    );
    pad.position.y = 0.025;
    pad.receiveShadow = true;
    station.add(pad);

    // 3 color-coded smart compactor bins (Recyclables, Organics, General)
    const binGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.56, 0.46));
    const lidGeo = trackGeo(new THREE.BoxGeometry(0.44, 0.07, 0.48));
    const binColors: [number, THREE.MeshStandardMaterial][] = [
      [-0.52, mats.wasteBlue],
      [0, mats.wasteGreen],
      [0.52, mats.wasteCharcoal],
    ];
    const bodyMeshes: THREE.Mesh[] = [];

    binColors.forEach(([bx, bMat]) => {
      const bin = new THREE.Mesh(binGeo, bMat);
      bin.position.set(bx, 0.33, 0);
      bin.castShadow = true;
      station.add(bin);
      bodyMeshes.push(bin);

      const lid = new THREE.Mesh(lidGeo, mats.brushedAluminum);
      lid.position.set(bx, 0.63, 0);
      lid.castShadow = true;
      station.add(lid);
    });

    // Overhead solar sensor canopy frame
    const frameL = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.06, 0.95, 0.08)),
      mats.darkSteel,
    );
    frameL.position.set(-0.82, 0.5, -0.32);
    station.add(frameL);

    const frameR = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.06, 0.95, 0.08)),
      mats.darkSteel,
    );
    frameR.position.set(0.82, 0.5, -0.32);
    station.add(frameR);

    const canopy = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.8, 0.05, 0.78)),
      mats.solarPanel,
    );
    canopy.position.set(0, 0.96, -0.04);
    canopy.rotation.x = 0.14;
    canopy.castShadow = true;
    station.add(canopy);

    // Invisible click buffer so tiny bins are effortless to click
    const hitBox = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.1, 1.3, 1.4)),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitBox.position.y = 0.6;
    station.add(hitBox);

    group.add(station);

    registerInteractiveObject(
      station,
      {
        category: 'waste',
        assetName: name,
        district,
        anchorWorld: new THREE.Vector3(x, SIDEWALK_TOP_Y + 0.9, z),
        cameraPosition: new THREE.Vector3(x + 7.5, 7.8, z + 7.5),
        cameraTarget: new THREE.Vector3(x, 0.5, z),
        highlightMeshes: bodyMeshes,
      },
      registry,
    );
  };

  buildSmartWasteStation(
    -10.4,
    -14.8,
    0,
    'Malleswaram Smart Recycling Point',
    'Bengaluru West · Malleswaram 8th Cross',
  );
  buildSmartWasteStation(
    10.4,
    -14.8,
    0,
    'Hampankatta Swachh Waste Station',
    'Mangaluru · Hampankatta Circle',
  );
  buildSmartWasteStation(
    10.4,
    4.7,
    Math.PI / 2,
    'Indiranagar Compactor Station',
    'Bengaluru East · 12th Main',
  );

  // South-East Eco-Sorting & Waste Transfer Hub (Block SE: cx=14.4, cz=14.4)
  const ecoHub = new THREE.Group();
  ecoHub.position.set(14.4, SIDEWALK_TOP_Y, 14.4);

  const hubPad = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.0, 0.06, 3.6)),
    mats.concreteDark,
  );
  hubPad.position.y = 0.03;
  hubPad.receiveShadow = true;
  ecoHub.add(hubPad);

  const hubBuilding = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.2, 1.35, 2.2)),
    mats.concreteWarm,
  );
  hubBuilding.position.set(0.2, 0.72, -0.6);
  hubBuilding.castShadow = true;
  hubBuilding.receiveShadow = true;
  ecoHub.add(hubBuilding);

  const hubCanopy = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.8, 0.1, 3.2)),
    mats.darkSteel,
  );
  hubCanopy.position.set(0, 1.5, -0.1);
  hubCanopy.castShadow = true;
  ecoHub.add(hubCanopy);

  const hubSolar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.2, 0.06, 2.4)),
    mats.solarPanel,
  );
  hubSolar.position.set(0, 1.58, -0.1);
  ecoHub.add(hubSolar);

  // 3 large sorting hoppers on the south apron
  const hopperGeo = trackGeo(new THREE.BoxGeometry(0.8, 0.65, 0.85));
  const hubHighlights: THREE.Mesh[] = [hubBuilding];
  [
    [-1.1, mats.wasteBlue],
    [0, mats.wasteGreen],
    [1.1, mats.wasteCharcoal],
  ].forEach(([hx, hMat]) => {
    const hopper = new THREE.Mesh(hopperGeo, hMat as THREE.MeshStandardMaterial);
    hopper.position.set(hx as number, 0.38, 1.15);
    hopper.castShadow = true;
    ecoHub.add(hopper);
    hubHighlights.push(hopper);
  });

  group.add(ecoHub);

  registerInteractiveObject(
    ecoHub,
    {
      category: 'waste',
      assetName: 'Whitefield Swachh Eco-Sorting Hub',
      district: 'Bengaluru East · Circular Sanitation',
      anchorWorld: new THREE.Vector3(14.3, 1.7, 14.3),
      cameraPosition: new THREE.Vector3(21.5, 11.2, 21.5),
      cameraTarget: new THREE.Vector3(13.8, 0.7, 13.8),
      highlightMeshes: hubHighlights,
    },
    registry,
  );

  // =========================================================================
  // 4. DECORATIVE ENVIRONMENTAL DETAILS (Bus Shelters & Bike-Share Docks)
  // =========================================================================
  const buildBusShelter = (x: number, z: number, rotY: number) => {
    const shelter = new THREE.Group();
    shelter.position.set(x, SIDEWALK_TOP_Y, z);
    shelter.rotation.y = rotY;

    const backGlass = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.5, 0.75, 0.05)),
      mats.architecturalGlass,
    );
    backGlass.position.set(0, 0.42, -0.25);
    shelter.add(backGlass);

    const roof = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.7, 0.06, 0.75)),
      mats.brushedAluminum,
    );
    roof.position.set(0, 0.84, 0.02);
    roof.castShadow = true;
    shelter.add(roof);

    for (const px of [-0.72, 0.72]) {
      const post = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.84, 8)),
        mats.darkSteel,
      );
      post.position.set(px, 0.42, -0.24);
      shelter.add(post);
    }

    const seat = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.1, 0.06, 0.22)),
      mats.cedarWood,
    );
    seat.position.set(0, 0.22, -0.1);
    shelter.add(seat);

    group.add(shelter);
  };

  buildBusShelter(1.2, 5.55, 0);
  buildBusShelter(-9.55, 1.2, Math.PI / 2);

  // Bike-share docking stations
  const buildBikeDock = (x: number, z: number, rotY: number) => {
    const dock = new THREE.Group();
    dock.position.set(x, SIDEWALK_TOP_Y, z);
    dock.rotation.y = rotY;

    const rail = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.4, 0.05, 0.22)),
      mats.darkSteel,
    );
    rail.position.y = 0.025;
    dock.add(rail);

    const wheelGeo = trackGeo(new THREE.TorusGeometry(0.11, 0.02, 6, 12));
    const frameGeo = trackGeo(new THREE.BoxGeometry(0.03, 0.16, 0.24));
    for (let i = -2; i <= 2; i++) {
      if (i === 1) continue; // leave one empty dock slot for realism
      const bx = i * 0.28;
      const w1 = new THREE.Mesh(wheelGeo, mats.darkSteel);
      w1.rotation.y = Math.PI / 2;
      w1.position.set(bx, 0.14, 0.12);
      dock.add(w1);

      const frame = new THREE.Mesh(frameGeo, mats.pipeTeal);
      frame.position.set(bx, 0.22, 0.08);
      dock.add(frame);
    }
    group.add(dock);
  };

  buildBikeDock(4.2, 5.2, 0);
  buildBikeDock(-11.4, 5.2, 0);

  scene.add(group);
  return { waterMeshes, clarifierBridges };
}
