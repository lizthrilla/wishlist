import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptFamilyInviteDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
