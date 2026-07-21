import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  create(input: CreateUserInput): Promise<UserDocument> {
    return this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { refreshTokenHash }).exec();
  }
}
