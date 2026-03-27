import { IsInt, IsPositive } from 'class-validator';

export class AddFamilyMemberDto {
  @IsInt()
  @IsPositive()
  userId: number;
}
