'use client';

import type { ProductType } from '@/types';

interface ClothingOverlayProps {
  type: ProductType;
  colorHex: string;
}

// Approximate proxy shapes positioned for a standard full-body Ready Player Me
// avatar (feet near y=0, head around y=1.65). Not a real garment mesh — a
// visual stand-in tinted with the product's color, per the Phase 3 scope.
export function ClothingOverlay({ type, colorHex }: ClothingOverlayProps) {
  const material = <meshStandardMaterial color={colorHex} roughness={0.7} />;

  if (type === 'pull' || type === 'chemise' || type === 'veste') {
    return (
      <mesh position={[0, 1.28, 0]}>
        <capsuleGeometry args={[0.19, 0.32, 4, 12]} />
        {material}
      </mesh>
    );
  }

  if (type === 'robe') {
    return (
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.2, 0.62, 4, 12]} />
        {material}
      </mesh>
    );
  }

  if (type === 'pantalon') {
    return (
      <group position={[0, 0.62, 0]}>
        <mesh position={[-0.09, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.75, 12]} />
          {material}
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.75, 12]} />
          {material}
        </mesh>
      </group>
    );
  }

  if (type === 'chaussure') {
    return (
      <group position={[0, 0.05, 0.03]}>
        <mesh position={[-0.09, 0, 0]}>
          <boxGeometry args={[0.1, 0.09, 0.26]} />
          {material}
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.1, 0.09, 0.26]} />
          {material}
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={[0, 1.55, 0.12]}>
      <torusGeometry args={[0.07, 0.02, 8, 20]} />
      {material}
    </mesh>
  );
}
