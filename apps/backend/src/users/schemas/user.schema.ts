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
}

export const UserSchema = SchemaFactory.createForClass(User);
