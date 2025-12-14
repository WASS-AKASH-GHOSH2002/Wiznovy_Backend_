import { Test, TestingModule } from '@nestjs/testing';
import { UserPurchaseController } from './user-purchase.controller';
import { UserPurchaseService } from './user-purchase.service';

describe('UserPurchaseController', () => {
  let controller: UserPurchaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPurchaseController],
      providers: [UserPurchaseService],
    }).compile();

    controller = module.get<UserPurchaseController>(UserPurchaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
