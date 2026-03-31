import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
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

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.note !== null)
  @IsString()
  note?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.priority !== null)
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3])
  priority?: number | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.quantity !== null)
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity?: number | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.imageUrl !== null)
  @IsUrl()
  imageUrl?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.category !== null)
  @IsString()
  category?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.store !== null)
  @IsString()
  store?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistItemDto) => o.variant !== null)
  @IsString()
  variant?: string | null;
}
