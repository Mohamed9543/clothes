'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { GLTFExporter, GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import { API_URL, apiFetch, apiUpload, ApiError } from '@/lib/api';
import {
  applyProportions,
  applyToneCorrection,
  BODY_TYPE_PRESETS,
  findBodyBones,
  hasAnyBodyBones,
  NEUTRAL_PROPORTIONS,
  type BodyProportions,
  type BodyTypePreset,
} from '@/lib/avatar-bones';
import type { AvatarAsset } from '@/types';

const SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#4a2c17'];
const BODY_TYPES: BodyTypePreset[] = ['slim', 'athletic', 'average', 'broad', 'heavy'];

function loadGltfScene(loader: GLTFLoader, url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

// Assumes body assets are a bare mannequin with a single dominant skin material —
// recolors every mesh material on the body, not just a specific "skin" slot.
function BodyModel({
  url,
  skinColor,
  toneCorrection,
  proportions,
  onBonesDetected,
}: {
  url: string;
  skinColor: string;
  toneCorrection: number;
  proportions: BodyProportions;
  onBonesDetected: (hasBones: boolean) => void;
}) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const finalColor = applyToneCorrection(skinColor, toneCorrection);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material?.color) {
          const cloneMaterial = material.clone();
          cloneMaterial.color.copy(finalColor);
          child.material = cloneMaterial;
        }
      }
    });
    return clone;
  }, [scene, skinColor, toneCorrection]);

  const bones = useMemo(() => findBodyBones(cloned), [cloned]);

  useEffect(() => {
    onBonesDetected(hasAnyBodyBones(bones));
  }, [bones, onBonesDetected]);

  useEffect(() => {
    applyProportions(bones, proportions);
  }, [bones, proportions]);

  return <primitive object={cloned} />;
}

function HairModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone(true)} />;
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm ${
        active ? 'border-brand-terracotta bg-background' : 'border-border bg-background text-muted'
      }`}
    >
      {children}
    </button>
  );
}

function AssetCard({
  asset,
  active,
  onClick,
}: {
  asset: AvatarAsset;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-lg border-2 text-start ${
        active ? 'border-brand-terracotta' : 'border-border'
      }`}
    >
      {asset.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.thumbnailUrl} alt={asset.name} className="h-20 w-20 object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center bg-background text-center text-xs text-muted">
          {asset.name}
        </div>
      )}
      <p className="truncate bg-background px-1.5 py-1 text-xs">{asset.name}</p>
    </button>
  );
}

interface AvatarCreatorProps {
  onSaved: () => void;
  onClose: () => void;
}

export function AvatarCreator({ onSaved, onClose }: AvatarCreatorProps) {
  const t = useTranslations('avatar');

  const [bodies, setBodies] = useState<AvatarAsset[]>([]);
  const [hairs, setHairs] = useState<AvatarAsset[]>([]);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [selectedHairId, setSelectedHairId] = useState<string | null>(null);
  const [skinColor, setSkinColor] = useState(SKIN_TONES[0]);
  const [toneCorrection, setToneCorrection] = useState(0);
  const [proportions, setProportions] = useState<BodyProportions>(NEUTRAL_PROPORTIONS);
  const [bodyType, setBodyType] = useState<BodyTypePreset | null>(null);
  const [hasBones, setHasBones] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<AvatarAsset[]>('/avatar-assets', { auth: true }).then((assets) => {
      const bodyAssets = assets.filter((asset) => asset.type === 'body');
      const hairAssets = assets.filter((asset) => asset.type === 'hair');
      setBodies(bodyAssets);
      setHairs(hairAssets);
      if (bodyAssets.length > 0) {
        setSelectedBodyId(bodyAssets[0]._id);
      }
    });
  }, []);

  const selectedBody = bodies.find((asset) => asset._id === selectedBodyId);
  const selectedHair = hairs.find((asset) => asset._id === selectedHairId);

  useEffect(() => {
    setProportions(NEUTRAL_PROPORTIONS);
    setBodyType(null);
    setHasBones(false);
  }, [selectedBodyId]);

  function selectBodyType(preset: BodyTypePreset) {
    setBodyType(preset);
    setProportions(BODY_TYPE_PRESETS[preset]);
  }

  function resetProportions() {
    setBodyType(null);
    setProportions(NEUTRAL_PROPORTIONS);
  }

  const handleBonesDetected = useCallback((detected: boolean) => setHasBones(detected), []);

  async function saveAvatarUrl(avatarUrl: string) {
    await apiFetch('/users/me', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ avatarUrl }),
    });
    onSaved();
  }

  async function handleSave() {
    if (!selectedBody) return;
    setIsSaving(true);
    setError(null);
    try {
      const scene = new THREE.Scene();
      const loader = new GLTFLoader();

      const loadedBody = await loadGltfScene(loader, selectedBody.modelUrl);
      const finalColor = applyToneCorrection(skinColor, toneCorrection);
      loadedBody.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material?.color) {
            const cloneMaterial = material.clone();
            cloneMaterial.color.copy(finalColor);
            child.material = cloneMaterial;
          }
        }
      });
      applyProportions(findBodyBones(loadedBody), proportions);
      scene.add(loadedBody);

      if (selectedHair) {
        const loadedHair = await loadGltfScene(loader, selectedHair.modelUrl);
        scene.add(loadedHair);
      }

      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true });
      const glbBuffer = result as ArrayBuffer;
      const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
      const formData = new FormData();
      formData.append('file', blob, 'avatar.glb');

      const uploaded = await apiUpload<{ url: string }>('/uploads/avatar', formData, { auth: true });
      await saveAvatarUrl(`${API_URL}${uploaded.url}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('avatarUploadError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleManualFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    event.target.value = '';

    setIsUploadingFile(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await apiUpload<{ url: string }>('/uploads/avatar', formData, { auth: true });
      await saveAvatarUrl(`${API_URL}${uploaded.url}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('avatarUploadError'));
    } finally {
      setIsUploadingFile(false);
    }
  }

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-black lg:grid-cols-[1fr_380px]">
      <div className="relative h-[70vh] min-h-[480px] bg-black">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('back')}
          className="absolute start-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {selectedBody ? (
          <Canvas camera={{ position: [0, 1.4, 2.4], fov: 35 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 4, 3]} intensity={1} />
            <Suspense fallback={null}>
              <BodyModel
                url={selectedBody.modelUrl}
                skinColor={skinColor}
                toneCorrection={toneCorrection}
                proportions={proportions}
                onBonesDetected={handleBonesDetected}
              />
              {selectedHair && <HairModel url={selectedHair.modelUrl} />}
              <Environment preset="city" />
            </Suspense>
            <OrbitControls target={[0, 1.2, 0]} minDistance={1.2} maxDistance={4} enablePan={false} />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/70">
            {t('creatorNoBodies')}
          </div>
        )}
      </div>

      <div className="flex max-h-[70vh] min-h-[480px] flex-col overflow-y-auto bg-surface p-4">
        <div className="flex-1 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t('creatorBody')}</p>
            <div className="flex flex-wrap gap-2">
              {bodies.map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  active={selectedBodyId === asset._id}
                  onClick={() => setSelectedBodyId(asset._id)}
                />
              ))}
            </div>
          </div>

          {hairs.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">{t('creatorHair')}</p>
              <div className="flex flex-wrap gap-2">
                <PillButton active={selectedHairId === null} onClick={() => setSelectedHairId(null)}>
                  {t('creatorNoHair')}
                </PillButton>
                {hairs.map((asset) => (
                  <AssetCard
                    key={asset._id}
                    asset={asset}
                    active={selectedHairId === asset._id}
                    onClick={() => setSelectedHairId(asset._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {hasBones && (
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="mb-2 text-sm font-medium">{t('creatorBodyType')}</p>
              <div className="flex flex-wrap gap-2">
                {BODY_TYPES.map((preset) => (
                  <PillButton key={preset} active={bodyType === preset} onClick={() => selectBodyType(preset)}>
                    {t(`bodyType${preset.charAt(0).toUpperCase()}${preset.slice(1)}` as 'bodyTypeSlim')}
                  </PillButton>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-background p-3">
            <p className="mb-2 text-sm font-medium">{t('creatorSkinTone')}</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  aria-label={tone}
                  onClick={() => setSkinColor(tone)}
                  className={`h-8 w-8 rounded-full border-2 ${
                    skinColor === tone ? 'border-brand-terracotta' : 'border-border'
                  }`}
                  style={{ backgroundColor: tone }}
                />
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1 flex justify-between text-xs text-muted">
                <span>{t('creatorToneCorrection')}</span>
                <span>{toneCorrection.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={toneCorrection}
                onChange={(e) => setToneCorrection(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {hasBones && (
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{t('creatorProportions')}</p>
                <button
                  type="button"
                  onClick={resetProportions}
                  aria-label={t('resetProportions')}
                  className="text-muted hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {(['head', 'chest', 'arms', 'legs'] as const).map((part) => (
                  <div key={part}>
                    <label className="mb-1 flex justify-between text-xs text-muted">
                      <span>{t(`proportion${part.charAt(0).toUpperCase()}${part.slice(1)}` as 'proportionHead')}</span>
                      <span>{proportions[part].toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.8}
                      max={1.25}
                      step={0.01}
                      value={proportions[part]}
                      onChange={(e) => {
                        setBodyType(null);
                        setProportions((current) => ({ ...current, [part]: Number(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {error && <p className="text-sm text-brand-terracotta">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !selectedBody}
            className="w-full rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? t('savingAvatar') : t('saveAvatar')}
          </button>

          <button
            type="button"
            onClick={() => setShowManualUpload((value) => !value)}
            className="w-full text-center text-xs text-muted underline"
          >
            {t('orUploadFile')}
          </button>

          {showManualUpload && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                hidden
                onChange={handleManualFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
                className="w-full rounded-full border border-border px-4 py-2 text-sm hover:border-brand-gold disabled:opacity-50"
              >
                {isUploadingFile ? t('uploadingAvatar') : t('uploadFileCta')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
