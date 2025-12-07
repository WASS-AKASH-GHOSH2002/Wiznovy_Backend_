import { Test, TestingModule } from '@nestjs/testing';
import { UserPurchaseService } from './user-purchase.service';

describe('UserPurchaseService', () => {
  let service: UserPurchaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPurchaseService],
    }).compile();

    service = module.get<UserPurchaseService>(UserPurchaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
