import * as THREE from 'three';
import type { InfrastructureCategoryId } from '../types/civic';

export interface InteractiveAssetMeta {
  category: InfrastructureCategoryId;
  assetName: string;
  district: string;
  anchorWorld: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  highlightMeshes: THREE.Mesh[];
}

export const INTERACTIVE_LAYER = 1;

export function registerInteractiveObject(
  hitTarget: THREE.Object3D,
  meta: InteractiveAssetMeta,
  registry: InteractiveAssetMeta[],
): void {
  const index = registry.length;
  registry.push(meta);

  hitTarget.traverse((child) => {
    child.layers.enable(INTERACTIVE_LAYER);
    child.userData.interactiveIndex = index;
  });
}
