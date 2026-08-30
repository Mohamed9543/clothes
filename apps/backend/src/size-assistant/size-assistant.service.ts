import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../catalog/products.service';
import { UsersService } from '../users/users.service';

export type SizeConfidence = 'high' | 'medium' | 'low' | 'none';

export interface SizeRecommendation {
  recommendedSize: string | null;
  confidence: SizeConfidence;
  message: string;
}

// Kept identical to the static size guide's chest-circumference table
// (apps/web/src/components/size-guide.tsx) so the two never contradict
// each other.
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type Size = (typeof SIZE_ORDER)[number];
const CHEST_BRACKETS: Record<Size, [number, number]> = {
  XS: [80, 84],
  S: [85, 89],
  M: [90, 95],
  L: [96, 102],
  XL: [103, 110],
  XXL: [111, 118],
};
const BOUNDARY_MARGIN_CM = 2;

@Injectable()
export class SizeAssistantService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async recommend(userId: string, productId: string): Promise<SizeRecommendation> {
    const [user, product] = await Promise.all([
      this.usersService.findById(userId),
      this.productsService.findById(productId),
    ]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const availableSizes = [...new Set(product.variants.map((v) => v.size))].filter(
      (size): size is Size => (SIZE_ORDER as readonly string[]).includes(size),
    );
    const inStockSizes = [
      ...new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.size)),
    ].filter((size): size is Size => (SIZE_ORDER as readonly string[]).includes(size));
    const preferredPool = inStockSizes.length > 0 ? inStockSizes : availableSizes;

    if (!user.chestCm) {
      return {
        recommendedSize: null,
        confidence: 'none',
        message:
          'Complétez votre tour de poitrine dans votre profil (page Avatar) pour obtenir une recommandation de taille fiable.',
      };
    }

    if (preferredPool.length === 0) {
      return {
        recommendedSize: null,
        confidence: 'none',
        message: "Ce produit n'a pas de tailles standard permettant une recommandation.",
      };
    }

    const { size: baseSize, nearBoundary } = this.findBracket(user.chestCm);
    const shiftedSize = this.applyFitShift(baseSize, user.fitPreference);

    let recommendedSize: Size = shiftedSize;
    let confidence: SizeConfidence = nearBoundary ? 'medium' : 'high';
    let message = `Taille recommandée : ${recommendedSize} (confiance ${confidence === 'high' ? 'élevée' : 'moyenne'}).`;

    if (!preferredPool.includes(recommendedSize)) {
      const fallback = this.nearestAvailable(recommendedSize, preferredPool);
      recommendedSize = fallback;
      confidence = 'medium';
      message = `Taille ${shiftedSize} indisponible pour ce produit — taille la plus proche disponible : ${fallback}.`;
    }

    return { recommendedSize, confidence, message };
  }

  private findBracket(chestCm: number): { size: Size; nearBoundary: boolean } {
    for (const size of SIZE_ORDER) {
      const [min, max] = CHEST_BRACKETS[size];
      if (chestCm >= min && chestCm <= max) {
        const nearBoundary = chestCm - min < BOUNDARY_MARGIN_CM || max - chestCm < BOUNDARY_MARGIN_CM;
        return { size, nearBoundary };
      }
    }
    // Outside the chart entirely — clamp to the nearest end, low confidence signal.
    const size = chestCm < CHEST_BRACKETS.XS[0] ? 'XS' : 'XXL';
    return { size, nearBoundary: true };
  }

  private applyFitShift(size: Size, fitPreference: string | null): Size {
    const index = SIZE_ORDER.indexOf(size);
    if (fitPreference === 'slim') {
      return SIZE_ORDER[Math.max(0, index - 1)];
    }
    if (fitPreference === 'oversized') {
      return SIZE_ORDER[Math.min(SIZE_ORDER.length - 1, index + 1)];
    }
    return size;
  }

  private nearestAvailable(target: Size, pool: Size[]): Size {
    const targetIndex = SIZE_ORDER.indexOf(target);
    return pool.reduce((closest, candidate) => {
      const closestDistance = Math.abs(SIZE_ORDER.indexOf(closest) - targetIndex);
      const candidateDistance = Math.abs(SIZE_ORDER.indexOf(candidate) - targetIndex);
      return candidateDistance < closestDistance ? candidate : closest;
    }, pool[0]);
  }
}
