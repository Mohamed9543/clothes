import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { UsersModule } from '../users/users.module';
import { SizeAssistantController } from './size-assistant.controller';
import { SizeAssistantService } from './size-assistant.service';

@Module({
  imports: [CatalogModule, UsersModule],
  controllers: [SizeAssistantController],
  providers: [SizeAssistantService],
})
export class SizeAssistantModule {}
