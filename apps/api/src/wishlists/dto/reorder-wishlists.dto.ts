import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderWishlistsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  orderedIds: number[];
}
