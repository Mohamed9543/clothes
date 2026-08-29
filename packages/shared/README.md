# Libas — Shared

Types TypeScript, enums et constantes partagés entre `apps/backend`, `apps/web` et (plus tard) `apps/mobile`.

Approche additive : ce package ne redéfinit pas les enums historiques déjà présents dans les schémas backend (`UserRole`, `ProductAudience`, `ProductType`, etc.) — il porte uniquement les concepts introduits depuis la Phase 1 (`Governorate`, `ShippingZone`, `PaymentStatus`, ...), pour éviter une réécriture massive du code existant.

## Build

```bash
pnpm --filter @libas/shared build
```

Consommé via `workspace:*` par `apps/backend` et `apps/web`.
