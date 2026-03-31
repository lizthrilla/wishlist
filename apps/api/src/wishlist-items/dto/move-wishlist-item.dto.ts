import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import type { MoveWishlistItemInput } from '@wishlist/shared';

export class MoveWishlistItemDto implements MoveWishlistItemInput {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  wishlistId: number;
}
