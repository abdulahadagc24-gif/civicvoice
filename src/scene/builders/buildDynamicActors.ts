import * as THREE from 'three';
import type { CityMaterials } from '../materials';
import { ROAD_TOP_Y, SIDEWALK_TOP_Y } from './buildBaseAndRoads';
import { registerInteractiveObject, type InteractiveAssetMeta } from '../interactiveRegistry';

interface LoopWaypoint {
  x: number;
  z: number;
}

interface SampledPoint {
  x: number;
  z: number;
  dx: number;
  dz: number;
  curvature: number;
}

interface MovingVehicle {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  loopId: number;
  isBus: boolean;
  samples: SampledPoint[];
  totalLength: number;
  distance: number;
  baseSpeed: number; // world units per second
  currentSpeed: number;
  wheels: THREE.Mesh[];
  taillights: THREE.MeshStandardMaterial[];
  leftBlinkMat: THREE.MeshStandardMaterial;
  rightBlinkMat: THREE.MeshStandardMaterial;
}

interface MovingPedestrian {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  headMesh: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  samples: SampledPoint[];
  totalLength: number;
  distance: number;
  baseSpeed: number;
  currentSpeed: number;
  phase: number;
}

export interface TrafficSignalState {
  nsGreen: boolean;
  nsAmber: boolean;
  ewGreen: boolean;
  ewAmber: boolean;
}

export interface DynamicActorsController {
  update: (delta: number, elapsed: number, signals: TrafficSignalState) => void;
}

function buildRoundedLoopSamples(
  waypoints: LoopWaypoint[],
  cornerRadius: number,
  sampleCount: number,
): { samples: SampledPoint[]; totalLength: number } {
  const n = waypoints.length;
  const path = new THREE.CurvePath<THREE.Vector3>();

  for (let i = 0; i < n; i++) {
    const prev = waypoints[(i - 1 + n) % n];
    const curr = waypoints[i];
    const next = waypoints[(i + 1) % n];

    const vIn = new THREE.Vector3(curr.x - prev.x, 0, curr.z - prev.z);
    const vOut = new THREE.Vector3(next.x - curr.x, 0, next.z - curr.z);
    const lenIn = vIn.length();
    const lenOut = vOut.length();
    vIn.normalize();
    vOut.normalize();

    const r = Math.min(cornerRadius, lenIn * 0.42, lenOut * 0.42);
    const cornerStart = new THREE.Vector3(
      curr.x - vIn.x * r,
      0,
      curr.z - vIn.z * r,
    );
    const cornerEnd = new THREE.Vector3(
      curr.x + vOut.x * r,
      0,
      curr.z + vOut.z * r,
    );

    // Connect previous corner end to this corner start if needed
    const prevEnd =
      i === 0
        ? null
        : (path.curves[path.curves.length - 1] as THREE.Curve<THREE.Vector3>).getPoint(1);
    if (prevEnd && prevEnd.distanceTo(cornerStart) > 0.01) {
      path.add(new THREE.LineCurve3(prevEnd, cornerStart));
    }

    path.add(
      new THREE.QuadraticBezierCurve3(
        cornerStart,
        new THREE.Vector3(curr.x, 0, curr.z),
        cornerEnd,
      ),
    );
  }

  // Close final straight segment back to the start of curve[0]
  const lastCurve = path.curves[path.curves.length - 1];
  const firstCurve = path.curves[0];
  const endPt = lastCurve.getPoint(1);
  const startPt = firstCurve.getPoint(0);
  if (endPt.distanceTo(startPt) > 0.01) {
    path.add(new THREE.LineCurve3(endPt, startPt));
  }

  const totalLength = path.getLength();
  const rawPts = path.getSpacedPoints(sampleCount);
  const samples: SampledPoint[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const pPrev = rawPts[(i - 1 + sampleCount) % sampleCount];
    const pCurr = rawPts[i];
    const pNext = rawPts[(i + 1) % sampleCount];

    const d1x = pCurr.x - pPrev.x;
    const d1z = pCurr.z - pPrev.z;
    const d2x = pNext.x - pCurr.x;
    const d2z = pNext.z - pCurr.z;

    const tangent = new THREE.Vector2(pNext.x - pPrev.x, pNext.z - pPrev.z);
    if (tangent.lengthSq() > 1e-6) tangent.normalize();

    const cross = d1x * d2z - d1z * d2x;
    const curvature = THREE.MathUtils.clamp(cross * 14, -1, 1);

    samples.push({
      x: pCurr.x,
      z: pCurr.z,
      dx: tangent.x,
      dz: tangent.y,
      curvature,
    });
  }

  return { samples, totalLength };
}

function sampleSmoothLoop(
  samples: SampledPoint[],
  totalLength: number,
  distance: number,
  outPos: THREE.Vector3,
  outDir: THREE.Vector3,
): number {
  const n = samples.length;
  const wrapped = ((distance % totalLength) + totalLength) % totalLength;
  const exactIdx = (wrapped / totalLength) * n;
  const i0 = Math.floor(exactIdx) % n;
  const i1 = (i0 + 1) % n;
  const frac = exactIdx - Math.floor(exactIdx);

  const s0 = samples[i0];
  const s1 = samples[i1];

  outPos.set(
    THREE.MathUtils.lerp(s0.x, s1.x, frac),
    0,
    THREE.MathUtils.lerp(s0.z, s1.z, frac),
  );
  outDir
    .set(
      THREE.MathUtils.lerp(s0.dx, s1.dx, frac),
      0,
      THREE.MathUtils.lerp(s0.dz, s1.dz, frac),
    )
    .normalize();

  return THREE.MathUtils.lerp(s0.curvature, s1.curvature, frac);
}

function shouldYieldAtIntersection(
  x: number,
  z: number,
  dx: number,
  dz: number,
  signals: TrafficSignalState,
): boolean {
  // Intersections sit at x = ±7.5 and z = ±7.5; stop bars sit ~3.05u before center
  const movingAlongX = Math.abs(dx) > Math.abs(dz);
  if (movingAlongX) {
    if (signals.ewGreen) return false;
    for (const ix of [-7.5, 7.5]) {
      const distAhead = (ix - x) * Math.sign(dx);
      if (distAhead > 2.4 && distAhead < 4.1) return true;
    }
  } else {
    if (signals.nsGreen) return false;
    for (const iz of [-7.5, 7.5]) {
      const distAhead = (iz - z) * Math.sign(dz);
      if (distAhead > 2.4 && distAhead < 4.1) return true;
    }
  }
  return false;
}

export function buildDynamicActors(
  scene: THREE.Scene,
  mats: CityMaterials,
  registry: InteractiveAssetMeta[],
  disposables: THREE.BufferGeometry[],
): DynamicActorsController {
  const group = new THREE.Group();
  group.name = 'DynamicActors';
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  // =========================================================================
  // 1. SMALL MOVING VEHICLES (EV Sedans & BMTC / KSRTC Electric Shuttles)
  // =========================================================================
  const vehicles: MovingVehicle[] = [];

  const carChassisGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.16, 0.92));
  const carCabinGeo = trackGeo(new THREE.BoxGeometry(0.4, 0.15, 0.48));
  const carWheelGeo = trackGeo(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 12));
  const carLightGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.05, 0.03));

  const busChassisGeo = trackGeo(new THREE.BoxGeometry(0.56, 0.32, 1.55));
  const busGlassGeo = trackGeo(new THREE.BoxGeometry(0.57, 0.14, 1.32));
  const busRoofUnitGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.06, 0.72));
  const blinkerGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.045, 0.06));

  const innerCWLoop = buildRoundedLoopSamples(
    [
      { x: -6.72, z: -6.72 },
      { x: 6.72, z: -6.72 },
      { x: 6.72, z: 6.72 },
      { x: -6.72, z: 6.72 },
    ],
    1.55,
    180,
  );

  const outerCCWLoop = buildRoundedLoopSamples(
    [
      { x: -8.28, z: -8.28 },
      { x: -8.28, z: 8.28 },
      { x: 8.28, z: 8.28 },
      { x: 8.28, z: -8.28 },
    ],
    1.65,
    200,
  );

  const southShuttleLoop = buildRoundedLoopSamples(
    [
      { x: -16.2, z: 8.28 },
      { x: 16.2, z: 8.28 },
      { x: 16.2, z: 6.72 },
      { x: -16.2, z: 6.72 },
    ],
    0.76,
    220,
  );

  const createSedan = (colorIdx: number) => {
    const vGrp = new THREE.Group();
    const bodyPivot = new THREE.Group();
    vGrp.add(bodyPivot);

    const bodyMat = mats.carBodyColors[colorIdx % mats.carBodyColors.length];
    const chassis = new THREE.Mesh(carChassisGeo, bodyMat);
    chassis.position.y = 0.14;
    chassis.castShadow = true;
    bodyPivot.add(chassis);

    const cabin = new THREE.Mesh(carCabinGeo, mats.carGlass);
    cabin.position.set(0, 0.28, -0.04);
    cabin.castShadow = true;
    bodyPivot.add(cabin);

    const wheels: THREE.Mesh[] = [];
    for (const wx of [-0.23, 0.23]) {
      for (const wz of [-0.28, 0.28]) {
        const w = new THREE.Mesh(carWheelGeo, mats.darkSteel);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.085, wz);
        vGrp.add(w);
        wheels.push(w);
      }
    }

    const taillights: THREE.MeshStandardMaterial[] = [];
    for (const lx of [-0.14, 0.14]) {
      const hl = new THREE.Mesh(carLightGeo, mats.headlightGlow);
      hl.position.set(lx, 0.14, 0.465);
      bodyPivot.add(hl);

      const tlMat = mats.taillightGlow.clone();
      const tl = new THREE.Mesh(carLightGeo, tlMat);
      tl.position.set(lx, 0.14, -0.465);
      bodyPivot.add(tl);
      taillights.push(tlMat);
    }

    const leftBlinkMat = mats.signalAmber.clone();
    leftBlinkMat.emissiveIntensity = 0.08;
    const rightBlinkMat = mats.signalAmber.clone();
    rightBlinkMat.emissiveIntensity = 0.08;
    for (const bz of [-0.44, 0.44]) {
      const lb = new THREE.Mesh(blinkerGeo, leftBlinkMat);
      lb.position.set(0.22, 0.14, bz);
      bodyPivot.add(lb);
      const rb = new THREE.Mesh(blinkerGeo, rightBlinkMat);
      rb.position.set(-0.22, 0.14, bz);
      bodyPivot.add(rb);
    }

    return { grp: vGrp, bodyPivot, wheels, body: chassis, taillights, leftBlinkMat, rightBlinkMat };
  };

  const createBus = () => {
    const vGrp = new THREE.Group();
    const bodyPivot = new THREE.Group();
    vGrp.add(bodyPivot);

    const chassis = new THREE.Mesh(busChassisGeo, mats.busBody);
    chassis.position.y = 0.25;
    chassis.castShadow = true;
    bodyPivot.add(chassis);

    const glassBand = new THREE.Mesh(busGlassGeo, mats.carGlass);
    glassBand.position.y = 0.31;
    bodyPivot.add(glassBand);

    const roofBattery = new THREE.Mesh(busRoofUnitGeo, mats.brushedAluminum);
    roofBattery.position.set(0, 0.44, -0.1);
    bodyPivot.add(roofBattery);

    const wheels: THREE.Mesh[] = [];
    for (const wx of [-0.28, 0.28]) {
      for (const wz of [-0.48, 0.48]) {
        const w = new THREE.Mesh(carWheelGeo, mats.darkSteel);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.085, wz);
        vGrp.add(w);
        wheels.push(w);
      }
    }

    const taillights: THREE.MeshStandardMaterial[] = [];
    for (const lx of [-0.18, 0.18]) {
      const hl = new THREE.Mesh(carLightGeo, mats.headlightGlow);
      hl.position.set(lx, 0.16, 0.78);
      bodyPivot.add(hl);

      const tlMat = mats.taillightGlow.clone();
      const tl = new THREE.Mesh(carLightGeo, tlMat);
      tl.position.set(lx, 0.16, -0.78);
      bodyPivot.add(tl);
      taillights.push(tlMat);
    }

    const leftBlinkMat = mats.signalAmber.clone();
    leftBlinkMat.emissiveIntensity = 0.08;
    const rightBlinkMat = mats.signalAmber.clone();
    rightBlinkMat.emissiveIntensity = 0.08;
    for (const bz of [-0.75, 0.75]) {
      const lb = new THREE.Mesh(blinkerGeo, leftBlinkMat);
      lb.position.set(0.27, 0.16, bz);
      bodyPivot.add(lb);
      const rb = new THREE.Mesh(blinkerGeo, rightBlinkMat);
      rb.position.set(-0.27, 0.16, bz);
      bodyPivot.add(rb);
    }

    return { grp: vGrp, bodyPivot, wheels, body: chassis, taillights, leftBlinkMat, rightBlinkMat };
  };

  const vehicleConfigs: {
    type: 'sedan' | 'bus';
    colorIdx: number;
    loopId: number;
    loopData: { samples: SampledPoint[]; totalLength: number };
    startProgress: number;
    speed: number;
    label: string;
    district: string;
  }[] = [
    { type: 'sedan', colorIdx: 0, loopId: 0, loopData: innerCWLoop, startProgress: 0.05, speed: 2.3, label: 'Namma EV Sedan KA-01 #1', district: 'MG Road & Cubbon Loop' },
    { type: 'sedan', colorIdx: 1, loopId: 0, loopData: innerCWLoop, startProgress: 0.32, speed: 2.3, label: 'Namma EV Sedan KA-03 #2', district: 'Indiranagar Corridor' },
    { type: 'bus', colorIdx: 0, loopId: 0, loopData: innerCWLoop, startProgress: 0.58, speed: 2.1, label: 'BMTC Electric Feeder #1', district: 'Bengaluru Central Transit' },
    { type: 'sedan', colorIdx: 2, loopId: 0, loopData: innerCWLoop, startProgress: 0.82, speed: 2.3, label: 'Namma EV Sedan KA-05 #3', district: 'Jayanagar Loop' },
    { type: 'sedan', colorIdx: 3, loopId: 1, loopData: outerCCWLoop, startProgress: 0.12, speed: 2.15, label: 'Namma EV Sedan KA-09 #4', district: 'Sayyaji Rao Corridor' },
    { type: 'sedan', colorIdx: 4, loopId: 1, loopData: outerCCWLoop, startProgress: 0.41, speed: 2.15, label: 'Namma EV Sedan KA-19 #5', district: 'Hampankatta Transit Lane' },
    { type: 'sedan', colorIdx: 0, loopId: 1, loopData: outerCCWLoop, startProgress: 0.74, speed: 2.15, label: 'Namma EV Sedan KA-25 #6', district: 'Vidyanagar Loop' },
    { type: 'bus', colorIdx: 0, loopId: 2, loopData: southShuttleLoop, startProgress: 0.15, speed: 2.0, label: 'KSRTC Green Metro Shuttle', district: 'Koramangala 80ft Corridor' },
    { type: 'sedan', colorIdx: 1, loopId: 2, loopData: southShuttleLoop, startProgress: 0.65, speed: 2.1, label: 'Namma EV Sedan KA-02 #7', district: 'Koramangala 80ft Corridor' },
  ];

  vehicleConfigs.forEach((cfg) => {
    const built = cfg.type === 'bus' ? createBus() : createSedan(cfg.colorIdx);
    built.grp.position.y = ROAD_TOP_Y;
    group.add(built.grp);

    vehicles.push({
      group: built.grp,
      bodyPivot: built.bodyPivot,
      loopId: cfg.loopId,
      isBus: cfg.type === 'bus',
      samples: cfg.loopData.samples,
      totalLength: cfg.loopData.totalLength,
      distance: cfg.startProgress * cfg.loopData.totalLength,
      baseSpeed: cfg.speed,
      currentSpeed: cfg.speed,
      wheels: built.wheels,
      taillights: built.taillights,
      leftBlinkMat: built.leftBlinkMat,
      rightBlinkMat: built.rightBlinkMat,
    });

    registerInteractiveObject(
      built.grp,
      {
        category: 'roads',
        assetName: cfg.label,
        district: cfg.district,
        anchorWorld: built.grp.position,
        cameraPosition: new THREE.Vector3(14.5, 11.5, 16.5),
        cameraTarget: new THREE.Vector3(0, 0.3, 6.5),
        highlightMeshes: [built.body],
      },
      registry,
    );
  });

  // =========================================================================
  // 2. ARTICULATED PEDESTRIANS (Arms, Legs, Stride Bob & Crosswalk Yield)
  // =========================================================================
  const pedestrians: MovingPedestrian[] = [];
  const legGeo = trackGeo(new THREE.BoxGeometry(0.052, 0.16, 0.052));
  const armGeo = trackGeo(new THREE.BoxGeometry(0.042, 0.145, 0.042));
  const torsoGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.19, 0.088));
  const headGeo = trackGeo(new THREE.SphereGeometry(0.058, 8, 8));

  const pedLoops = [
    buildRoundedLoopSamples(
      [
        { x: -5.4, z: -5.4 },
        { x: 5.4, z: -5.4 },
        { x: 5.4, z: 5.4 },
        { x: -5.4, z: 5.4 },
      ],
      0.45,
      140,
    ),
    buildRoundedLoopSamples(
      [
        { x: -2.45, z: -4.4 },
        { x: -2.45, z: 4.4 },
        { x: -3.2, z: 4.4 },
        { x: -3.2, z: -4.4 },
      ],
      0.32,
      100,
    ),
    buildRoundedLoopSamples(
      [
        { x: 5.4, z: 5.4 },
        { x: 9.6, z: 5.4 },
        { x: 9.6, z: 9.6 },
        { x: 5.4, z: 9.6 },
      ],
      0.4,
      100,
    ),
    buildRoundedLoopSamples(
      [
        { x: -9.6, z: 5.4 },
        { x: -5.4, z: 5.4 },
        { x: -5.4, z: 9.6 },
        { x: -9.6, z: 9.6 },
      ],
      0.4,
      100,
    ),
  ];

  for (let i = 0; i < 22; i++) {
    const pGrp = new THREE.Group();
    const bodyGroup = new THREE.Group();
    pGrp.add(bodyGroup);

    const coatMat = mats.pedestrianCoats[i % mats.pedestrianCoats.length];

    const leftLeg = new THREE.Mesh(legGeo, mats.darkSteel);
    leftLeg.position.set(-0.035, 0.08, 0);
    leftLeg.castShadow = true;
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, mats.darkSteel);
    rightLeg.position.set(0.035, 0.08, 0);
    rightLeg.castShadow = true;
    bodyGroup.add(rightLeg);

    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.position.y = 0.245;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const leftArm = new THREE.Mesh(armGeo, coatMat);
    leftArm.position.set(-0.095, 0.24, 0);
    leftArm.castShadow = true;
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, coatMat);
    rightArm.position.set(0.095, 0.24, 0);
    rightArm.castShadow = true;
    bodyGroup.add(rightArm);

    const head = new THREE.Mesh(headGeo, mats.pedestrianSkin);
    head.position.y = 0.405;
    head.castShadow = true;
    bodyGroup.add(head);

    pGrp.position.y = SIDEWALK_TOP_Y;
    group.add(pGrp);

    const loopData = pedLoops[i % pedLoops.length];
    const baseSpeed = 0.56 + (i % 4) * 0.09;
    pedestrians.push({
      group: pGrp,
      bodyGroup,
      headMesh: head,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      samples: loopData.samples,
      totalLength: loopData.totalLength,
      distance: ((i * 0.17) % 1) * loopData.totalLength,
      baseSpeed,
      currentSpeed: baseSpeed,
      phase: i * 1.3,
    });
  }

  scene.add(group);

  // Pre-allocated scratch helpers
  const _pos = new THREE.Vector3();
  const _dir = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _up = new THREE.Vector3(0, 1, 0);
  const _origin = new THREE.Vector3(0, 0, 0);
  const _rotMat = new THREE.Matrix4();

  return {
    update: (delta: number, elapsed: number, signals: TrafficSignalState) => {
      const dt = Math.min(delta, 0.05);

      const blinkPulse = Math.sin(elapsed * 9.5) > 0;

      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        sampleSmoothLoop(v.samples, v.totalLength, v.distance, _pos, _dir);

        const signalStop = shouldYieldAtIntersection(
          _pos.x,
          _pos.z,
          _dir.x,
          _dir.z,
          signals,
        );

        // Same-loop headway collision avoidance so vehicles queue naturally at signals
        let nearestAhead = Infinity;
        let minHeadway = 1.85;
        for (let j = 0; j < vehicles.length; j++) {
          if (i === j || vehicles[j].loopId !== v.loopId) continue;
          const other = vehicles[j];
          const gap = (other.distance - v.distance + v.totalLength) % v.totalLength;
          const required = v.isBus || other.isBus ? 2.55 : 1.85;
          if (gap > 0.05 && gap < nearestAhead) {
            nearestAhead = gap;
            minHeadway = required;
          }
        }

        const trafficBlocked = nearestAhead < minHeadway;
        const mustStop = signalStop || trafficBlocked;
        let targetSpeed = mustStop ? 0 : v.baseSpeed;
        if (!mustStop && nearestAhead < minHeadway * 1.6) {
          const factor = THREE.MathUtils.clamp(
            (nearestAhead - minHeadway) / (minHeadway * 0.6),
            0.15,
            1,
          );
          targetSpeed = v.baseSpeed * factor;
        }

        const prevSpeed = v.currentSpeed;
        v.currentSpeed = THREE.MathUtils.damp(
          v.currentSpeed,
          targetSpeed,
          mustStop ? 6.5 : 3.4,
          dt,
        );

        v.distance = (v.distance + v.currentSpeed * dt) % v.totalLength;
        const curvature = sampleSmoothLoop(
          v.samples,
          v.totalLength,
          v.distance,
          _pos,
          _dir,
        );

        v.group.position.x = _pos.x;
        v.group.position.z = _pos.z;

        // Smooth heading quaternion
        _rotMat.lookAt(_dir, _origin, _up);
        _quat.setFromRotationMatrix(_rotMat);
        v.group.quaternion.slerp(_quat, Math.min(1, dt * 12));

        // Suspension pitch (braking dive / launch squat), corner roll, and subtle asphalt micro-vibration
        const accel = (v.currentSpeed - prevSpeed) / Math.max(dt, 0.001);
        const microBounce =
          Math.sin(elapsed * 22 + i * 2.1) *
          0.0028 *
          (v.currentSpeed / Math.max(v.baseSpeed, 0.1));
        v.bodyPivot.position.y = microBounce;

        const targetPitch = THREE.MathUtils.clamp(-accel * 0.012, -0.04, 0.04);
        const targetRoll = THREE.MathUtils.clamp(
          -curvature * v.currentSpeed * 0.035,
          -0.06,
          0.06,
        );
        v.bodyPivot.rotation.x = THREE.MathUtils.damp(
          v.bodyPivot.rotation.x,
          targetPitch,
          8,
          dt,
        );
        v.bodyPivot.rotation.z = THREE.MathUtils.damp(
          v.bodyPivot.rotation.z,
          targetRoll,
          8,
          dt,
        );

        // Brake light intensity boosts when braking or stopped
        const braking = mustStop || accel < -0.2;
        const tlIntensity = braking ? 3.2 : 1.05;
        for (let t = 0; t < v.taillights.length; t++) {
          v.taillights[t].emissiveIntensity = tlIntensity;
        }

        // Cornering turn indicators
        const turningLeft = curvature < -0.14 && v.currentSpeed > 0.25;
        const turningRight = curvature > 0.14 && v.currentSpeed > 0.25;
        v.leftBlinkMat.emissiveIntensity = turningLeft && blinkPulse ? 3.0 : 0.08;
        v.rightBlinkMat.emissiveIntensity = turningRight && blinkPulse ? 3.0 : 0.08;

        // Physical wheel rotation: angle = linearDistance / wheelRadius (0.085)
        const wheelSpin = (v.currentSpeed * dt) / 0.085;
        for (let w = 0; w < v.wheels.length; w++) {
          v.wheels[w].rotation.x += wheelSpin;
        }
      }

      for (let i = 0; i < pedestrians.length; i++) {
        const p = pedestrians[i];
        sampleSmoothLoop(p.samples, p.totalLength, p.distance, _pos, _dir);

        // Wait at curb edge if crosswalk cuts across an active green/amber traffic lane
        const nearCurbX =
          Math.abs(Math.abs(_pos.x) - 9.25) < 0.35 &&
          Math.abs(Math.abs(_pos.z) - 7.5) < 1.9;
        const nearCurbZ =
          Math.abs(Math.abs(_pos.z) - 9.25) < 0.35 &&
          Math.abs(Math.abs(_pos.x) - 7.5) < 1.9;
        const waitSignal =
          (nearCurbX && (signals.nsGreen || signals.nsAmber)) ||
          (nearCurbZ && (signals.ewGreen || signals.ewAmber));

        const targetSpeed = waitSignal ? 0 : p.baseSpeed;
        p.currentSpeed = THREE.MathUtils.damp(p.currentSpeed, targetSpeed, 7, dt);
        p.distance = (p.distance + p.currentSpeed * dt) % p.totalLength;

        sampleSmoothLoop(p.samples, p.totalLength, p.distance, _pos, _dir);

        const onRoad =
          Math.abs(Math.abs(_pos.x) - 7.5) < 1.65 ||
          Math.abs(Math.abs(_pos.z) - 7.5) < 1.65;
        p.group.position.set(
          _pos.x,
          onRoad ? ROAD_TOP_Y : SIDEWALK_TOP_Y,
          _pos.z,
        );

        const targetYaw = Math.atan2(_dir.x, _dir.z);
        p.group.rotation.y = targetYaw;

        // Articulated stride proportional to speed
        const speedNorm = p.currentSpeed / Math.max(p.baseSpeed, 0.01);
        const strideAngle = Math.sin(elapsed * 7.8 + p.phase) * 0.48 * speedNorm;
        const strideBob =
          Math.abs(Math.sin(elapsed * 7.8 + p.phase)) * 0.018 * speedNorm;

        p.bodyGroup.position.y = strideBob;
        p.bodyGroup.rotation.x = 0.055 * speedNorm;
        p.bodyGroup.rotation.y = Math.sin(elapsed * 7.8 + p.phase) * 0.05 * speedNorm;
        p.leftLeg.rotation.x = strideAngle;
        p.rightLeg.rotation.x = -strideAngle;
        p.leftArm.rotation.x = -strideAngle * 0.85;
        p.rightArm.rotation.x = strideAngle * 0.85;

        // Head looks left/right while waiting at crosswalk
        const targetHeadYaw =
          waitSignal && p.currentSpeed < 0.12
            ? Math.sin(elapsed * 2.4 + p.phase) * 0.48
            : 0;
        p.headMesh.rotation.y = THREE.MathUtils.damp(
          p.headMesh.rotation.y,
          targetHeadYaw,
          6,
          dt,
        );
      }
    },
  };
}
