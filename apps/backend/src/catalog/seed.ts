import '../config/dns-fallback';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Product, ProductAudience, ProductType } from './schemas/product.schema';

interface ProductVariantSeed {
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceOverride: number | null;
}

function slugifyColor(color: string): string {
  return color
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

// Spreads a total stock roughly evenly across sizes, with a bit of variation
// so the demo catalog naturally shows a mix of well-stocked / low / out-of-stock sizes.
// `color` here is the single color this demo product ships in (Phase 1 seed data
// doesn't model multi-color products yet — the schema itself supports it).
function variants(slug: string, color: string, sizes: string[], perSize: number[]): ProductVariantSeed[] {
  return sizes.map((size, index) => ({
    sku: `${slug}-${size}-${slugifyColor(color)}`.toUpperCase(),
    size,
    color,
    stock: perSize[index] ?? 0,
    priceOverride: null,
  }));
}

const DEMO_PRODUCTS = [
  {
    slug: 'pull-col-rond-homme-gris',
    name: { fr: 'Pull col rond gris', en: 'Grey crew-neck sweater', ar: 'كنزة رقبة دائرية رمادية', tn: 'كنزة رمادية' },
    description: {
      fr: 'Pull en maille douce, coupe classique, idéal pour toutes les saisons.',
      en: 'Soft knit sweater, classic fit, perfect for all seasons.',
      ar: 'كنزة من نسيج ناعم بقصة كلاسيكية، مناسبة لكل الفصول.',
      tn: 'كنزة ناعمة قصتها كلاسيك، تصلح لكل الفصول.',
    },
    price: 65,
    audience: ProductAudience.MEN,
    type: ProductType.PULL,
    variants: variants('pull-col-rond-homme-gris', 'Gris', ['S', 'M', 'L', 'XL'], [8, 10, 6, 1]),
  },
  {
    slug: 'pull-torsade-femme-beige',
    name: { fr: 'Pull torsadé beige', en: 'Beige cable-knit sweater', ar: 'كنزة مجدولة بيج', tn: 'كنزة بيج مجدولة' },
    description: {
      fr: 'Pull torsadé chaud et élégant, parfait pour l\'automne-hiver.',
      en: 'Warm and elegant cable-knit sweater, perfect for autumn-winter.',
      ar: 'كنزة مجدولة دافئة وأنيقة، مثالية لفصلي الخريف والشتاء.',
      tn: 'كنزة مجدولة سخونة وأنيقة، تعجب في الخريف والشتا.',
    },
    price: 79,
    audience: ProductAudience.WOMEN,
    type: ProductType.PULL,
    variants: variants('pull-torsade-femme-beige', 'Beige', ['XS', 'S', 'M', 'L'], [4, 6, 8, 0]),
  },
  {
    slug: 'pantalon-chino-homme-marine',
    name: { fr: 'Pantalon chino marine', en: 'Navy chino trousers', ar: 'بنطلون شينو كحلي', tn: 'سروال شينو كحلي' },
    description: {
      fr: 'Chino coupe droite, confortable et polyvalent, du bureau au week-end.',
      en: 'Straight-fit chino, comfortable and versatile, from office to weekend.',
      ar: 'بنطلون شينو بقصة مستقيمة، مريح ومتعدد الاستخدامات.',
      tn: 'سروال شينو قصته مستقيمة، مريح ويصلح لكل مناسبة.',
    },
    price: 89,
    audience: ProductAudience.MEN,
    type: ProductType.PANTALON,
    variants: variants('pantalon-chino-homme-marine', 'Marine', ['38', '40', '42', '44', '46'], [6, 8, 8, 6, 2]),
  },
  {
    slug: 'pantalon-tailleur-femme-noir',
    name: { fr: 'Pantalon tailleur noir', en: 'Black tailored trousers', ar: 'بنطلون كلاسيكي أسود', tn: 'سروال كلاسيك أسود' },
    description: {
      fr: 'Pantalon fluide à taille haute, parfait pour un look professionnel.',
      en: 'Flowy high-waisted trousers, perfect for a professional look.',
      ar: 'بنطلون انسيابي بخصر عالٍ، مثالي للإطلالة المهنية.',
      tn: 'سروال خفيف بخصر عالي، يعجب للخدمة والمناسبات.',
    },
    price: 95,
    audience: ProductAudience.WOMEN,
    type: ProductType.PANTALON,
    variants: variants('pantalon-tailleur-femme-noir', 'Noir', ['34', '36', '38', '40'], [5, 7, 6, 2]),
  },
  {
    slug: 'chemise-lin-homme-blanche',
    name: { fr: 'Chemise en lin blanche', en: 'White linen shirt', ar: 'قميص كتان أبيض', tn: 'قميص كتان أبيض' },
    description: {
      fr: 'Chemise légère en lin, respirante, idéale pour l\'été.',
      en: 'Lightweight breathable linen shirt, ideal for summer.',
      ar: 'قميص كتان خفيف ومنعش، مثالي للصيف.',
      tn: 'قميص كتان خفيف، يعجب برشا في الصيف.',
    },
    price: 75,
    audience: ProductAudience.MEN,
    type: ProductType.CHEMISE,
    variants: variants('chemise-lin-homme-blanche', 'Blanc', ['S', 'M', 'L', 'XL'], [5, 8, 7, 2]),
  },
  {
    slug: 'robe-ete-femme-fleurie',
    name: { fr: 'Robe d\'été fleurie', en: 'Floral summer dress', ar: 'فستان صيفي مزهر', tn: 'فستان صيفي بالورد' },
    description: {
      fr: 'Robe légère à motifs floraux, coupe évasée, parfaite pour l\'été.',
      en: 'Light floral-print dress, flared cut, perfect for summer.',
      ar: 'فستان خفيف بنقشة زهور وقصة موسعة، مثالي للصيف.',
      tn: 'فستان خفيف بالورد، قصته واسعة، يعجب في الصيف.',
    },
    price: 85,
    audience: ProductAudience.WOMEN,
    type: ProductType.ROBE,
    variants: variants('robe-ete-femme-fleurie', 'Multicolore', ['XS', 'S', 'M', 'L'], [3, 5, 5, 2]),
  },
  {
    slug: 'veste-jean-unisexe-bleu',
    name: { fr: 'Veste en jean bleu', en: 'Blue denim jacket', ar: 'جاكيت جينز أزرق', tn: 'جاكيت جينز أزرق' },
    description: {
      fr: 'Veste en jean intemporelle, coupe unisexe, parfaite en toute saison.',
      en: 'Timeless denim jacket, unisex fit, great in any season.',
      ar: 'جاكيت جينز كلاسيكي بقصة تناسب الجنسين، مناسب لكل الفصول.',
      tn: 'جاكيت جينز كلاسيك يلبسوه الكل، يعجب في أي فصل.',
    },
    price: 110,
    audience: ProductAudience.MEN,
    type: ProductType.VESTE,
    variants: variants('veste-jean-unisexe-bleu', 'Bleu', ['S', 'M', 'L', 'XL'], [4, 6, 5, 2]),
  },
  {
    slug: 'chaussures-sneakers-blanches',
    name: { fr: 'Sneakers blanches', en: 'White sneakers', ar: 'حذاء رياضي أبيض', tn: 'سبادري أبيض' },
    description: {
      fr: 'Sneakers minimalistes en cuir, confortables au quotidien.',
      en: 'Minimalist leather sneakers, comfortable for everyday wear.',
      ar: 'حذاء رياضي جلدي بتصميم بسيط، مريح للاستخدام اليومي.',
      tn: 'سبادري جلد بسيط، مريح للبس ديمة.',
    },
    price: 130,
    audience: ProductAudience.MEN,
    type: ProductType.CHAUSSURE,
    variants: variants('chaussures-sneakers-blanches', 'Blanc', ['40', '41', '42', '43', '44'], [6, 7, 8, 5, 2]),
  },
  {
    slug: 'chaussures-talons-femme-noir',
    name: { fr: 'Escarpins noirs', en: 'Black heeled pumps', ar: 'حذاء كعب أسود', tn: 'صبابط كعب أسود' },
    description: {
      fr: 'Escarpins élégants à talon moyen, parfaits pour les occasions.',
      en: 'Elegant mid-heel pumps, perfect for special occasions.',
      ar: 'حذاء بكعب متوسط أنيق، مثالي للمناسبات.',
      tn: 'صبابط بكعب متوسط، يعجبو للمناسبات.',
    },
    price: 120,
    audience: ProductAudience.WOMEN,
    type: ProductType.CHAUSSURE,
    variants: variants('chaussures-talons-femme-noir', 'Noir', ['36', '37', '38', '39', '40'], [3, 4, 4, 2, 1]),
  },
  {
    slug: 'pull-enfant-rayures',
    name: { fr: 'Pull enfant rayé', en: 'Striped kids sweater', ar: 'كنزة أطفال مقلمة', tn: 'كنزة صغار مخططة' },
    description: {
      fr: 'Pull confortable à rayures pour enfant, doux et facile d\'entretien.',
      en: 'Comfortable striped sweater for kids, soft and easy to care for.',
      ar: 'كنزة مريحة مقلمة للأطفال، ناعمة وسهلة العناية.',
      tn: 'كنزة مريحة للصغار مخططة، ناعمة وسهلة الغسيل.',
    },
    price: 40,
    audience: ProductAudience.KIDS,
    type: ProductType.PULL,
    variants: variants('pull-enfant-rayures', 'Multicolore', ['4A', '6A', '8A', '10A'], [5, 6, 6, 3]),
  },
  {
    slug: 'pantalon-jogger-enfant-gris',
    name: { fr: 'Jogger enfant gris', en: 'Grey kids jogger pants', ar: 'بنطلون جوغر أطفال رمادي', tn: 'سروال جوغر صغار رمادي' },
    description: {
      fr: 'Jogger confortable en molleton, idéal pour le jeu et l\'école.',
      en: 'Comfortable fleece jogger pants, great for play and school.',
      ar: 'بنطلون جوغر مريح من القماش الصوفي، مثالي للعب والمدرسة.',
      tn: 'سروال جوغر مريح، يعجب للعب والمدرسة.',
    },
    price: 35,
    audience: ProductAudience.KIDS,
    type: ProductType.PANTALON,
    variants: variants('pantalon-jogger-enfant-gris', 'Gris', ['4A', '6A', '8A', '10A', '12A'], [6, 7, 6, 4, 1]),
  },
  {
    slug: 'veste-femme-tailleur-camel',
    name: { fr: 'Veste tailleur camel', en: 'Camel tailored blazer', ar: 'جاكيت كلاسيكي كاميل', tn: 'جاكيت كلاسيك كاميل' },
    description: {
      fr: 'Veste blazer structurée, coupe cintrée, pour un look sophistiqué.',
      en: 'Structured blazer, fitted cut, for a sophisticated look.',
      ar: 'جاكيت بلايزر منظم بقصة ضيقة، لإطلالة أنيقة.',
      tn: 'جاكيت بلايزر قصته ضيقة، يعطي لوك شيك.',
    },
    price: 145,
    audience: ProductAudience.WOMEN,
    type: ProductType.VESTE,
    variants: variants('veste-femme-tailleur-camel', 'Camel', ['XS', 'S', 'M', 'L'], [0, 3, 4, 2]),
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));

  let created = 0;
  for (const product of DEMO_PRODUCTS) {
    const images = [`https://picsum.photos/seed/${product.slug}/600/800`];
    const result = await productModel.updateOne(
      { slug: product.slug },
      { $setOnInsert: { ...product, images, isActive: true } },
      { upsert: true },
    );
    if (result.upsertedCount > 0) created += 1;
  }

  console.log(`Seed done. ${created} new product(s) created (${DEMO_PRODUCTS.length} total in seed set).`);
  await app.close();
}

bootstrap().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
