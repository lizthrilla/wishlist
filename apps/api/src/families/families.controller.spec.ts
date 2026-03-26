/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';

describe('FamiliesController', () => {
  let controller: FamiliesController;
  const serviceMock = {
    listFamilies: jest.fn(),
    createFamily: jest.fn(),
    listInvites: jest.fn(),
    createInvite: jest.fn(),
    acceptInvite: jest.fn(),
    revokeInvite: jest.fn(),
  } as unknown as FamiliesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamiliesController],
      providers: [{ provide: FamiliesService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FamiliesController>(FamiliesController);
    jest.clearAllMocks();
  });

  it('passes invite acceptance through to the service', async () => {
    serviceMock.acceptInvite = jest.fn().mockResolvedValue({ id: 1 });

    await controller.acceptInvite(
      { id: 7, name: 'Alice', email: 'alice@example.com' },
      { token: 'invite-token' },
    );

    expect(serviceMock.acceptInvite).toHaveBeenCalledWith(7, {
      token: 'invite-token',
    });
  });
});
