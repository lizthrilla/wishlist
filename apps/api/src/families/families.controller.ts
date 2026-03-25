import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { JoinFamilyDto } from './dto/join-family.dto';

@Controller('families')
@UseGuards(AuthGuard)
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get()
  listFamilies(@CurrentUser() user: AuthenticatedUser) {
    return this.familiesService.listFamilies(user.id);
  }

  @Post()
  createFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFamilyDto,
  ) {
    return this.familiesService.createFamily(user.id, dto);
  }

  @Post('join')
  joinFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinFamilyDto,
  ) {
    return this.familiesService.joinFamily(user.id, dto);
  }
}
