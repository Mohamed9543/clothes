import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import type { StorageProvider } from './interfaces/storage-provider.interface';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MODEL_EXTENSIONS = ['.glb', '.gltf'];
const MAX_MODEL_FILE_SIZE = 30 * 1024 * 1024;
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

function generateFilename(originalname: string): string {
  return `${randomUUID()}${extname(originalname)}`;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  @Post('image')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Only JPEG, PNG, WEBP or GIF images are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storageProvider.save(file.buffer, generateFilename(file.originalname), file.mimetype);
  }

  @Post('model')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_MODEL_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MODEL_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
          callback(new BadRequestException('Only GLB or GLTF 3D models are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadModel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storageProvider.save(file.buffer, generateFilename(file.originalname), file.mimetype);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_MODEL_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MODEL_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
          callback(new BadRequestException('Only GLB or GLTF 3D models are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storageProvider.save(file.buffer, generateFilename(file.originalname), file.mimetype);
  }
}
