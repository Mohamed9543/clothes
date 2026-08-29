import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon, CouponDocument, DiscountType } from './schemas/coupon.schema';

export interface CouponValidationResult {
  coupon: CouponDocument;
  discountAmount: number;
}

@Injectable()
export class PromotionsService {
  constructor(@InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>) {}

  async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
    const coupon = await this.couponModel.findOne({ code: code.trim().toUpperCase() }).exec();
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `This coupon requires a minimum order of ${coupon.minOrderAmount}`,
      );
    }

    const rawDiscount =
      coupon.discountType === DiscountType.PERCENT
        ? (subtotal * coupon.value) / 100
        : coupon.value;
    // Never discount more than the subtotal, never a negative amount.
    const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal);

    return { coupon, discountAmount };
  }

  findAllAdmin(): Promise<CouponDocument[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  create(dto: CreateCouponDto): Promise<CouponDocument> {
    return this.couponModel.create({ ...dto, code: dto.code.trim().toUpperCase() });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponDocument> {
    const coupon = await this.couponModel
      .findByIdAndUpdate(
        id,
        { ...dto, ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}) },
        { new: true },
      )
      .exec();
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Coupon not found');
    }
  }
}
