import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AcceptFamilyInviteDto } from './dto/accept-family-invite.dto';
import { AddFamilyMemberDto } from './dto/add-family-member.dto';
import { CreateFamilyDto } from './dto/create-family.dto';
import { FamiliesService } from './families.service';

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

  @Get(':familyId/invites')
  listInvites(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId', ParseIntPipe) familyId: number,
  ) {
    return this.familiesService.listInvites(user.id, familyId);
  }

  @Post(':familyId/invites')
  createInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId', ParseIntPipe) familyId: number,
  ) {
    return this.familiesService.createInvite(user.id, familyId);
  }

  @Post(':familyId/members')
  addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId', ParseIntPipe) familyId: number,
    @Body() dto: AddFamilyMemberDto,
  ) {
    return this.familiesService.addMember(user.id, familyId, dto);
  }

  @Post('invites/accept')
  acceptInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptFamilyInviteDto,
  ) {
    return this.familiesService.acceptInvite(user.id, dto);
  }

  @Post('invites/:inviteId/revoke')
  @HttpCode(200)
  revokeInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId', ParseIntPipe) inviteId: number,
  ) {
    return this.familiesService.revokeInvite(user.id, inviteId);
  }
}
