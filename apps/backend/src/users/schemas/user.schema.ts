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
}

export const UserSchema = SchemaFactory.createForClass(User);
