# Libas — Mobile (React Native / Expo)

Application mobile Expo (SDK 57, Expo Router, TypeScript). Premier jalon : authentification, catalogue, panier, commande basique (paiement à la livraison uniquement).

## Démarrer

```bash
cp .env.example .env.local   # ajuster EXPO_PUBLIC_API_URL si besoin
pnpm --filter mobile dev     # ou: cd apps/mobile && npx expo start
```

Le backend (`pnpm --filter backend dev`) doit tourner en local. Sur un appareil physique ou un émulateur Android, remplacer `localhost` par l'IP LAN de la machine de dev dans `EXPO_PUBLIC_API_URL`.

## Hors scope de ce jalon

Essayage virtuel/3D, styliste IA, lookbook, avis, wishlist, notifications push, admin, paiement carte, i18n multi-locale (français uniquement pour l'instant).
