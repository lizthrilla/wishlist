import { IsNotEmpty, IsString } from 'class-validator';

export class JoinFamilyDto {
  @IsString()
  @IsNotEmpty()
  joinCode: string;
}
