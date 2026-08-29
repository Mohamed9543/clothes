import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/schemas/user.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { SetReviewStatusDto } from './dto/set-review-status.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(@Query() query: QueryReviewsDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setStatus(@Param('id') id: string, @Body() dto: SetReviewStatusDto) {
    return this.reviewsService.setHidden(id, dto.isHidden);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  @Get('product/:slug')
  findForProduct(@Param('slug') slug: string) {
    return this.reviewsService.findForProduct(slug);
  }

  @Post('product/:slug')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.sub, slug, dto);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  report(@Param('id') id: string) {
    return this.reviewsService.report(id).then(() => ({ success: true }));
  }
}
