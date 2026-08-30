'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { ClothingOverlay } from './clothing-overlay';
import { GarmentModel } from './garment-model';
import { GltfErrorBoundary } from './gltf-error-boundary';
import { computeAvatarScale } from '@/lib/avatar-scale';
import type { ProductType } from '@/types';

function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export interface AvatarOverlay {
  id: string;
  type: ProductType;
  colorHex: string;
  modelUrl?: string | null;
}

interface AvatarViewerProps {
  avatarUrl: string;
  overlays?: AvatarOverlay[];
  heightCm?: number | null;
  weightKg?: number | null;
  className?: string;
}

export function AvatarViewer({
  avatarUrl,
  overlays,
  heightCm,
  weightKg,
  className,
}: AvatarViewerProps) {
  const t = useTranslations('avatar');

  return (
    <div className={className}>
      <GltfErrorBoundary
        key={avatarUrl}
        fallback={
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">
            {t('loadError')}
          </div>
        }
      >
        <Canvas camera={{ position: [0, 1.4, 2.4], fov: 35 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 4, 3]} intensity={1} />
          <Suspense fallback={null}>
            <group scale={computeAvatarScale(heightCm, weightKg)}>
              <AvatarModel url={avatarUrl} />
              {overlays?.map((overlay) =>
                overlay.modelUrl ? (
                  <GarmentModel key={overlay.id} url={overlay.modelUrl} />
                ) : (
                  <ClothingOverlay key={overlay.id} type={overlay.type} colorHex={overlay.colorHex} />
                ),
              )}
            </group>
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            target={[0, 1.2, 0]}
            minDistance={1.2}
            maxDistance={4}
            enablePan={false}
          />
        </Canvas>
      </GltfErrorBoundary>
    </div>
  );
}
