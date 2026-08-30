import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, Content, Part, createPartFromFunctionResponse, GoogleGenAI, Tool } from '@google/genai';
import { EnvConfig } from '../config/env.validation';
import { ProductsService } from '../catalog/products.service';
import {
  LocalizedText,
  ProductAudience,
  ProductType,
  deriveProductColors,
} from '../catalog/schemas/product.schema';
import { ChatRole } from './schemas/conversation.schema';

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de StyleForm, une boutique de mode en ligne tunisienne (vêtements homme, femme, enfant).

Règles de langue (très important) :
- Réponds TOUJOURS dans la même langue que le dernier message de l'utilisateur.
- L'utilisateur peut écrire en français, en anglais, en arabe standard, ou en darija tunisienne (arabe tunisien, parfois écrit en alphabet latin/arabizi, parfois en caractères arabes).
- Exemples de darija tunisienne à reconnaître : "3andkom 9amja hamra?" (avez-vous une chemise rouge ?), "nheb outfit mizyen l loker" (je veux une belle tenue pour le travail), "chna categories 3andkom" (quelles catégories avez-vous), "9adiech taman el pull hedha" (quel est le prix de ce pull). Réponds en darija si l'utilisateur écrit en darija, avec un ton naturel et pas trop formel.

Rôle :
- Tu aides les clients à trouver des vêtements dans le catalogue StyleForm, à composer des tenues complètes (outfits) selon une occasion (mariage, soutenance, entretien, sport, quotidien...) et un budget, et à trouver la pièce qui se marie le mieux avec un vêtement donné.
- Utilise TOUJOURS les outils fournis pour chercher dans le vrai catalogue plutôt que d'inventer des produits. N'invente jamais de prix, de nom de produit ou de disponibilité.

Flux "Style Me" (composer une tenue complète) :
- Quand l'utilisateur demande une tenue/un look pour une occasion, un budget et/ou un style (ex : "Nheb haja behya lel mariage" = je veux quelque chose de beau pour un mariage, "3andi 200 dinar w nheb tenue élégante" = j'ai 200 dinars et je veux une tenue élégante, "Je veux une tenue streetwear noire"), appelle l'outil search_products une fois par type de vêtement pertinent (pull/chemise, pantalon, chaussure, veste, accessoire...) en répartissant le budget indiqué entre les pièces.
- Une fois les pièces choisies, appelle OBLIGATOIREMENT l'outil compose_outfit avec leurs identifiants (id) pour obtenir le prix total exact et la disponibilité réelle — ne calcule jamais le total toi-même.
- Si compose_outfit indique que allInStock est faux, signale-le clairement à l'utilisateur plutôt que de recommander silencieusement une pièce indisponible.
- Termine par une phrase expliquant le choix (occasion, style, pourquoi ces pièces vont ensemble) — sois concis.
- Si l'utilisateur demande une taille/couleur précise pour un produit, utilise l'outil check_stock avant de confirmer la disponibilité — ne suppose jamais qu'une taille/couleur est en stock.
- Sois concis, professionnel et chaleureux. Mentionne le prix en TND (dinars tunisiens).
- Si aucun produit ne correspond, dis-le clairement plutôt que d'inventer.`;

const PRODUCT_TYPES = Object.values(ProductType);
const PRODUCT_AUDIENCES = Object.values(ProductAudience);

const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description:
          "Recherche des produits dans le catalogue StyleForm avec des filtres. Utilise-le pour trouver des vêtements par public, type, fourchette de prix ou mots-clés (ex: occasion, couleur, style).",
        parametersJsonSchema: {
          type: 'object',
          properties: {
            audience: { type: 'string', enum: PRODUCT_AUDIENCES, description: 'Public visé' },
            type: { type: 'string', enum: PRODUCT_TYPES, description: 'Type de vêtement' },
            minPrice: { type: 'number', description: 'Prix minimum en TND' },
            maxPrice: { type: 'number', description: 'Prix maximum en TND' },
            search: { type: 'string', description: 'Mots-clés de recherche (nom, style, couleur...)' },
            limit: { type: 'number', description: 'Nombre max de résultats (défaut 5)' },
          },
        },
      },
      {
        name: 'get_product',
        description: "Récupère les détails complets d'un produit à partir de son slug.",
        parametersJsonSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Le slug du produit' },
          },
          required: ['slug'],
        },
      },
      {
        name: 'find_matching_products',
        description:
          "Trouve des produits d'un certain type qui se marient bien avec un produit donné (même public, couleurs compatibles). Utile pour répondre à 'quel pull va avec ce pantalon ?'.",
        parametersJsonSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: "L'identifiant (_id) du produit de référence" },
            type: { type: 'string', enum: PRODUCT_TYPES, description: 'Type de vêtement recherché' },
            limit: { type: 'number', description: 'Nombre max de résultats (défaut 3)' },
          },
          required: ['productId', 'type'],
        },
      },
      {
        name: 'check_stock',
        description:
          "Vérifie la disponibilité réelle d'une taille et couleur précises pour un produit avant de la recommander ou de confirmer sa disponibilité à l'utilisateur.",
        parametersJsonSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: "L'identifiant (_id) du produit" },
            size: { type: 'string', description: 'La taille demandée' },
            color: { type: 'string', description: 'La couleur demandée' },
          },
          required: ['productId', 'size', 'color'],
        },
      },
      {
        name: 'compose_outfit',
        description:
          "Assemble une tenue complète à partir d'une liste de produits déjà trouvés via search_products, et calcule son prix total réel ainsi que sa disponibilité. À appeler OBLIGATOIREMENT après avoir choisi les pièces d'une tenue — ne calcule jamais le total toi-même.",
        parametersJsonSchema: {
          type: 'object',
          properties: {
            productIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Les identifiants (_id) des produits qui composent la tenue',
            },
          },
          required: ['productIds'],
        },
      },
    ],
  },
];

export interface ChatToolProduct {
  id: string;
  slug: string;
  name: LocalizedText;
  price: number;
  audience: string;
  type: string;
  image: string | null;
}

export interface ChatComposedOutfit {
  items: ChatToolProduct[];
  totalPrice: number;
  allInStock: boolean;
}

export interface ChatReply {
  content: string;
  products: ChatToolProduct[];
  outfit?: ChatComposedOutfit;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly productsService: ProductsService,
  ) {
    const apiKey = this.configService.get('GEMINI_API_KEY', { infer: true });
    this.model = this.configService.get('GEMINI_MODEL', { infer: true });
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  private toToolProduct(product: {
    _id: unknown;
    slug: string;
    name: LocalizedText;
    price: number;
    audience: string;
    type: string;
    images: string[];
  }): ChatToolProduct {
    return {
      id: String(product._id),
      slug: product.slug,
      name: product.name,
      price: product.price,
      audience: product.audience,
      type: product.type,
      image: product.images[0] ?? null,
    };
  }

  private async runTool(name: string, input: Record<string, unknown>): Promise<{
    result: unknown;
    products: ChatToolProduct[];
    outfit?: ChatComposedOutfit;
  }> {
    if (name === 'search_products') {
      const { items } = await this.productsService.findAll({
        audience: input.audience as ProductAudience | undefined,
        type: input.type as ProductType | undefined,
        minPrice: input.minPrice as number | undefined,
        maxPrice: input.maxPrice as number | undefined,
        search: input.search as string | undefined,
        page: 1,
        limit: Math.min((input.limit as number) || 5, 10),
      });
      const products = items.map((item) => this.toToolProduct(item));
      return { result: products, products };
    }

    if (name === 'get_product') {
      const product = await this.productsService.findBySlug(input.slug as string);
      const mapped = this.toToolProduct(product);
      return { result: mapped, products: [mapped] };
    }

    if (name === 'find_matching_products') {
      const base = await this.productsService.findById(input.productId as string);
      if (!base) {
        return { result: { error: 'Product not found' }, products: [] };
      }
      const { items } = await this.productsService.findAll({
        audience: base.audience,
        type: input.type as ProductType,
        page: 1,
        limit: 20,
      });
      const scored = items
        .filter((item) => item._id.toString() !== base._id.toString())
        .map((item) => ({
          item,
          score: deriveProductColors(item).some((color) => deriveProductColors(base).includes(color))
            ? 1
            : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min((input.limit as number) || 3, 6))
        .map(({ item }) => item);
      const products = scored.map((item) => this.toToolProduct(item));
      return { result: products, products };
    }

    if (name === 'check_stock') {
      const product = await this.productsService.findById(input.productId as string);
      if (!product) {
        return { result: { error: 'Product not found' }, products: [] };
      }
      const stock = this.productsService.getVariantStock(
        product,
        input.size as string,
        input.color as string,
      );
      return { result: { inStock: stock > 0, stock }, products: [] };
    }

    if (name === 'compose_outfit') {
      const ids = (input.productIds as string[] | undefined) ?? [];
      const found = (
        await Promise.all(ids.map((id) => this.productsService.findById(id)))
      ).filter((product): product is NonNullable<typeof product> => Boolean(product) && product!.isActive);

      const items = found.map((product) => this.toToolProduct(product));
      const totalPrice = found.reduce((sum, product) => sum + product.price, 0);
      const allInStock = found.every((product) => product.variants.some((v) => v.stock > 0));
      const outfit: ChatComposedOutfit = { items, totalPrice, allInStock };

      return { result: outfit, products: items, outfit };
    }

    return { result: { error: `Unknown tool: ${name}` }, products: [] };
  }

  async chat(history: Array<{ role: ChatRole; content: string }>): Promise<ChatReply> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "Le chatbot IA n'est pas configuré (GEMINI_API_KEY manquante).",
      );
    }

    const contents: Content[] = history.map((m) => ({
      role: m.role === ChatRole.USER ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const collectedProducts: ChatToolProduct[] = [];
    const seenProductIds = new Set<string>();
    let composedOutfit: ChatComposedOutfit | undefined;

    for (let iteration = 0; iteration < 4; iteration += 1) {
      let response;
      try {
        response = await this.client.models.generateContent({
          model: this.model,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: TOOLS,
          },
        });
      } catch (error) {
        const apiMessage =
          error instanceof ApiError ? error.message : "Erreur inconnue lors de l'appel à l'API du chatbot.";
        throw new BadGatewayException(`Échec de la génération de réponse : ${apiMessage}`);
      }

      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        return { content: (response.text ?? '').trim(), products: collectedProducts, outfit: composedOutfit };
      }

      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) {
        contents.push(modelContent);
      }

      const responseParts: Part[] = [];
      for (const call of functionCalls) {
        const toolName = call.name ?? '';
        try {
          const { result, products, outfit } = await this.runTool(toolName, call.args ?? {});
          for (const product of products) {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id);
              collectedProducts.push(product);
            }
          }
          if (outfit) {
            composedOutfit = outfit;
          }
          responseParts.push(
            createPartFromFunctionResponse(call.id ?? toolName, toolName, {
              output: result,
            }),
          );
        } catch (error) {
          this.logger.error(`Tool ${toolName} failed`, error as Error);
          responseParts.push(
            createPartFromFunctionResponse(call.id ?? toolName, toolName, {
              error: 'An error occurred while executing this tool.',
            }),
          );
        }
      }

      contents.push({ role: 'user', parts: responseParts });
    }

    return {
      content: "Désolé, je n'ai pas pu terminer cette recherche. Peux-tu reformuler ta demande ?",
      products: collectedProducts,
      outfit: composedOutfit,
    };
  }
}
