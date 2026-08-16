'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL, apiFetch, apiUpload, ApiError } from '@/lib/api';
import { localize } from '@/lib/localized';
import type {
  AdminAvatarUser,
  AdminProduct,
  AvatarAsset,
  AvatarAssetType,
  PaginatedResult,
} from '@/types';

export default function AdminModels3dPage() {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [avatars, setAvatars] = useState<AdminAvatarUser[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [assets, setAssets] = useState<AvatarAsset[] | null>(null);
  const [newAssetType, setNewAssetType] = useState<AvatarAssetType>('body');
  const [newAssetName, setNewAssetName] = useState('');
  const [newModelUrl, setNewModelUrl] = useState<string | null>(null);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState<string | null>(null);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const assetThumbnailInputRef = useRef<HTMLInputElement>(null);

  const loadAvatars = useCallback(async () => {
    const result = await apiFetch<AdminAvatarUser[]>('/users/admin/avatars', { auth: true });
    setAvatars(result);
  }, []);

  const loadProducts = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<AdminProduct>>('/products/admin/all?limit=100', {
      auth: true,
    });
    setProducts(result.items);
  }, []);

  const loadAssets = useCallback(async () => {
    const result = await apiFetch<AvatarAsset[]>('/avatar-assets/admin/all', { auth: true });
    setAssets(result);
  }, []);

  useEffect(() => {
    void loadAvatars();
    void loadProducts();
    void loadAssets();
  }, [loadAvatars, loadProducts, loadAssets]);

  async function handleAssetModelFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    event.target.value = '';

    setIsUploadingModel(true);
    setAssetError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await apiUpload<{ url: string }>('/uploads/model', formData, { auth: true });
      setNewModelUrl(`${API_URL}${uploaded.url}`);
    } catch (err) {
      setAssetError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsUploadingModel(false);
    }
  }

  async function handleAssetThumbnailFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    event.target.value = '';

    setIsUploadingThumbnail(true);
    setAssetError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await apiUpload<{ url: string }>('/uploads/image', formData, { auth: true });
      setNewThumbnailUrl(`${API_URL}${uploaded.url}`);
    } catch (err) {
      setAssetError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsUploadingThumbnail(false);
    }
  }

  async function handleCreateAsset() {
    if (!newAssetName.trim()) {
      setAssetError(t('assetNameRequired'));
      return;
    }
    if (!newModelUrl) {
      setAssetError(t('assetModelRequired'));
      return;
    }

    setIsSavingAsset(true);
    setAssetError(null);
    try {
      await apiFetch('/avatar-assets', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          type: newAssetType,
          name: newAssetName.trim(),
          modelUrl: newModelUrl,
          thumbnailUrl: newThumbnailUrl ?? undefined,
        }),
      });
      setNewAssetName('');
      setNewModelUrl(null);
      setNewThumbnailUrl(null);
      await loadAssets();
    } catch (err) {
      setAssetError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsSavingAsset(false);
    }
  }

  async function toggleAssetActive(asset: AvatarAsset) {
    await apiFetch(`/avatar-assets/${asset._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive: !asset.isActive }),
    });
    void loadAssets();
  }

  async function removeAsset(asset: AvatarAsset) {
    if (!window.confirm(t('confirmDeleteAsset'))) return;
    await apiFetch(`/avatar-assets/${asset._id}`, { method: 'DELETE', auth: true });
    void loadAssets();
  }

  async function toggleAvatarDisabled(user: AdminAvatarUser) {
    if (!user.avatarDisabled && !window.confirm(t('confirmDisableAvatar'))) return;
    await apiFetch(`/users/admin/${user._id}/avatar-status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ disabled: !user.avatarDisabled }),
    });
    void loadAvatars();
  }

  async function toggleTryOn(product: AdminProduct) {
    await apiFetch(`/products/${product._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ tryOnEnabled: !product.tryOnEnabled }),
    });
    void loadProducts();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('tabModels3d')}</h2>
        {avatars?.length === 0 ? (
          <p className="text-muted">{t('noAvatars')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted">
                  <th className="p-3 text-start">{t('colAvatarUser')}</th>
                  <th className="p-3 text-start">{t('colEmail')}</th>
                  <th className="p-3 text-start">{t('colAvatarStatus')}</th>
                  <th className="p-3 text-start">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {avatars?.map((user) => (
                  <tr key={user._id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          user.avatarDisabled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.avatarDisabled ? t('statusInactive') : t('statusActive')}
                      </span>
                    </td>
                    <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                      {user.avatarUrl && (
                        <a
                          href={user.avatarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {t('viewAvatar')}
                        </a>
                      )}
                      <button onClick={() => toggleAvatarDisabled(user)} className="text-brand-terracotta underline">
                        {user.avatarDisabled ? t('enableAvatar') : t('disableAvatar')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('tryOnSection')}</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted">
                <th className="p-3 text-start">{t('colName')}</th>
                <th className="p-3 text-start">{t('tryOnStatus')}</th>
                <th className="p-3 text-start">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => (
                <tr key={product._id} className="border-b border-border last:border-0">
                  <td className="p-3">{localize(product.name, locale)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        product.tryOnEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {product.tryOnEnabled ? t('statusActive') : t('statusInactive')}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleTryOn(product)} className="text-brand-terracotta underline">
                      {product.tryOnEnabled ? t('disableTryOn') : t('enableTryOn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('avatarLibrary')}</h2>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs text-muted">{t('assetType')}</label>
            <select
              value={newAssetType}
              onChange={(e) => setNewAssetType(e.target.value as AvatarAssetType)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="body">{t('bodyAssets')}</option>
              <option value="hair">{t('hairAssets')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t('assetName')}</label>
            <input
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <input
            ref={assetFileInputRef}
            type="file"
            accept=".glb,.gltf"
            hidden
            onChange={handleAssetModelFile}
          />
          <button
            type="button"
            onClick={() => assetFileInputRef.current?.click()}
            disabled={isUploadingModel}
            className={`rounded-md border px-4 py-2 text-sm hover:border-brand-gold disabled:opacity-50 ${
              newModelUrl ? 'border-brand-terracotta' : 'border-border'
            }`}
          >
            {isUploadingModel ? t('uploading') : newModelUrl ? t('modelSelected') : t('chooseModelFile')}
          </button>

          <input
            ref={assetThumbnailInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAssetThumbnailFile}
          />
          <button
            type="button"
            onClick={() => assetThumbnailInputRef.current?.click()}
            disabled={isUploadingThumbnail}
            className={`rounded-md border px-4 py-2 text-sm hover:border-brand-gold disabled:opacity-50 ${
              newThumbnailUrl ? 'border-brand-terracotta' : 'border-border'
            }`}
          >
            {isUploadingThumbnail
              ? t('uploading')
              : newThumbnailUrl
                ? t('thumbnailSelected')
                : t('chooseThumbnail')}
          </button>

          <button
            type="button"
            onClick={handleCreateAsset}
            disabled={isSavingAsset || isUploadingModel || isUploadingThumbnail}
            className="rounded-md bg-brand-terracotta px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSavingAsset ? t('uploading') : t('addAsset')}
          </button>
        </div>
        {assetError && <p className="mb-4 text-sm text-brand-terracotta">{assetError}</p>}

        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted">
                <th className="p-3 text-start">{t('colPhoto')}</th>
                <th className="p-3 text-start">{t('assetType')}</th>
                <th className="p-3 text-start">{t('assetName')}</th>
                <th className="p-3 text-start">{t('colStatus')}</th>
                <th className="p-3 text-start">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {assets?.map((asset) => (
                <tr key={asset._id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    {asset.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.thumbnailUrl}
                        alt=""
                        className="h-12 w-12 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md border border-border bg-background" />
                    )}
                  </td>
                  <td className="p-3">{asset.type === 'body' ? t('bodyAssets') : t('hairAssets')}</td>
                  <td className="p-3">{asset.name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        asset.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {asset.isActive ? t('statusActive') : t('statusInactive')}
                    </span>
                  </td>
                  <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                    <a href={asset.modelUrl} target="_blank" rel="noreferrer" className="underline">
                      {t('viewAvatar')}
                    </a>
                    <button onClick={() => toggleAssetActive(asset)} className="text-brand-terracotta underline">
                      {asset.isActive ? t('deactivate') : t('activate')}
                    </button>
                    <button onClick={() => removeAsset(asset)} className="text-brand-terracotta underline">
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
