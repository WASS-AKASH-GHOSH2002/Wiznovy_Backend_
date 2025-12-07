import { Test, TestingModule } from '@nestjs/testing';
import { WalkThroughController } from './walk-through.controller';
import { WalkThroughService } from './walk-through.service';

describe('WalkThroughController', () => {
  let controller: WalkThroughController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalkThroughController],
      providers: [WalkThroughService],
    }).compile();

    controller = module.get<WalkThroughController>(WalkThroughController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
