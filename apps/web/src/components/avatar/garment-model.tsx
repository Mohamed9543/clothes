'use client';

import { useGLTF } from '@react-three/drei';

// Expects a .glb already scaled/aligned to a standard full-body Ready Player Me
// avatar (feet near y=0), same convention as AvatarModel in avatar-viewer.tsx —
// no automatic rig/fitting is applied.
export function GarmentModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
