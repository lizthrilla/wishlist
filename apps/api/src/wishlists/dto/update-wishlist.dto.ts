import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { UpdateWishlistInput } from '@wishlist/shared';

export class UpdateWishlistDto implements UpdateWishlistInput {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @ValidateIf((o: UpdateWishlistDto) => o.sortOrder !== null)
  @IsInt()
  sortOrder?: number | null;
}
