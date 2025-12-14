import { Test, TestingModule } from '@nestjs/testing';
import { WalkThroughService } from './walk-through.service';

describe('WalkThroughService', () => {
  let service: WalkThroughService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalkThroughService],
    }).compile();

    service = module.get<WalkThroughService>(WalkThroughService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
