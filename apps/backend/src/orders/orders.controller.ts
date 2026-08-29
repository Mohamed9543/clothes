import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteOrderDto } from './dto/quote-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: JwtAccessPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  // Server-computed subtotal + shipping fee for the current cart, so the
  // checkout UI never has to (and never should) compute pricing itself.
  @Post('quote')
  quote(@CurrentUser() user: JwtAccessPayload, @Body() dto: QuoteOrderDto) {
    return this.ordersService.quote(user.sub, dto);
  }

  @Get()
  findMine(@CurrentUser() user: JwtAccessPayload) {
    return this.ordersService.findAllForUser(user.sub);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user.sub);
  }

  @Get(':id/history')
  getHistory(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.ordersService.getHistory(user, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.ordersService.findOneForUser(user.sub, id);
  }
}
