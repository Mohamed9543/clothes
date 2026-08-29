import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { memoryStorage } from 'multer';

const MAX_CSV_FILE_SIZE = 2 * 1024 * 1024; // 2MB — generous for a product CSV
const CSV_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TranslationService } from '../translation/translation.service';
import { TranslateProductDto } from '../translation/dto/translate-product.dto';
import { UserRole } from '../users/schemas/user.schema';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly translationService: TranslationService,
  ) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(@Query() query: QueryProductsDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="produits.csv"')
  exportCsv() {
    return this.productsService.exportToCsv();
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CSV_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        const okMime = CSV_MIME_TYPES.includes(file.mimetype);
        const okExt = extname(file.originalname).toLowerCase() === '.csv';
        if (!okMime && !okExt) {
          callback(new BadRequestException('Only CSV files are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.importFromCsv(file.buffer);
  }

  @Post('admin/translate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  translate(@Body() dto: TranslateProductDto) {
    return this.translationService.translateProduct(dto);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlugPublic(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/stock-movements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findStockMovements(@Param('id') id: string) {
    return this.productsService.findStockMovements(id);
  }

  @Patch(':id/stock-adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.productsService.adjustStock(id, dto);
  }
}
