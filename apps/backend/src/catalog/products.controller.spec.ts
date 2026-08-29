import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TranslationService } from '../translation/translation.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController — CSV import upload hardening', () => {
  let app: INestApplication;
  let importFromCsvMock: jest.Mock;

  beforeAll(async () => {
    importFromCsvMock = jest.fn().mockResolvedValue({ created: 0, updated: 0, errors: [] });

    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: { importFromCsv: importFromCsvMock } },
        { provide: TranslationService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    importFromCsvMock.mockClear();
  });

  it('rejects a non-CSV file before reaching the import service', async () => {
    await request(app.getHttpServer())
      .post('/products/admin/import')
      .attach('file', Buffer.from('not a csv but pretends'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      })
      .expect(400);

    expect(importFromCsvMock).not.toHaveBeenCalled();
  });

  it('rejects a CSV file larger than the size limit', async () => {
    const oversized = Buffer.alloc(3 * 1024 * 1024, 'a'); // 3MB > 2MB limit
    await request(app.getHttpServer())
      .post('/products/admin/import')
      .attach('file', oversized, { filename: 'huge.csv', contentType: 'text/csv' })
      .expect(413); // Multer's own limits.fileSize rejection (Payload Too Large)

    expect(importFromCsvMock).not.toHaveBeenCalled();
  });

  it('accepts a well-formed small CSV file', async () => {
    await request(app.getHttpServer())
      .post('/products/admin/import')
      .attach('file', Buffer.from('slug,price\na,10\n'), {
        filename: 'products.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    expect(importFromCsvMock).toHaveBeenCalledTimes(1);
  });
});
