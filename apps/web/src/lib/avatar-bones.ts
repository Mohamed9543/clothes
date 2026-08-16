import * as THREE from 'three';

export interface BodyBones {
  head: THREE.Bone[];
  chest: THREE.Bone[];
  arms: THREE.Bone[];
  legs: THREE.Bone[];
}

// Classifies a rig's bones by keyword match on their name, tolerating naming
// conventions from different sources (Mixamo's "mixamorigHead", plain "Head",
// "head_01", etc.) rather than requiring an exact skeleton standard.
export function findBodyBones(root: THREE.Object3D): BodyBones {
  const bones: BodyBones = { head: [], chest: [], arms: [], legs: [] };

  root.traverse((child) => {
    if (!(child instanceof THREE.Bone)) return;
    const name = child.name.toLowerCase();

    if (name.includes('head') || name.includes('neck')) {
      bones.head.push(child);
    } else if (name.includes('spine') || name.includes('chest') || name.includes('torso')) {
      bones.chest.push(child);
    } else if (name.includes('arm')) {
      bones.arms.push(child);
    } else if (name.includes('leg')) {
      bones.legs.push(child);
    }
  });

  return bones;
}

export function hasAnyBodyBones(bones: BodyBones): boolean {
  return (
    bones.head.length > 0 ||
    bones.chest.length > 0 ||
    bones.arms.length > 0 ||
    bones.legs.length > 0
  );
}

export function applyBoneScale(bones: THREE.Bone[], scale: number): void {
  bones.forEach((bone) => bone.scale.setScalar(scale));
}

export interface BodyProportions {
  head: number;
  chest: number;
  arms: number;
  legs: number;
}

export const NEUTRAL_PROPORTIONS: BodyProportions = { head: 1, chest: 1, arms: 1, legs: 1 };

export type BodyTypePreset = 'slim' | 'athletic' | 'average' | 'broad' | 'heavy';

export const BODY_TYPE_PRESETS: Record<BodyTypePreset, BodyProportions> = {
  slim: { head: 0.95, chest: 0.9, arms: 0.9, legs: 0.95 },
  athletic: { head: 1, chest: 1.05, arms: 1.05, legs: 1 },
  average: { head: 1, chest: 1, arms: 1, legs: 1 },
  broad: { head: 1, chest: 1.15, arms: 1.1, legs: 1.05 },
  heavy: { head: 1.05, chest: 1.25, arms: 1.15, legs: 1.1 },
};

export function applyProportions(bones: BodyBones, proportions: BodyProportions): void {
  applyBoneScale(bones.head, proportions.head);
  applyBoneScale(bones.chest, proportions.chest);
  applyBoneScale(bones.arms, proportions.arms);
  applyBoneScale(bones.legs, proportions.legs);
}

// Lightens/darkens a base color by a -1..1 amount (adjusts HSL lightness),
// used for the continuous "tone correction" slider layered on a base skin tone.
export function applyToneCorrection(baseColor: string, correction: number): THREE.Color {
  const color = new THREE.Color(baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  const l = Math.min(1, Math.max(0, hsl.l + correction * 0.3));
  color.setHSL(hsl.h, hsl.s, l);
  return color;
}
