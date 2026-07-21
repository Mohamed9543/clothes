import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUnion,
} from '@anthropic-ai/sdk/resources/messages';
import { EnvConfig } from '../config/env.validation';
import { ProductsService } from '../catalog/products.service';
import { LocalizedText, ProductAudience, ProductType } from '../catalog/schemas/product.schema';
import { ChatRole } from './schemas/conversation.schema';

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Libas, une boutique de mode en ligne tunisienne (vêtements homme, femme, enfant).

Règles de langue (très important) :
- Réponds TOUJOURS dans la même langue que le dernier message de l'utilisateur.
- L'utilisateur peut écrire en français, en anglais, en arabe standard, ou en darija tunisienne (arabe tunisien, parfois écrit en alphabet latin/arabizi, parfois en caractères arabes).
- Exemples de darija tunisienne à reconnaître : "3andkom 9amja hamra?" (avez-vous une chemise rouge ?), "nheb outfit mizyen l loker" (je veux une belle tenue pour le travail), "chna categories 3andkom" (quelles catégories avez-vous), "9adiech taman el pull hedha" (quel est le prix de ce pull). Réponds en darija si l'utilisateur écrit en darija, avec un ton naturel et pas trop formel.

Rôle :
- Tu aides les clients à trouver des vêtements dans le catalogue Libas, à composer des tenues complètes (outfits) selon une occasion (mariage, soutenance, entretien, sport, quotidien...) et un budget, et à trouver la pièce qui se marie le mieux avec un vêtement donné.
- Utilise TOUJOURS les outils fournis pour chercher dans le vrai catalogue plutôt que d'inventer des produits. N'invente jamais de prix, de nom de produit ou de disponibilité.
- Pour composer une tenue complète, appelle l'outil de recherche plusieurs fois (une fois par type de vêtement pertinent : pull/chemise, pantalon, chaussure, veste...) en répartissant le budget indiqué entre les pièces.
- Sois concis, professionnel et chaleureux. Mentionne le prix en TND (dinars tunisiens).
- Si aucun produit ne correspond, dis-le clairement plutôt que d'inventer.`;

const PRODUCT_TYPES = Object.values(ProductType);
const PRODUCT_AUDIENCES = Object.values(ProductAudience);

const TOOLS: ToolUnion[] = [
  {
    name: 'search_products',
    description:
      "Recherche des produits dans le catalogue Libas avec des filtres. Utilise-le pour trouver des vêtements par public, type, fourchette de prix ou mots-clés (ex: occasion, couleur, style).",
    input_schema: {
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
    input_schema: {
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
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: "L'identifiant (_id) du produit de référence" },
        type: { type: 'string', enum: PRODUCT_TYPES, description: 'Type de vêtement recherché' },
        limit: { type: 'number', description: 'Nombre max de résultats (défaut 3)' },
      },
      required: ['productId', 'type'],
    },
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

export interface ChatReply {
  content: string;
  products: ChatToolProduct[];
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly productsService: ProductsService,
  ) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY', { infer: true });
    this.model = this.configService.get('ANTHROPIC_MODEL', { infer: true });
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
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
          score: item.colors.some((color) => base.colors.includes(color)) ? 1 : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min((input.limit as number) || 3, 6))
        .map(({ item }) => item);
      const products = scored.map((item) => this.toToolProduct(item));
      return { result: products, products };
    }

    return { result: { error: `Unknown tool: ${name}` }, products: [] };
  }

  async chat(history: Array<{ role: ChatRole; content: string }>): Promise<ChatReply> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Le chatbot IA n\'est pas configuré (ANTHROPIC_API_KEY manquante).',
      );
    }

    const messages: MessageParam[] = history.map((m) => ({
      role: m.role === ChatRole.USER ? 'user' : 'assistant',
      content: m.content,
    }));

    const collectedProducts: ChatToolProduct[] = [];
    const seenProductIds = new Set<string>();

    for (let iteration = 0; iteration < 4; iteration += 1) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS as Tool[],
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        const text = response.content
          .filter((block) => block.type === 'text')
          .map((block) => (block.type === 'text' ? block.text : ''))
          .join('\n')
          .trim();
        return { content: text, products: collectedProducts };
      }

      const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');
      const toolResults: ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        try {
          const { result, products } = await this.runTool(
            block.name,
            (block.input ?? {}) as Record<string, unknown>,
          );
          for (const product of products) {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id);
              collectedProducts.push(product);
            }
          }
          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          this.logger.error(`Tool ${block.name} failed`, error as Error);
          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: 'An error occurred while executing this tool.',
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }

    return {
      content: "Désolé, je n'ai pas pu terminer cette recherche. Peux-tu reformuler ta demande ?",
      products: collectedProducts,
    };
  }
}
