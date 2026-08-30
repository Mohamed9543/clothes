import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

describe('UsersService — loyalty points', () => {
  let service: UsersService;
  let updateOneMock: jest.Mock;

  beforeEach(async () => {
    updateOneMock = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: { updateOne: (...args: unknown[]) => ({ exec: () => updateOneMock(...args) }) },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('awardPoints increments the balance', async () => {
    updateOneMock.mockResolvedValue({ matchedCount: 1 });

    await service.awardPoints('user1', 42);

    expect(updateOneMock).toHaveBeenCalledWith(
      { _id: 'user1' },
      { $inc: { loyaltyPoints: 42 } },
    );
  });

  it('does nothing when awarding zero or negative points', async () => {
    await service.awardPoints('user1', 0);
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  it('redeemPoints decrements the balance when sufficient', async () => {
    updateOneMock.mockResolvedValue({ matchedCount: 1 });

    await service.redeemPoints('user1', 20);

    expect(updateOneMock).toHaveBeenCalledWith(
      { _id: 'user1', loyaltyPoints: { $gte: 20 } },
      { $inc: { loyaltyPoints: -20 } },
    );
  });

  it('redeemPoints throws when the balance is insufficient', async () => {
    updateOneMock.mockResolvedValue({ matchedCount: 0 });

    await expect(service.redeemPoints('user1', 999)).rejects.toThrow(BadRequestException);
  });
});
