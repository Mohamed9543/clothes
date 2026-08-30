import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum PreferredLanguage {
  ARABIC = 'ar',
  DARIJA = 'tn',
  FRENCH = 'fr',
  ENGLISH = 'en',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum FitPreference {
  SLIM = 'slim',
  REGULAR = 'regular',
  OVERSIZED = 'oversized',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ type: String, enum: PreferredLanguage, default: PreferredLanguage.FRENCH })
  preferredLanguage: PreferredLanguage;

  @Prop({ type: String, default: null })
  refreshTokenHash: string | null;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @Prop({ type: Number, default: null })
  heightCm: number | null;

  @Prop({ type: Number, default: null })
  weightKg: number | null;

  @Prop({ type: String, enum: Gender, default: null })
  gender: Gender | null;

  @Prop({ type: Number, default: null })
  chestCm: number | null;

  @Prop({ type: Number, default: null })
  waistCm: number | null;

  @Prop({ type: Number, default: null })
  hipsCm: number | null;

  @Prop({ type: Number, default: null })
  legLengthCm: number | null;

  @Prop({ type: String, default: null })
  usualSize: string | null;

  @Prop({ type: String, enum: FitPreference, default: null })
  fitPreference: FitPreference | null;

  // "Libas Rewards" — earned on delivery, redeemable at checkout for a
  // discount (see LOYALTY_* constants in @libas/shared).
  @Prop({ default: 0, min: 0 })
  loyaltyPoints: number;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: false })
  avatarDisabled: boolean;

  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
