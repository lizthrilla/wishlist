import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { CreateWishlistItemInput } from '@wishlist/shared';

export class CreateWishlistItemDto implements CreateWishlistItemInput {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;
}
