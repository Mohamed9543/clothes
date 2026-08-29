import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { MoveCartItemDto } from './dto/move-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtAccessPayload) {
    return this.cartService.getEnrichedCart(user.sub);
  }

  @Post('items')
  addItem(@CurrentUser() user: JwtAccessPayload, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto.productId, dto.quantity, dto.size, dto.color);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: JwtAccessPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(user.sub, productId, dto.size, dto.color, dto.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: JwtAccessPayload,
    @Param('productId') productId: string,
    @Query('size') size: string,
    @Query('color') color: string,
  ) {
    return this.cartService.removeItem(user.sub, productId, size, color);
  }

  @Delete()
  clear(@CurrentUser() user: JwtAccessPayload) {
    return this.cartService.clear(user.sub).then(() => ({ success: true }));
  }

  @Post('items/:productId/save-for-later')
  saveForLater(
    @CurrentUser() user: JwtAccessPayload,
    @Param('productId') productId: string,
    @Body() dto: MoveCartItemDto,
  ) {
    return this.cartService.saveForLater(user.sub, productId, dto.size, dto.color);
  }

  @Post('saved/:productId/move-to-cart')
  moveToCart(
    @CurrentUser() user: JwtAccessPayload,
    @Param('productId') productId: string,
    @Body() dto: MoveCartItemDto,
  ) {
    return this.cartService.moveToCart(user.sub, productId, dto.size, dto.color);
  }
}
