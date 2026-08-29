import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('admin/all')
  findAllAdmin() {
    return this.promotionsService.findAllAdmin();
  }

  @Post('admin')
  create(@Body() dto: CreateCouponDto) {
    return this.promotionsService.create(dto);
  }

  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
