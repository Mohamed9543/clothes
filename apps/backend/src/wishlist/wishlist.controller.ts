import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findMine(@CurrentUser() user: JwtAccessPayload) {
    return this.wishlistService.findAllForUser(user.sub);
  }

  @Post()
  createList(@CurrentUser() user: JwtAccessPayload, @Body() dto: CreateWishlistDto) {
    return this.wishlistService.createList(user.sub, dto.name);
  }

  // Convenience endpoint for the product-card heart icon: adds/removes a
  // product from the user's default list without the frontend needing to
  // resolve the default list's id first.
  @Post('default/toggle')
  async toggleDefault(@CurrentUser() user: JwtAccessPayload, @Body() dto: AddWishlistItemDto) {
    const list = await this.wishlistService.getOrCreateDefault(user.sub);
    const isInList = list.productIds.includes(dto.productId);
    return isInList
      ? this.wishlistService.removeItem(user.sub, list._id.toString(), dto.productId)
      : this.wishlistService.addItem(user.sub, list._id.toString(), dto.productId);
  }

  @Post(':id/items')
  addItem(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: AddWishlistItemDto,
  ) {
    return this.wishlistService.addItem(user.sub, id, dto.productId);
  }

  @Delete(':id/items/:productId')
  removeItem(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeItem(user.sub, id, productId);
  }

  @Delete(':id')
  deleteList(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.wishlistService.deleteList(user.sub, id).then(() => ({ success: true }));
  }
}
