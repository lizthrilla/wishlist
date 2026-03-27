import { IsNumber, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
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
  @ValidateIf((o: UpdateWishlistItemDto) => o.url !== null)
  @IsUrl()
  url?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.price !== null)
  @Type(() => Number)
  @IsNumber()
  price?: number | null;
}
