import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { UpdateWishlistItemInput } from '@wishlist/shared';

export class UpdateWishlistItemDto implements UpdateWishlistItemInput {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;
}
