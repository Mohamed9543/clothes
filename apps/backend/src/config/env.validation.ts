import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  WEB_APP_URL: z.string().default('http://localhost:3001'),
  // Optional so the rest of the app still boots without it; GeminiService checks
  // for its presence and fails only the chat/translation endpoints if it's missing.
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  // Which PaymentProvider implementation to wire up. Only 'mock' is implemented
  // in Phase 1 (no Konnect/Flouci merchant account yet) — 'konnect'/'flouci'
  // fail loudly at startup rather than silently falling back to mock.
  PAYMENT_PROVIDER: z.enum(['mock', 'konnect', 'flouci']).default('mock'),
  PAYMENT_MOCK_WEBHOOK_SECRET: z.string().default('dev-mock-payment-secret'),
  // Web Push (VAPID) is a W3C standard — keys are self-generated (e.g. via
  // `npx web-push generate-vapid-keys`), no third-party account needed.
  // Optional so the app still boots without them; PushService no-ops if unset.
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_SUBJECT: z.string().default('mailto:contact@libas.tn'),
  // Which StorageProvider implementation to wire up for uploads. Only 'local'
  // is implemented for real use — no cloud bucket exists yet. 's3' works
  // against any S3-compatible endpoint (AWS S3, Cloudflare R2, DO Spaces) but
  // fails loudly at startup if selected without the required S3_* vars.
  // Transactional email through Resend (https://resend.com). Optional so the app
  // boots without it; the password-reset email fails only if it's missing.
  RESEND_API_KEY: z.string().default(''),
  MAIL_FROM: z.string().default('StyleForm <onboarding@resend.dev>'),
  // Google OAuth web client ID, used to verify "Sign in with Google" ID tokens.
  GOOGLE_CLIENT_ID: z.string().default(''),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_BUCKET: z.string().default(''),
  S3_ENDPOINT: z.string().default(''),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY: z.string().default(''),
  S3_SECRET_KEY: z.string().default(''),
  S3_PUBLIC_URL_BASE: z.string().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
