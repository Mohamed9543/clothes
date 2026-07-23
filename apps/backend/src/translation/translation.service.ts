import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI } from '@google/genai';
import { LocalizedText } from '../catalog/schemas/product.schema';
import { EnvConfig } from '../config/env.validation';
import { TranslateProductDto } from './dto/translate-product.dto';

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French',
  en: 'English',
  ar: 'Standard Arabic',
  tn: 'Tunisian Arabic (Darija)',
};

export interface ProductTranslation {
  name: LocalizedText;
  description: LocalizedText;
}

@Injectable()
export class TranslationService {
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const apiKey = this.configService.get('GEMINI_API_KEY', { infer: true });
    this.model = this.configService.get('GEMINI_MODEL', { infer: true });
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async translateProduct(dto: TranslateProductDto): Promise<ProductTranslation> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "La traduction automatique n'est pas configurée (GEMINI_API_KEY manquante).",
      );
    }

    const prompt = `Tu es un traducteur professionnel pour "Libas", une boutique de mode en ligne tunisienne.
Traduis le nom et la description de produit suivants, rédigés en ${LANGUAGE_NAMES[dto.sourceLocale]}, vers les 4 langues : français (fr), anglais (en), arabe standard (ar), et arabe tunisien / darija (tn).
La langue source (${dto.sourceLocale}) doit contenir le texte original, éventuellement nettoyé, mais pas retraduit.
Les traductions doivent être naturelles, concises, adaptées à une fiche produit e-commerce.

Nom du produit (${dto.sourceLocale}): "${dto.name}"
Description du produit (${dto.sourceLocale}): "${dto.description}"

Réponds UNIQUEMENT avec un objet JSON valide, sans balises markdown, exactement sous cette forme :
{"name":{"fr":"...","en":"...","ar":"...","tn":"..."},"description":{"fr":"...","en":"...","ar":"...","tn":"..."}}`;

    let text: string;
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });
      text = (response.text ?? '').trim();
    } catch (error) {
      const apiMessage =
        error instanceof ApiError ? error.message : "Erreur inconnue lors de l'appel à l'API de traduction.";
      throw new BadGatewayException(`Échec de la traduction automatique : ${apiMessage}`);
    }

    const jsonText = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

    try {
      const parsed = JSON.parse(jsonText) as ProductTranslation;
      if (!parsed.name || !parsed.description) {
        throw new Error('Missing name or description in translation result');
      }
      return parsed;
    } catch {
      throw new InternalServerErrorException("Impossible d'interpréter la réponse de traduction.");
    }
  }
}
