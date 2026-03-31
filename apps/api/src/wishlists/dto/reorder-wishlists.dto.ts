import { IsArray, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderWishlistsDto {
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  orderedIds: number[];
}
